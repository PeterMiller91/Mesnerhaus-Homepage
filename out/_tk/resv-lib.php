<?php
/* Reservierungen: Speicher, Platzberechnung, Logins, E-Mails.
   Speichert JSON-Dateien im selben Ordner wie die Tageskarte (tk_dir()).
   Direkter Aufruf → 404. PHP 7.4-kompatibel.                               */
declare(strict_types=1);

if (realpath((string)($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(404); exit; }

require_once __DIR__ . '/tageskarte-lib.php';
date_default_timezone_set('Europe/Berlin');

const RV_STATUSES = ['bestaetigt', 'erschienen', 'storniert', 'abgelehnt', 'nicht_erschienen'];
const RV_ACTIVE   = ['bestaetigt', 'erschienen'];     // belegen Plätze
const RV_SOURCES  = ['online', 'telefon', 'whatsapp', 'email', 'vor_ort'];
const RV_KEEP_DAYS = 60;                               // Löschfrist nach dem Termin

/* ── Einstellungen ───────────────────────────────────────────── */
function rv_default_settings(): array {
    return [
        'seats'          => 54,       // Plätze gesamt
        'online_seats'   => 54,       // davon online buchbar
        'duration'       => 120,      // Minuten pro Reservierung
        'interval'       => 30,       // Raster der Uhrzeiten
        'max_online'     => 8,        // größte Gruppe online
        'cutoff_hours'   => 2,        // so viele Stunden vorher endet die Online-Buchung
        'days_ahead'     => 60,       // so weit im Voraus buchbar
        'online_enabled' => true,
        // 0 = Sonntag … 6 = Samstag; last = letzte Ankunftszeit
        'week'           => ['0' => ['open' => '11:00', 'close' => '17:00', 'last' => '15:30']],
        'closed_dates'   => [],       // ["2026-12-24", …]
        'notify_email'   => '',       // leer = Kontaktadresse
    ];
}

/* Daten liegen als .php-Dateien mit „exit“ am Anfang: Selbst wenn der Speicherordner
   im Webroot liegt, liefert der Server beim Aufruf nur eine leere Seite aus.        */
const RV_GUARD = "<?php http_response_code(404); exit; ?>\n";

function rv_file(string $name): string { return tk_dir() . '/' . $name . '.php'; }

function rv_read_json(string $name, $default) {
    $f = rv_file($name);
    if (!@is_file($f)) return $default;
    $raw = (string)@file_get_contents($f);
    if (strncmp($raw, RV_GUARD, strlen(RV_GUARD)) === 0) $raw = substr($raw, strlen(RV_GUARD));
    $d = json_decode($raw, true);
    return is_array($d) ? $d : $default;
}

function rv_write_json(string $name, array $data): bool {
    $dir = tk_dir();
    if (!@is_dir($dir) && !@mkdir($dir, 0755, true)) return false;
    return tk_save_atomic(rv_file($name), RV_GUARD . (string)json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

function rv_settings(): array {
    $s = array_replace(rv_default_settings(), rv_read_json('resv-settings', []));
    if (!is_array($s['week'])) $s['week'] = rv_default_settings()['week'];
    return $s;
}

/* ── Reservierungen laden/speichern (mit Dateisperre) ────────── */
function rv_with_lock(callable $fn) {
    $dir = tk_dir();
    if (!@is_dir($dir)) @mkdir($dir, 0755, true);
    $lock = @fopen("$dir/resv-lock.php", 'c');
    if ($lock) flock($lock, LOCK_EX);
    try { return $fn(); }
    finally { if ($lock) { flock($lock, LOCK_UN); fclose($lock); } }
}

function rv_load(): array {
    $d = rv_read_json('resv-data', ['next_id' => 1, 'items' => []]);
    $limit = date('Y-m-d', strtotime('-' . RV_KEEP_DAYS . ' days'));
    $d['items'] = array_values(array_filter($d['items'] ?? [], function ($r) use ($limit) { return ($r['date'] ?? '') >= $limit; }));
    return $d;
}

function rv_save(array $d): bool { return rv_write_json('resv-data', $d); }

/* ── Zeit & Kapazität ────────────────────────────────────────── */
function rv_min(string $hhmm): int { [$h, $m] = array_map('intval', explode(':', $hhmm)); return $h * 60 + $m; }
function rv_hhmm(int $min): string { return sprintf('%02d:%02d', intdiv($min, 60), $min % 60); }
function rv_valid_date(string $d): bool { return (bool)preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) && strtotime($d) !== false; }

/* Öffnungszeit eines Datums oder null (geschlossen). */
function rv_day(array $s, string $date): ?array {
    if (in_array($date, $s['closed_dates'] ?? [], true)) return null;
    $wd = (string)date('w', strtotime($date));
    $day = $s['week'][$wd] ?? null;
    return is_array($day) && !empty($day['open']) ? $day : null;
}

/* Alle Ankunftszeiten eines Tages. */
function rv_slots(array $s, array $day): array {
    $out = [];
    $last = rv_min($day['last'] ?? rv_hhmm(rv_min($day['close']) - 60));
    for ($m = rv_min($day['open']); $m <= $last; $m += max(15, (int)$s['interval'])) $out[] = rv_hhmm($m);
    return $out;
}

/* Belegte Plätze zu einer Minute (alle aktiven Reservierungen, die dann am Tisch sitzen). */
function rv_occupied(array $items, string $date, int $minute, int $duration, int $ignoreId = 0): int {
    $sum = 0;
    foreach ($items as $r) {
        if ($r['date'] !== $date || !in_array($r['status'], RV_ACTIVE, true) || (int)$r['id'] === $ignoreId) continue;
        $start = rv_min($r['time']);
        if ($minute >= $start && $minute < $start + $duration) $sum += (int)$r['persons'];
    }
    return $sum;
}

/* Höchste Belegung im Zeitraum [start, start+duration). */
function rv_peak(array $items, string $date, string $time, int $duration, int $ignoreId = 0): int {
    $start = rv_min($time); $peak = 0;
    for ($m = $start; $m < $start + $duration; $m += 15) $peak = max($peak, rv_occupied($items, $date, $m, $duration, $ignoreId));
    return $peak;
}

/* Freie Plätze für eine neue Reservierung zu dieser Zeit (online: online_seats, intern: seats). */
function rv_free(array $s, array $items, string $date, string $time, bool $online, int $ignoreId = 0): int {
    $cap = $online ? (int)$s['online_seats'] : (int)$s['seats'];
    return max(0, $cap - rv_peak($items, $date, $time, (int)$s['duration'], $ignoreId));
}

/* Ist ein Termin online noch buchbar (Vorlauf / Zukunft)? */
function rv_bookable_time(array $s, string $date, string $time): bool {
    $ts = strtotime("$date $time");
    return $ts !== false && $ts - time() >= (int)$s['cutoff_hours'] * 3600
        && $ts - time() <= ((int)$s['days_ahead'] + 1) * 86400;
}

/* ── Gäste-Daten prüfen ──────────────────────────────────────── */
function rv_clean(string $v, int $max): string {
    $v = trim(preg_replace('/\s+/u', ' ', $v) ?? '');
    return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}

function rv_new_token(): string { return bin2hex(random_bytes(16)); }

/* ── E-Mails ─────────────────────────────────────────────────── */
function rv_mail(string $to, string $subject, string $body, string $replyTo = ''): bool {
    if (!filter_var($to, FILTER_VALIDATE_EMAIL) || !function_exists('mail')) return false;
    $from = (string)(tk_config()['mail_from'] ?? 'kontakt@mesnerhausarmesberg.de');
    $headers = [
        'From: Mesnerhaus am Armesberg <' . $from . '>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ];
    if ($replyTo !== '' && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) $headers[] = 'Reply-To: ' . $replyTo;
    $subj = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    return @mail($to, $subj, $body, implode("\r\n", $headers), '-f' . $from);
}

function rv_site_url(): string {
    $u = rtrim((string)(tk_config()['site_url'] ?? ''), '/');
    if ($u !== '') return $u;
    $host = preg_replace('/[^a-z0-9.\-:]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'mesnerhausarmesberg.de'));
    return 'https://' . $host;
}

function rv_date_de(string $date): string {
    $tage = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    $ts = strtotime($date);
    return $tage[(int)date('w', $ts)] . ', ' . date('d.m.Y', $ts);
}

function rv_mail_guest_confirm(array $r): bool {
    $link = rv_site_url() . '/reservierung-stornieren.php?t=' . $r['token'];
    $body = "Grüß Gott " . $r['name'] . ",\n\n"
        . "Ihre Reservierung im Mesnerhaus am Armesberg ist bestätigt:\n\n"
        . "  " . rv_date_de($r['date']) . " um " . $r['time'] . " Uhr\n"
        . "  " . $r['persons'] . " " . ((int)$r['persons'] === 1 ? 'Person' : 'Personen') . "\n"
        . ($r['note'] !== '' ? "  Ihr Wunsch: " . $r['note'] . "\n" : '')
        . "\nAdresse: Armesberg 2, 95508 Kulmain\n\n"
        . "Falls Sie nicht kommen können, stornieren Sie bitte hier, damit andere Gäste den Platz bekommen:\n$link\n\n"
        . "Wir freuen uns auf Sie!\nIhr Mesnerhaus am Armesberg\nTel. 0151 110 56 281\n";
    return rv_mail((string)$r['email'], 'Ihre Reservierung im Mesnerhaus: ' . date('d.m.', strtotime($r['date'])) . ' um ' . $r['time'] . ' Uhr', $body);
}

function rv_mail_owner(array $r, string $what): bool {
    $s = rv_settings();
    $to = $s['notify_email'] !== '' ? (string)$s['notify_email'] : (string)(tk_config()['mail_from'] ?? 'kontakt@mesnerhausarmesberg.de');
    $body = "$what\n\n"
        . rv_date_de($r['date']) . ", " . $r['time'] . " Uhr\n"
        . $r['persons'] . " Personen · " . $r['name'] . "\n"
        . "Telefon: " . ($r['phone'] ?: '–') . "\nE-Mail: " . ($r['email'] ?: '–') . "\n"
        . ($r['note'] !== '' ? "Wunsch: " . $r['note'] . "\n" : '')
        . "\nZur Übersicht: " . rv_site_url() . "/reservierungen/\n";
    return rv_mail($to, $what . ': ' . date('d.m.', strtotime($r['date'])) . ' ' . $r['time'] . ', ' . $r['persons'] . ' P., ' . $r['name'], $body, (string)$r['email']);
}

/* ── Benutzer & Anmeldung ────────────────────────────────────── */
function rv_users(): array { return rv_read_json('resv-users', ['users' => []])['users'] ?? []; }
function rv_save_users(array $u): bool { return rv_write_json('resv-users', ['users' => $u]); }

function rv_session_start(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_name('mh_resv');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/reservierungen/', 'secure' => !empty($_SERVER['HTTPS']), 'httponly' => true, 'samesite' => 'Strict']);
    session_start();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
    // nach 14 Tagen ohne Nutzung neu anmelden
    if (!empty($_SESSION['last']) && time() - (int)$_SESSION['last'] > 14 * 86400) { $_SESSION = []; session_regenerate_id(true); $_SESSION['csrf'] = bin2hex(random_bytes(16)); }
    $_SESSION['last'] = time();
}

function rv_current_user(): ?array {
    $id = $_SESSION['user'] ?? null;
    if (!is_string($id)) return null;
    $u = rv_users()[$id] ?? null;
    return $u ? ['id' => $id, 'name' => $u['name'], 'role' => $u['role']] : null;
}

/* Einfache Bremse gegen Passwort-Raten: max. 8 Fehlversuche je IP in 15 Minuten. */
function rv_login_blocked(): bool {
    $ip = hash('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? ''));
    $log = rv_read_json('resv-login', []);
    $recent = array_filter($log[$ip] ?? [], function ($t) { return $t > time() - 900; });
    return count($recent) >= 8;
}

function rv_login_failed(): void {
    $ip = hash('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? ''));
    $log = rv_read_json('resv-login', []);
    foreach ($log as $k => $ts) { $log[$k] = array_values(array_filter($ts, function ($t) { return $t > time() - 900; })); if (!$log[$k]) unset($log[$k]); }
    $log[$ip][] = time();
    rv_write_json('resv-login', $log);
}

/* Max. 5 Online-Buchungen je IP und Stunde. */
function rv_rate_ok(): bool {
    $ip = hash('sha256', 'b' . (string)($_SERVER['REMOTE_ADDR'] ?? ''));
    $log = rv_read_json('resv-rate', []);
    foreach ($log as $k => $ts) { $log[$k] = array_values(array_filter($ts, function ($t) { return $t > time() - 3600; })); if (!$log[$k]) unset($log[$k]); }
    if (count($log[$ip] ?? []) >= 5) { rv_write_json('resv-rate', $log); return false; }
    $log[$ip][] = time();
    rv_write_json('resv-rate', $log);
    return true;
}

/* Öffentliche Sicht auf eine Reservierung (ohne interne Felder). */
function rv_public_view(array $r): array {
    return ['date' => $r['date'], 'time' => $r['time'], 'persons' => (int)$r['persons'], 'name' => $r['name'], 'status' => $r['status']];
}
