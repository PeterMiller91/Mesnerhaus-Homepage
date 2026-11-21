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
/* E-Mail-Versand: per SMTP (wenn in mesnerhaus-config.php eingetragen), sonst über PHP mail().
   Jeder Versuch wird kurz protokolliert (ohne Inhalt), damit Fehler sichtbar werden. */
$GLOBALS['rv_mail_error'] = '';

function rv_mail_mode(): string { return trim((string)(tk_config()['smtp_host'] ?? '')) !== '' ? 'smtp' : 'php'; }

function rv_mail_from(): string {
    $c = tk_config();
    foreach ([$c['mail_from'] ?? '', $c['smtp_user'] ?? ''] as $a) if (filter_var((string)$a, FILTER_VALIDATE_EMAIL)) return (string)$a;
    return 'kontakt@mesnerhausarmesberg.de';
}

function rv_mail(string $to, string $subject, string $body, string $replyTo = '', string $kind = ''): bool {
    $GLOBALS['rv_mail_error'] = '';
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) { $GLOBALS['rv_mail_error'] = 'Ungültige Empfängeradresse'; return false; }
    $from = rv_mail_from();
    $host = preg_replace('/^.*@/', '', $from);
    $headers = [
        'Date: ' . date('r'),
        'From: =?UTF-8?B?' . base64_encode('Mesnerhaus am Armesberg') . '?= <' . $from . '>',
        'To: <' . $to . '>',
        'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
        'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $host . '>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
    ];
    if ($replyTo !== '' && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) $headers[] = 'Reply-To: <' . $replyTo . '>';
    $b64 = rtrim(chunk_split(base64_encode(str_replace(["\r\n", "\r"], "\n", $body)), 76, "\r\n"));

    if (rv_mail_mode() === 'smtp') {
        $ok = rv_smtp_send($from, $to, implode("\r\n", $headers) . "\r\n\r\n" . $b64);
    } elseif (!function_exists('mail')) {
        $ok = false; $GLOBALS['rv_mail_error'] = 'PHP mail() ist auf dem Server deaktiviert';
    } else {
        // mail() setzt To und Subject selbst
        $extra = array_values(array_filter($headers, function ($h) { return stripos($h, 'To:') !== 0 && stripos($h, 'Subject:') !== 0; }));
        $ok = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $b64, implode("\r\n", $extra), '-f' . $from);
        if (!$ok) { $e = error_get_last(); $GLOBALS['rv_mail_error'] = 'PHP mail() meldet einen Fehler' . ($e ? ': ' . $e['message'] : ''); }
    }
    rv_mail_log($to, $kind ?: $subject, $ok, (string)$GLOBALS['rv_mail_error']);
    return $ok;
}

function rv_mail_log(string $to, string $what, bool $ok, string $err): void {
    $masked = preg_replace('/^(.).*(@.*)$/', '$1***$2', $to);
    $log = rv_read_json('resv-maillog', []);
    array_unshift($log, ['at' => date('c'), 'to' => $masked, 'what' => function_exists('mb_substr') ? mb_substr($what, 0, 60) : substr($what, 0, 60),
        'mode' => rv_mail_mode(), 'ok' => $ok, 'error' => substr($err, 0, 200)]);
    rv_write_json('resv-maillog', array_slice($log, 0, 25));
}

