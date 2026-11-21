<?php
/* JSON-Schnittstelle der Reservierungs-App (nur angemeldet). */
declare(strict_types=1);

require dirname(__DIR__, 2) . '/_tk/resv-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

rv_session_start();
function out(int $code, array $data): void { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }

$me = rv_current_user();
if (!$me) out(401, ['ok' => false, 'message' => 'Bitte neu anmelden.']);
$isAdmin = $me['role'] === 'admin';
$s = rv_settings();

/* ── Lesen ───────────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['templates'])) {
        if (!$isAdmin) out(403, ['ok' => false]);
        $sample = rv_sample_reservation();
        out(200, ['ok' => true, 'templates' => rv_templates(), 'defaults' => rv_template_defaults(), 'placeholders' => RV_PLACEHOLDERS,
            'sample' => ['name' => $sample['name'], 'datum' => rv_date_de($sample['date']), 'uhrzeit' => $sample['time'], 'personen' => '4 Personen',
                'wunsch' => $sample['note'], 'storno_link' => rv_site_url() . '/reservierung-stornieren.php?t=…', 'telefon' => '0151 110 56 281', 'adresse' => 'Armesberg 2, 95508 Kulmain']]);
    }
    if (isset($_GET['settings'])) {
        if (!$isAdmin) out(403, ['ok' => false]);
        $users = array_map(function ($id, $u) { return ['id' => $id, 'name' => $u['name'], 'role' => $u['role']]; }, array_keys(rv_users()), rv_users());
        $c = tk_config();
        $mail = ['mode' => rv_mail_mode(), 'from' => rv_mail_from(), 'smtp_host' => (string)($c['smtp_host'] ?? ''), 'smtp_port' => (int)($c['smtp_port'] ?? 0),
                 'log' => rv_read_json('resv-maillog', [])];
        out(200, ['ok' => true, 'settings' => $s, 'users' => $users, 'mail' => $mail]);
    }

    $date = (string)($_GET['day'] ?? date('Y-m-d'));
    if (!rv_valid_date($date)) $date = date('Y-m-d');
    $all = rv_load()['items'];
    $day = rv_day($s, $date);

    $items = array_values(array_filter($all, function ($r) use ($date) { return $r['date'] === $date; }));
    usort($items, function ($a, $b) { return [$a['time'], $a['id']] <=> [$b['time'], $b['id']]; });
    $items = array_map(function ($r) { unset($r['token']); return $r; }, $items);

    // Auslastung im 30-Minuten-Raster (Öffnungszeit, sonst 10–20 Uhr für Feiern)
    $from = $day ? rv_min($day['open']) : 600; $to = $day ? rv_min($day['close']) : 1200;
    $load = [];
    for ($m = $from; $m < $to; $m += 30) {
        $g = rv_occupied($all, $date, $m, (int)$s['duration']);
        $load[] = ['time' => rv_hhmm($m), 'guests' => $g, 'pct' => min(100, (int)round($g / max(1, (int)$s['seats']) * 100))];
    }

    $active = array_filter($items, function ($r) { return in_array($r['status'], RV_ACTIVE, true); });
    // Nächste Tage mit Reservierungen bzw. Öffnung
    $next = [];
    for ($i = 0; $i < 70 && count($next) < 6; $i++) {
        $d = date('Y-m-d', strtotime("+$i days"));
        $cnt = 0; $g = 0;
        foreach ($all as $r) if ($r['date'] === $d && in_array($r['status'], RV_ACTIVE, true)) { $cnt++; $g += (int)$r['persons']; }
        if ($cnt > 0 || rv_day($s, $d)) $next[] = ['date' => $d, 'label' => rv_date_de($d), 'count' => $cnt, 'guests' => $g, 'open' => (bool)rv_day($s, $d)];
    }
    $unseen = array_values(array_map(function ($r) { return ['id' => $r['id'], 'date' => $r['date'], 'time' => $r['time'], 'name' => $r['name'], 'persons' => (int)$r['persons'], 'status' => $r['status']]; },
        array_filter($all, function ($r) { return empty($r['seen']) && $r['date'] >= date('Y-m-d'); })));

    out(200, [
        'ok' => true, 'date' => $date, 'label' => rv_date_de($date), 'open' => $day,
        'slots' => $day ? rv_slots($s, $day) : [],
        'seats' => (int)$s['seats'], 'duration' => (int)$s['duration'], 'online_enabled' => (bool)$s['online_enabled'],
        'items' => $items, 'load' => $load,
        'stats' => ['count' => count($active), 'guests' => array_sum(array_map(function ($r) { return (int)$r['persons']; }, $active)), 'peak' => $load ? max(array_column($load, 'guests')) : 0],
        'next' => $next, 'unseen' => $unseen,
    ]);
}

/* ── Schreiben ───────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['ok' => false]);
if (!hash_equals((string)$_SESSION['csrf'], (string)($_SERVER['HTTP_X_CSRF'] ?? ''))) out(403, ['ok' => false, 'message' => 'Sitzung abgelaufen. Bitte Seite neu laden.']);
$in = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($in)) out(400, ['ok' => false]);
$act = (string)($in['action'] ?? '');

if ($act === 'save') {
    $id      = (int)($in['id'] ?? 0);
    $date    = (string)($in['date'] ?? '');
    $time    = (string)($in['time'] ?? '');
    $persons = (int)($in['persons'] ?? 0);
    $name    = rv_clean((string)($in['name'] ?? ''), 80);
    if (!rv_valid_date($date) || !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $time)) out(400, ['ok' => false, 'message' => 'Bitte Datum und Uhrzeit angeben.']);
    if ($persons < 1 || $persons > 200) out(400, ['ok' => false, 'message' => 'Bitte die Personenzahl angeben.']);
    if ($name === '') out(400, ['ok' => false, 'message' => 'Bitte einen Namen angeben.']);
    $email = rv_clean((string)($in['email'] ?? ''), 120);
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) out(400, ['ok' => false, 'message' => 'Die E-Mail-Adresse ist ungültig.']);
    $source = in_array($in['source'] ?? '', RV_SOURCES, true) ? $in['source'] : 'telefon';
    if ($id === 0 && $source !== 'vor_ort') {
        if (strlen(preg_replace('/\D/', '', (string)($in['phone'] ?? ''))) < 6) out(400, ['ok' => false, 'message' => 'Bitte eine Telefonnummer eintragen.']);
        if ($email === '') out(400, ['ok' => false, 'message' => 'Bitte eine E-Mail-Adresse eintragen.']);
    }
    $status = in_array($in['status'] ?? '', RV_STATUSES, true) ? $in['status'] : 'bestaetigt';

    $res = rv_with_lock(function () use ($s, $id, $date, $time, $persons, $name, $email, $source, $status, $in, $me) {
        $d = rv_load();
        $free = rv_free($s, $d['items'], $date, $time, false, $id);
        if (in_array($status, RV_ACTIVE, true) && $persons > $free && empty($in['force'])) return ['warn' => $free];
        $fields = [
            'date' => $date, 'time' => $time, 'persons' => $persons, 'name' => $name, 'email' => $email,
            'phone' => rv_clean((string)($in['phone'] ?? ''), 40), 'note' => rv_clean((string)($in['note'] ?? ''), 300),
            'table' => rv_clean((string)($in['table'] ?? ''), 30), 'status' => $status, 'updated' => date('c'), 'by' => $me['name'],
        ];
        if ($id > 0) {
            foreach ($d['items'] as $i => $r) if ((int)$r['id'] === $id) { $d['items'][$i] = array_merge($r, $fields, ['seen' => true]); $saved = $d['items'][$i]; }
            if (empty($saved)) return ['missing' => true];
        } else {
            $saved = array_merge($fields, ['id' => (int)$d['next_id'], 'source' => $source, 'seen' => true, 'token' => rv_new_token(), 'created' => date('c')]);
            $d['next_id']++; $d['items'][] = $saved;
        }
        return rv_save($d) ? ['item' => $saved, 'new' => $id === 0] : ['fail' => true];
    });
    if (isset($res['warn'])) out(409, ['ok' => false, 'over' => true, 'message' => 'Zu dieser Zeit sind nur noch ' . $res['warn'] . ' Plätze frei. Trotzdem eintragen?']);
    if (!empty($res['missing'])) out(404, ['ok' => false, 'message' => 'Reservierung nicht gefunden.']);
    if (!empty($res['fail'])) out(500, ['ok' => false, 'message' => 'Speichern fehlgeschlagen.']);
    $mailed = false;
    if ($res['new'] && !empty($in['send_mail']) && $res['item']['email'] !== '') $mailed = rv_mail_guest_confirm($res['item']);
    out(200, ['ok' => true, 'id' => $res['item']['id'], 'mailed' => $mailed]);
}

if ($act === 'status') {
    $id = (int)($in['id'] ?? 0); $status = (string)($in['status'] ?? '');
    if (!in_array($status, RV_STATUSES, true)) out(400, ['ok' => false]);
    $item = rv_with_lock(function () use ($id, $status, $me) {
        $d = rv_load();
        foreach ($d['items'] as $i => $r) if ((int)$r['id'] === $id) {
            $d['items'][$i]['status'] = $status; $d['items'][$i]['seen'] = true;
            $d['items'][$i]['updated'] = date('c'); $d['items'][$i]['by'] = $me['name'];
            return rv_save($d) ? $d['items'][$i] : null;
        }
        return null;
    });
    $mailed = $item && $status === 'storniert' && !empty($in['notify']) && rv_mail_guest_cancel($item);
    out($item ? 200 : 404, ['ok' => (bool)$item, 'mailed' => $mailed]);
}

if ($act === 'seen') {
    $ids = array_map('intval', (array)($in['ids'] ?? []));
    rv_with_lock(function () use ($ids) {
        $d = rv_load(); $ch = false;
        foreach ($d['items'] as $i => $r) if (in_array((int)$r['id'], $ids, true) && empty($r['seen'])) { $d['items'][$i]['seen'] = true; $ch = true; }
        if ($ch) rv_save($d);
    });
    out(200, ['ok' => true]);
}

if ($act === 'password') {
    $users = rv_users(); $u = $users[$me['id']] ?? null;
    $new = (string)($in['new'] ?? '');
    if (!$u || !password_verify((string)($in['old'] ?? ''), (string)$u['hash'])) out(400, ['ok' => false, 'message' => 'Das bisherige Passwort stimmt nicht.']);
    if (strlen($new) < 10) out(400, ['ok' => false, 'message' => 'Das neue Passwort braucht mindestens 10 Zeichen.']);
    $users[$me['id']]['hash'] = password_hash($new, PASSWORD_DEFAULT);
    out(rv_save_users($users) ? 200 : 500, ['ok' => true, 'message' => 'Passwort geändert.']);
}

if (!$isAdmin) out(403, ['ok' => false, 'message' => 'Nur für Admins.']);

if ($act === 'settings') {
    $n = (array)($in['settings'] ?? []);
    $int = function ($k, $min, $max) use ($n, $s) { return max($min, min($max, (int)($n[$k] ?? $s[$k]))); };
    $week = [];
    foreach ((array)($n['week'] ?? []) as $wd => $day) {
        if (!preg_match('/^[0-6]$/', (string)$wd) || !is_array($day)) continue;
        $ok = true; foreach (['open', 'close', 'last'] as $k) $ok = $ok && preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', (string)($day[$k] ?? ''));
        if ($ok && rv_min($day['open']) < rv_min($day['last']) + 1 && rv_min($day['last']) < rv_min($day['close'])) $week[(string)$wd] = ['open' => $day['open'], 'close' => $day['close'], 'last' => $day['last']];
    }
    $closed = array_values(array_unique(array_filter(array_map('strval', (array)($n['closed_dates'] ?? [])), 'rv_valid_date')));
    sort($closed);
    $mail = trim((string)($n['notify_email'] ?? ''));
    $new = [
        'seats' => $int('seats', 1, 500), 'duration' => $int('duration', 30, 360), 'interval' => in_array((int)($n['interval'] ?? 30), [15, 30, 60], true) ? (int)$n['interval'] : 30,
        'max_online' => $int('max_online', 1, 50), 'cutoff_hours' => $int('cutoff_hours', 0, 72), 'days_ahead' => $int('days_ahead', 1, 365),
        'online_enabled' => !empty($n['online_enabled']), 'week' => $week, 'closed_dates' => $closed,
        'notify_email' => filter_var($mail, FILTER_VALIDATE_EMAIL) ? $mail : '',
    ];
    $new['online_seats'] = max(0, min($new['seats'], (int)($n['online_seats'] ?? $new['seats'])));
    out(rv_write_json('resv-settings', $new) ? 200 : 500, ['ok' => true, 'message' => 'Einstellungen gespeichert.']);
}

if ($act === 'mail_test') {
    $to = trim((string)($in['to'] ?? ''));
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) out(400, ['ok' => false, 'message' => 'Bitte eine gültige E-Mail-Adresse eingeben.']);
    $ok = rv_mail($to, 'Test-E-Mail der Reservierungs-App', "Diese Test-E-Mail kommt von der Reservierungs-App des Mesnerhaus.\n\nWenn Sie sie lesen, funktioniert der Versand.\n\nVersandweg: " . (rv_mail_mode() === 'smtp' ? 'SMTP' : 'PHP mail() des Webservers') . "\nAbsender: " . rv_mail_from() . "\n", '', 'Test-E-Mail');
    out(200, ['ok' => $ok, 'message' => $ok
        ? 'Der Server hat die Test-E-Mail angenommen. Bitte Posteingang und Spam-Ordner prüfen.'
        : 'Versand fehlgeschlagen: ' . ($GLOBALS['rv_mail_error'] ?: 'unbekannter Fehler')]);
}

if ($act === 'templates') {
    $defaults = rv_template_defaults(); $save = [];
    foreach ((array)($in['templates'] ?? []) as $k => $t) {
        if (!isset($defaults[$k]) || !is_array($t)) continue;
        $subj = trim(str_replace(["\r", "\n"], ' ', (string)($t['subject'] ?? '')));
        $body = str_replace("\r\n", "\n", (string)($t['body'] ?? ''));
        if (strlen($subj) > 200 || strlen($body) > 6000) out(400, ['ok' => false, 'message' => 'Betreff oder Text ist zu lang.']);
        $save[$k] = ['subject' => $subj, 'body' => $body];   // leer = Standard
    }
    out(rv_write_json('resv-templates', $save) ? 200 : 500, ['ok' => true, 'message' => 'Vorlagen gespeichert.']);
}

if ($act === 'template_test') {
    $to = trim((string)($in['to'] ?? '')); $key = (string)($in['key'] ?? '');
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) out(400, ['ok' => false, 'message' => 'Bitte eine gültige E-Mail-Adresse eingeben.']);
    if (!isset(rv_template_defaults()[$key])) out(400, ['ok' => false]);
    $ok = rv_mail_template($key, rv_sample_reservation(), $to);
    out(200, ['ok' => $ok, 'message' => $ok ? 'Test verschickt (mit Beispieldaten). Gespeicherte Vorlage wurde verwendet.' : 'Versand fehlgeschlagen: ' . ($GLOBALS['rv_mail_error'] ?: 'unbekannter Fehler')]);
}

if ($act === 'user_password') {
    $users = rv_users(); $id = (string)($in['id'] ?? ''); $new = (string)($in['new'] ?? '');
    if (!isset($users[$id])) out(404, ['ok' => false, 'message' => 'Zugang nicht gefunden.']);
    if (strlen($new) < 10) out(400, ['ok' => false, 'message' => 'Mindestens 10 Zeichen.']);
    $users[$id]['hash'] = password_hash($new, PASSWORD_DEFAULT);
    out(rv_save_users($users) ? 200 : 500, ['ok' => true, 'message' => 'Passwort für ' . $users[$id]['name'] . ' gesetzt.']);
}

out(400, ['ok' => false, 'message' => 'Unbekannte Aktion.']);