/* Minimaler SMTP-Client: SSL (Port 465) oder STARTTLS (Port 587), AUTH LOGIN. */
function rv_smtp_send(string $from, string $to, string $data): bool {
    $c = tk_config();
    $host = (string)$c['smtp_host'];
    $port = (int)($c['smtp_port'] ?? 587);
    $sec  = strtolower((string)($c['smtp_secure'] ?? ($port === 465 ? 'ssl' : 'tls')));
    $user = (string)($c['smtp_user'] ?? '');
    $pass = (string)($c['smtp_pass'] ?? '');
    $fail = function (string $m) use (&$fp) { $GLOBALS['rv_mail_error'] = 'SMTP: ' . $m; if (is_resource($fp)) { @fwrite($fp, "QUIT\r\n"); @fclose($fp); } return false; };

    $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'SNI_enabled' => true, 'peer_name' => $host]]);
    $fp = @stream_socket_client(($sec === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
    if (!$fp) return $fail("Keine Verbindung zu $host:$port ($errstr)");
    stream_set_timeout($fp, 20);

    $read = function () use (&$fp): string {
        $out = '';
        while (($line = fgets($fp, 1024)) !== false) { $out .= $line; if (strlen($line) < 4 || $line[3] === ' ') break; }
        return $out;
    };
    $cmd = function (string $c, array $okCodes) use (&$fp, $read): array {
        if ($c !== '') fwrite($fp, $c . "\r\n");
        $r = $read();
        return [in_array((int)substr($r, 0, 3), $okCodes, true), trim($r)];
    };

    [$ok, $r] = $cmd('', [220]);                       if (!$ok) return $fail("Begrüßung: $r");
    $me = preg_replace('/[^a-z0-9.\-]/i', '', (string)($_SERVER['SERVER_NAME'] ?? 'localhost')) ?: 'localhost';
    [$ok, $r] = $cmd("EHLO $me", [250]);               if (!$ok) return $fail("EHLO: $r");
    if ($sec === 'tls') {
        [$ok, $r] = $cmd('STARTTLS', [220]);            if (!$ok) return $fail("STARTTLS: $r");
        $m = STREAM_CRYPTO_METHOD_TLS_CLIENT;
        if (defined('STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT')) $m |= STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
        if (defined('STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT')) $m |= STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT;
        if (!@stream_socket_enable_crypto($fp, true, $m)) return $fail('TLS-Verschlüsselung fehlgeschlagen (Zertifikat?)');
        [$ok, $r] = $cmd("EHLO $me", [250]);           if (!$ok) return $fail("EHLO nach TLS: $r");
    }
    if ($user !== '') {
        [$ok, $r] = $cmd('AUTH LOGIN', [334]);          if (!$ok) return $fail("AUTH: $r");
        [$ok, $r] = $cmd(base64_encode($user), [334]);  if (!$ok) return $fail("Benutzername abgelehnt: $r");
        [$ok, $r] = $cmd(base64_encode($pass), [235]);  if (!$ok) return $fail("Anmeldung fehlgeschlagen (Benutzer/Passwort prüfen): $r");
    }
    [$ok, $r] = $cmd("MAIL FROM:<$from>", [250]);       if (!$ok) return $fail("Absender abgelehnt: $r");
    [$ok, $r] = $cmd("RCPT TO:<$to>", [250, 251]);      if (!$ok) return $fail("Empfänger abgelehnt: $r");
    [$ok, $r] = $cmd('DATA', [354]);                    if (!$ok) return $fail("DATA: $r");
    $data = preg_replace('/^\./m', '..', str_replace(["\r\n", "\r", "\n"], ["\n", "\n", "\r\n"], $data));
    [$ok, $r] = $cmd($data . "\r\n.", [250]);           if (!$ok) return $fail("Nachricht abgelehnt: $r");
    @fwrite($fp, "QUIT\r\n"); @fclose($fp);
    return true;
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

/* ── E-Mail-Vorlagen (in der Verwaltung bearbeitbar) ─────────── */
const RV_PLACEHOLDERS = [
    'name'        => 'Name des Gastes',
    'datum'       => 'z. B. Sonntag, 22.11.2026',
    'uhrzeit'     => 'z. B. 12:00',
    'personen'    => 'z. B. 4 Personen',
    'wunsch'      => 'Wunsch des Gastes (leer, wenn keiner)',
    'storno_link' => 'Link zum Stornieren',
    'telefon'     => 'Telefonnummer des Mesnerhaus',
    'adresse'     => 'Adresse des Mesnerhaus',
];

function rv_template_defaults(): array {
    return [
        'confirm' => [
            'label'   => 'Bestätigung an den Gast',
            'subject' => 'Ihre Reservierung im Mesnerhaus: {datum} um {uhrzeit} Uhr',
            'body'    => "Grüß Gott {name},\n\nIhre Reservierung im Mesnerhaus am Armesberg ist bestätigt:\n\n  {datum} um {uhrzeit} Uhr\n  {personen}\n  Ihr Wunsch: {wunsch}\n\nAdresse: {adresse}\n\nFalls Sie nicht kommen können, stornieren Sie bitte hier, damit andere Gäste den Platz bekommen:\n{storno_link}\n\nWir freuen uns auf Sie!\nIhr Mesnerhaus am Armesberg\nTel. {telefon}",
        ],
        'cancel' => [
            'label'   => 'Storno-Bestätigung an den Gast',
            'subject' => 'Ihre Reservierung am {datum} ist storniert',
            'body'    => "Grüß Gott {name},\n\nIhre Reservierung im Mesnerhaus am Armesberg für {datum} um {uhrzeit} Uhr ({personen}) ist storniert.\n\nSchade, dass es diesmal nicht klappt. Wir freuen uns, wenn Sie ein anderes Mal vorbeikommen.\n\nIhr Mesnerhaus am Armesberg\nTel. {telefon}",
        ],
    ];
}

function rv_templates(): array {
    $saved = rv_read_json('resv-templates', []);
    $out = [];
    foreach (rv_template_defaults() as $k => $d) {
        $out[$k] = [
            'label'   => $d['label'],
            'subject' => is_string($saved[$k]['subject'] ?? null) && trim($saved[$k]['subject']) !== '' ? $saved[$k]['subject'] : $d['subject'],
            'body'    => is_string($saved[$k]['body'] ?? null) && trim($saved[$k]['body']) !== '' ? $saved[$k]['body'] : $d['body'],
        ];
    }
    return $out;
}

/* Platzhalter ersetzen. Eine Zeile, deren Platzhalter leer bleibt (z. B. „Ihr Wunsch: {wunsch}“), entfällt. */
function rv_render(string $tpl, array $r): string {
    $p = (int)$r['persons'];
    $vals = [
        'name' => (string)$r['name'], 'datum' => rv_date_de((string)$r['date']), 'uhrzeit' => (string)$r['time'],
        'personen' => $p . ' ' . ($p === 1 ? 'Person' : 'Personen'), 'wunsch' => trim((string)($r['note'] ?? '')),
        'storno_link' => rv_site_url() . '/reservierung-stornieren.php?t=' . ($r['token'] ?? ''),
        'telefon' => '0151 110 56 281', 'adresse' => 'Armesberg 2, 95508 Kulmain',
    ];
    $lines = [];
    foreach (preg_split('/\r\n|\r|\n/', $tpl) as $line) {
        $empty = false;
        $line = preg_replace_callback('/\{([a-z_]+)\}/', function ($m) use ($vals, &$empty) {
            if (!array_key_exists($m[1], $vals)) return $m[0];
            if ($vals[$m[1]] === '') $empty = true;
            return $vals[$m[1]];
        }, $line);
        if (!$empty) $lines[] = $line;
    }
    return preg_replace("/\n{3,}/", "\n\n", implode("\n", $lines));
}

function rv_mail_template(string $key, array $r, string $to = ''): bool {
    $t = rv_templates()[$key] ?? null;
    if (!$t) return false;
    $subject = str_replace(["\r", "\n"], ' ', rv_render($t['subject'], $r));
    return rv_mail($to !== '' ? $to : (string)$r['email'], $subject, rv_render($t['body'], $r) . "\n", '', $t['label']);
}

function rv_mail_guest_confirm(array $r): bool { return rv_mail_template('confirm', $r); }
function rv_mail_guest_cancel(array $r): bool { return ($r['email'] ?? '') !== '' && rv_mail_template('cancel', $r); }

/* Beispiel-Reservierung für Vorschau und Testversand */
function rv_sample_reservation(): array {
    $d = date('Y-m-d', strtotime('next sunday'));
    return ['name' => 'Familie Beispiel', 'date' => $d, 'time' => '12:00', 'persons' => 4, 'note' => 'Bitte einen Kinderstuhl', 'token' => str_repeat('0', 32), 'email' => ''];
}

function rv_mail_owner(array $r, string $what): bool {
    $s = rv_settings();
    $to = $s['notify_email'] !== '' ? (string)$s['notify_email'] : 'kontakt@mesnerhausarmesberg.de';
    $body = "$what\n\n"
        . rv_date_de($r['date']) . ", " . $r['time'] . " Uhr\n"
        . $r['persons'] . " Personen · " . $r['name'] . "\n"
        . "Telefon: " . ($r['phone'] ?: '–') . "\nE-Mail: " . ($r['email'] ?: '–') . "\n"
        . ($r['note'] !== '' ? "Wunsch: " . $r['note'] . "\n" : '')
        . "\nZur Übersicht: " . rv_site_url() . "/reservierungen/verwaltung/\n";
    return rv_mail($to, $what . ': ' . date('d.m.', strtotime($r['date'])) . ' ' . $r['time'] . ', ' . $r['persons'] . ' P., ' . $r['name'], $body, (string)$r['email'], 'Info an Betrieb: ' . $what);
}

/* ── Benutzer & Anmeldung ────────────────────────────────────── */
function rv_users(): array { return rv_read_json('resv-users', ['users' => []])['users'] ?? []; }
function rv_save_users(array $u): bool { return rv_write_json('resv-users', ['users' => $u]); }

function rv_session_start(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_name('mh_resv');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/reservierungen/verwaltung/', 'secure' => !empty($_SERVER['HTTPS']), 'httponly' => true, 'samesite' => 'Strict']);
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
