<?php
/* JSON-Schnittstelle der Reservierungs-App (nur angemeldet). */
declare(strict_types=1);

require dirname(__DIR__, 2) . '/_tk/site-lib.php';   // lädt auch resv-lib.php und tageskarte-lib.php

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

rv_session_start();
$DAY_FOR = null;   // POST mit _day: frische Tagesdaten gleich mitschicken (spart der App eine zweite Anfrage)
function out(int $code, array $data): void {
    global $DAY_FOR;
    if ($DAY_FOR !== null && $code === 200 && !empty($data['ok']) && !isset($data['day'])) $data['day'] = rv_day_payload($DAY_FOR);
    http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit;
}

$me = rv_current_user();
$csrf = (string)($_SESSION['csrf'] ?? '');
session_write_close();   // API schreibt nie in die Sitzung: Sperre sofort lösen, Anfragen laufen parallel
if (!$me) out(401, ['ok' => false, 'message' => 'Bitte neu anmelden.']);
$isAdmin = $me['role'] === 'admin';
$s = rv_settings();

/* Alles, was die Tagesansicht braucht (auch nach dem Speichern mitgeschickt, spart eine Anfrage). */
function rv_day_payload(string $date): array {
    if (!rv_valid_date($date)) $date = date('Y-m-d');
    $s = rv_settings();
    $all = rv_load()['items'];
    $byDate = [];
    foreach ($all as $r) $byDate[$r['date']][] = $r;
    $day = rv_day($s, $date);

    $items = $byDate[$date] ?? [];
    usort($items, function ($a, $b) { return [$a['time'], $a['id']] <=> [$b['time'], $b['id']]; });
    $items = array_map(function ($r) { unset($r['token']); return $r; }, $items);

    // Auslastung im 30-Minuten-Raster (Öffnungszeit, sonst 10–20 Uhr für Feiern)
    $from = $day ? rv_min($day['open']) : 600; $to = $day ? rv_min($day['close']) : 1200;
    $load = [];
    for ($m = $from; $m < $to; $m += 30) {
        $g = rv_occupied($items, $date, $m, (int)$s['duration']);
        $load[] = ['time' => rv_hhmm($m), 'guests' => $g, 'pct' => min(100, (int)round($g / max(1, (int)$s['seats']) * 100))];
    }

    $active = array_filter($items, function ($r) { return in_array($r['status'], RV_ACTIVE, true); });
    // Nächste Tage mit Reservierungen bzw. Öffnung
    $next = [];
    for ($i = 0; $i < 70 && count($next) < 6; $i++) {
        $d = date('Y-m-d', strtotime("+$i days"));
        $cnt = 0; $g = 0;
        foreach ($byDate[$d] ?? [] as $r) if (in_array($r['status'], RV_ACTIVE, true)) { $cnt++; $g += (int)$r['persons']; }
        if ($cnt > 0 || rv_day($s, $d)) {
            $pk = 0;
            if ($cnt > 0) for ($m = 600; $m < 1260; $m += 30) $pk = max($pk, rv_occupied($byDate[$d], $d, $m, (int)$s['duration']));
            $next[] = ['date' => $d, 'label' => rv_date_de($d), 'count' => $cnt, 'guests' => $g, 'open' => (bool)rv_day($s, $d),
                       'pct' => min(100, (int)round($pk / max(1, (int)$s['seats']) * 100))];
        }
    }
    $unseen = array_values(array_map(function ($r) { return ['id' => $r['id'], 'date' => $r['date'], 'time' => $r['time'], 'name' => $r['name'], 'persons' => (int)$r['persons'], 'status' => $r['status']]; },
        array_filter($all, function ($r) { return empty($r['seen']) && $r['date'] >= date('Y-m-d'); })));

    return [
        'ok' => true, 'date' => $date, 'queue' => rv_queue_count(), 'label' => rv_date_de($date), 'open' => $day,
        'slots' => $day ? rv_slots($s, $day) : [],
        'seats' => (int)$s['seats'], 'duration' => (int)$s['duration'], 'online_enabled' => (bool)$s['online_enabled'],
        'items' => $items, 'load' => $load,
        'stats' => (function () use ($active, $load, $byDate, $date) {
            $guests = array_sum(array_map(function ($r) { return (int)$r['persons']; }, $active));
            $peak = 0; $peakTime = '';
            foreach ($load as $l) if ($l['guests'] > $peak) { $peak = $l['guests']; $peakTime = $l['time']; }
            $prevDate = date('Y-m-d', strtotime($date . ' -7 days'));
            $prev = 0;
            foreach ($byDate[$prevDate] ?? [] as $r) if (in_array($r['status'], RV_ACTIVE, true)) $prev += (int)$r['persons'];
            return ['count' => count($active), 'guests' => $guests, 'peak' => $peak, 'peak_time' => $peakTime,
                    'online' => count(array_filter($active, function ($r) { return ($r['source'] ?? '') === 'online'; })),
                    'prev_guests' => $prev, 'prev_date' => $prevDate, 'prev_known' => $prevDate >= date('Y-m-d', strtotime('-' . RV_KEEP_DAYS . ' days'))];
        })(),
        'next' => $next, 'unseen' => $unseen, 'plan' => rv_plan(),
    ];
}

/* ── Lesen ───────────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['push'])) {
        $keys = rv_push_keys();
        $mine = []; $others = 0;
        foreach (rv_push_subs() as $sub) {
            if ($sub['user'] === $me['id']) $mine[] = ['id' => substr(hash('sha256', $sub['endpoint']), 0, 16), 'label' => $sub['label'], 'prefs' => $sub['prefs'],
                'created' => $sub['created'], 'last_ok' => $sub['last_ok'] ?? null, 'last_error' => $sub['last_error'] ?? null, 'endpoint_hash' => hash('sha256', $sub['endpoint'])];
            else $others++;
        }
        out(200, ['ok' => true, 'available' => (bool)$keys, 'public_key' => $keys['public'] ?? '', 'devices' => $mine, 'others' => $others]);
    }
    // Monatsübersicht: je Tag Reservierungen, Gäste, höchste Auslastung
    if (isset($_GET['month'])) {
        $ym = (string)$_GET['month'];
        if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $ym)) $ym = date('Y-m');
        $all = rv_load()['items'];
        $days = []; $sumC = 0; $sumG = 0;
        $n = (int)date('t', strtotime($ym . '-01'));
        for ($i = 1; $i <= $n; $i++) {
            $d = sprintf('%s-%02d', $ym, $i);
            $cnt = 0; $g = 0;
            foreach ($all as $r) if ($r['date'] === $d && in_array($r['status'], RV_ACTIVE, true)) { $cnt++; $g += (int)$r['persons']; }
            $pk = 0;
            if ($cnt) for ($m = 600; $m < 1260; $m += 30) $pk = max($pk, rv_occupied($all, $d, $m, (int)$s['duration']));
            $days[] = ['date' => $d, 'count' => $cnt, 'guests' => $g, 'open' => (bool)rv_day($s, $d),
                       'closed' => in_array($d, $s['closed_dates'] ?? [], true), 'pct' => min(100, (int)round($pk / max(1, (int)$s['seats']) * 100))];
            $sumC += $cnt; $sumG += $g;
        }
        out(200, ['ok' => true, 'month' => $ym, 'days' => $days, 'count' => $sumC, 'guests' => $sumG, 'today' => date('Y-m-d')]);
    }
    // Alle Reservierungen (kommend + die letzten 60 Tage) für Liste und Suche
    if (isset($_GET['list']) || isset($_GET['export'])) {
        $today = date('Y-m-d');
        $scope = (string)($_GET['scope'] ?? 'kommend') === 'vergangen' ? 'vergangen' : 'kommend';
        $q = function_exists('mb_strtolower') ? mb_strtolower(trim((string)($_GET['q'] ?? ''))) : strtolower(trim((string)($_GET['q'] ?? '')));
        $rows = array_values(array_filter(rv_load()['items'], function ($r) use ($today, $scope, $q) {
            if ($scope === 'kommend' ? $r['date'] < $today : $r['date'] >= $today) return false;
            if ($q === '') return true;
            $hay = implode(' ', [$r['name'], $r['phone'] ?? '', $r['email'] ?? '', $r['note'] ?? '', $r['table'] ?? '']);
            $hay = function_exists('mb_strtolower') ? mb_strtolower($hay) : strtolower($hay);
            $digits = preg_replace('/\D/', '', $q);
            return strpos($hay, $q) !== false || (strlen($digits) >= 4 && strpos(preg_replace('/\D/', '', (string)($r['phone'] ?? '')), $digits) !== false);
        }));
        usort($rows, function ($a, $b) use ($scope) {
            $c = [$a['date'], $a['time'], $a['id']] <=> [$b['date'], $b['time'], $b['id']];
            return $scope === 'kommend' ? $c : -$c;
        });
        if (isset($_GET['list'])) {
            out(200, ['ok' => true, 'scope' => $scope, 'today' => $today, 'keep_days' => RV_KEEP_DAYS, 'items' => array_map(function ($r) {
                return ['id' => (int)$r['id'], 'date' => $r['date'], 'time' => $r['time'], 'persons' => (int)$r['persons'], 'name' => $r['name'],
                    'phone' => $r['phone'] ?? '', 'email' => $r['email'] ?? '', 'note' => $r['note'] ?? '', 'table' => $r['table'] ?? '',
                    'status' => $r['status'], 'source' => $r['source'], 'seen' => !empty($r['seen'])];
            }, $rows)]);
        }
        // CSV-Export (nur Admin), Excel-tauglich: UTF-8 mit BOM, Semikolon
        if (!$isAdmin) out(403, ['ok' => false, 'message' => 'Nur für Admin.']);
        if (!hash_equals($csrf, (string)($_GET['t'] ?? ''))) out(403, ['ok' => false, 'message' => 'Sitzung abgelaufen. Bitte Seite neu laden.']);
        $status = ['bestaetigt' => 'Bestätigt', 'erschienen' => 'Da', 'storniert' => 'Storniert', 'abgelehnt' => 'Abgelehnt', 'nicht_erschienen' => 'Nicht erschienen'];
        $source = ['online' => 'Online', 'telefon' => 'Telefon', 'whatsapp' => 'WhatsApp', 'email' => 'E-Mail', 'vor_ort' => 'Vor Ort'];
        $cell = function ($v): string {
            $v = str_replace(["\r\n", "\r", "\n"], ' ', (string)$v);
            if ($v !== '' && strpbrk($v[0], '=+-@') !== false) $v = "'" . $v;      // keine Formeln in Excel
            return '"' . str_replace('"', '""', $v) . '"';
        };
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="reservierungen-' . $scope . '-' . date('Y-m-d') . '.csv"');
        $lines = [implode(';', array_map($cell, ['Datum', 'Uhrzeit', 'Name', 'Personen', 'Telefon', 'E-Mail', 'Tisch', 'Status', 'Quelle', 'Notiz', 'Eingegangen']))];
        foreach ($rows as $r) {
            $lines[] = implode(';', array_map($cell, [date('d.m.Y', strtotime($r['date'])), $r['time'], $r['name'], (int)$r['persons'], $r['phone'] ?? '', $r['email'] ?? '',
                $r['table'] ?? '', $status[$r['status']] ?? $r['status'], $source[$r['source']] ?? $r['source'], $r['note'] ?? '',
                !empty($r['created']) ? date('d.m.Y H:i', strtotime($r['created'])) : '']));
        }
        echo "\xEF\xBB\xBF" . implode("\r\n", $lines) . "\r\n";
        exit;
    }
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
    out(200, rv_day_payload($date));
}

/* ── Schreiben ───────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['ok' => false]);
if (!hash_equals($csrf, (string)($_SERVER['HTTP_X_CSRF'] ?? ''))) out(403, ['ok' => false, 'message' => 'Sitzung abgelaufen. Bitte Seite neu laden.']);
// JSON, bei Datei-Uploads (Website-Bereich) multipart/form-data
$in = stripos((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'multipart/form-data') === 0 ? $_POST : json_decode((string)file_get_contents('php://input'), true);
if (!is_array($in)) out(400, ['ok' => false]);
$act = (string)($in['action'] ?? '');
if (rv_valid_date((string)($in['_day'] ?? ''))) $DAY_FOR = (string)$in['_day'];

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
        $plan = rv_plan(); $valid = array_column($plan['tables'], 'id');
        $tables = array_values(array_unique(array_filter(array_map('strval', (array)($in['tables'] ?? [])), function ($t) use ($valid) { return in_array($t, $valid, true); })));
        if ($tables && in_array($status, RV_ACTIVE, true)) {
            $c = rv_table_conflicts($d['items'], ['id' => $id, 'date' => $date, 'time' => $time], $tables, (int)$s['duration'], $plan);
            if ($c) return ['conflict' => $c];
        }
        $fields = [
            'tables' => $tables, 'table' => rv_table_names($tables, $plan),
            'date' => $date, 'time' => $time, 'persons' => $persons, 'name' => $name, 'email' => $email,
            'phone' => rv_clean((string)($in['phone'] ?? ''), 40), 'note' => rv_clean((string)($in['note'] ?? ''), 300),
            'status' => $status, 'updated' => date('c'), 'by' => $me['name'],
        ];
        if ($id > 0) {
            foreach ($d['items'] as $i => $r) if ((int)$r['id'] === $id) {
                // alter Freitext-Tisch bleibt erhalten, solange kein Tisch aus dem Plan gewählt ist
                if (!$fields['tables'] && empty($r['tables']) && !empty($r['table'])) $fields['table'] = $r['table'];
                $d['items'][$i] = array_merge($r, $fields, ['seen' => true]); $saved = $d['items'][$i];
            }
            if (empty($saved)) return ['missing' => true];
        } else {
            $saved = array_merge($fields, ['id' => (int)$d['next_id'], 'source' => $source, 'seen' => true, 'token' => rv_new_token(), 'created' => date('c')]);
            $d['next_id']++; $d['items'][] = $saved;
        }
        return rv_save($d) ? ['item' => $saved, 'new' => $id === 0] : ['fail' => true];
    });
    if (isset($res['conflict'])) out(409, ['ok' => false, 'message' => 'Schon belegt: ' . implode(', ', $res['conflict']) . '.']);
    if (isset($res['warn'])) out(409, ['ok' => false, 'over' => true, 'message' => 'Zu dieser Zeit sind nur noch ' . $res['warn'] . ' Plätze frei. Trotzdem eintragen?']);
    if (!empty($res['missing'])) out(404, ['ok' => false, 'message' => 'Reservierung nicht gefunden.']);
    if (!empty($res['fail'])) out(500, ['ok' => false, 'message' => 'Speichern fehlgeschlagen.']);
    // E-Mail in die Warteschlange (Versand über /api/queue.php), Antwort sofort
    $sendMail = $res['new'] && !empty($in['send_mail']) && $res['item']['email'] !== '';
    if ($sendMail) rv_queue('guest_confirm', ['r' => $res['item']]);
    out(200, ['ok' => true, 'id' => $res['item']['id'], 'mailed' => $sendMail, 'queue' => $sendMail]);
}

if ($act === 'push_subscribe') {
    $ep = (string)($in['endpoint'] ?? '');
    if (!preg_match('#^https://[a-z0-9.\-]+(:\d+)?/#i', $ep) || strlen($ep) > 1000) out(400, ['ok' => false, 'message' => 'Ungültiges Gerät.']);
    $prefs = ['neu' => !empty($in['prefs']['neu']), 'storno' => !empty($in['prefs']['storno'])];
    $label = rv_clean((string)($in['label'] ?? 'Gerät'), 40);
    $ok = rv_with_lock(function () use ($ep, $prefs, $label, $me) {
        $subs = array_values(array_filter(rv_push_subs(), function ($s) use ($ep) { return $s['endpoint'] !== $ep; }));
        $subs[] = ['endpoint' => $ep, 'user' => $me['id'], 'label' => $label, 'prefs' => $prefs, 'created' => date('c'), 'last_event' => 0];
        return rv_push_save_subs($subs);
    });
    out($ok ? 200 : 500, ['ok' => $ok]);
}

if ($act === 'push_prefs' || $act === 'push_remove') {
    $hash = (string)($in['endpoint_hash'] ?? '');
    $ok = rv_with_lock(function () use ($hash, $in, $act, $me) {
        $subs = rv_push_subs(); $found = false;
        foreach ($subs as $i => $s) {
            if ($s['user'] !== $me['id'] || !hash_equals(hash('sha256', $s['endpoint']), $hash)) continue;
            $found = true;
            if ($act === 'push_remove') unset($subs[$i]);
            else $subs[$i]['prefs'] = ['neu' => !empty($in['prefs']['neu']), 'storno' => !empty($in['prefs']['storno'])];
        }
        return $found && rv_push_save_subs($subs);
    });
    out($ok ? 200 : 404, ['ok' => $ok]);
}

if ($act === 'push_test') {
    $r = rv_push_notify('test', 'Test vom Mesnerhaus', 'Push-Benachrichtigungen funktionieren auf diesem Gerät.', '/reservierungen/verwaltung/', $me['id']);
    out(200, ['ok' => $r['sent'] > 0, 'message' => $r['sent'] > 0
        ? 'Test an ' . $r['sent'] . ($r['sent'] === 1 ? ' Gerät' : ' Geräte') . ' geschickt. Kommt gleich an.'
        : 'Kein Gerät erreicht' . ($r['failed'] ? ' (' . $r['failed'] . ' fehlgeschlagen)' : '') . '. Bitte auf diesem Gerät neu aktivieren.']);
}

if ($act === 'assign') {
    $id = (int)($in['id'] ?? 0);
    $res = rv_with_lock(function () use ($id, $in, $s, $me) {
        $d = rv_load(); $plan = rv_plan(); $valid = array_column($plan['tables'], 'id');
        $tables = array_values(array_unique(array_filter(array_map('strval', (array)($in['tables'] ?? [])), function ($t) use ($valid) { return in_array($t, $valid, true); })));
        foreach ($d['items'] as $i => $r) if ((int)$r['id'] === $id) {
            $c = rv_table_conflicts($d['items'], $r, $tables, (int)$s['duration'], $plan);
            if ($c) return ['conflict' => $c];
            $d['items'][$i]['tables'] = $tables; $d['items'][$i]['table'] = rv_table_names($tables, $plan);
            $d['items'][$i]['updated'] = date('c'); $d['items'][$i]['by'] = $me['name'];
            return rv_save($d) ? ['ok' => true] : ['fail' => true];
        }
        return ['missing' => true];
    });
    if (isset($res['conflict'])) out(409, ['ok' => false, 'message' => 'Schon belegt: ' . implode(', ', $res['conflict']) . '.']);
    out(!empty($res['ok']) ? 200 : 400, ['ok' => !empty($res['ok'])]);
}

if ($act === 'auto_assign') {
    $date = (string)($in['date'] ?? '');
    if (!rv_valid_date($date)) out(400, ['ok' => false]);
    $res = rv_with_lock(function () use ($date, $s) {
        $d = rv_load(); $plan = rv_plan(); $dur = (int)$s['duration'];
        $idx = array_keys(array_filter($d['items'], function ($r) use ($date) {
            return $r['date'] === $date && in_array($r['status'], RV_ACTIVE, true) && empty($r['tables']);
        }));
        usort($idx, function ($a, $b) use ($d) { return [$d['items'][$a]['time'], -(int)$d['items'][$a]['persons']] <=> [$d['items'][$b]['time'], -(int)$d['items'][$b]['persons']]; });
        $done = 0; $left = [];
        foreach ($idx as $i) {
            $r = $d['items'][$i]; $p = (int)$r['persons'];
            $free = array_values(array_filter($plan['tables'], function ($t) use ($d, $r, $dur, $plan) { return !rv_table_conflicts($d['items'], $r, [$t['id']], $dur, $plan); }));
            $best = null;
            foreach ($free as $t) if ((int)$t['seats'] >= $p && (!$best || (int)$t['seats'] < (int)$best[0]['seats'])) $best = [$t];
            if (!$best) {   // zwei Tische im selben Bereich zusammenstellen
                $bestSum = PHP_INT_MAX;
                foreach ($free as $a) foreach ($free as $b) {
                    if ($a['id'] >= $b['id'] || $a['area'] !== $b['area']) continue;
                    $sum = (int)$a['seats'] + (int)$b['seats'];
                    if ($sum >= $p && $sum < $bestSum) { $bestSum = $sum; $best = [$a, $b]; }
                }
            }
            if ($best) {
                $ids = array_column($best, 'id');
                $d['items'][$i]['tables'] = $ids; $d['items'][$i]['table'] = rv_table_names($ids, $plan); $done++;
            } else $left[] = $r['name'];
        }
        if ($done) rv_save($d);
        return ['done' => $done, 'left' => $left];
    });
    $msg = $res['done'] ? $res['done'] . ' zugewiesen.' : 'Nichts zuzuweisen.';
    if ($res['left']) $msg .= ' Kein passender Tisch frei für: ' . implode(', ', $res['left']) . '.';
    out(200, ['ok' => true, 'message' => $msg]);
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
    $sendMail = $item && $status === 'storniert' && !empty($in['notify']) && ($item['email'] ?? '') !== '';
    if ($sendMail) rv_queue('guest_cancel', ['r' => $item]);
    out($item ? 200 : 404, ['ok' => (bool)$item, 'mailed' => $sendMail, 'queue' => $sendMail]);
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

// Reservierungen endgültig löschen (nur Admin, Liste mit Auswahl)
if ($act === 'delete') {
    if (!$isAdmin) out(403, ['ok' => false, 'message' => 'Löschen darf nur der Admin-Zugang.']);
    $ids = array_values(array_unique(array_filter(array_map('intval', (array)($in['ids'] ?? [])))));
    if (!$ids || count($ids) > 500) out(400, ['ok' => false, 'message' => 'Keine Reservierungen ausgewählt.']);
    $n = rv_with_lock(function () use ($ids) {
        $d = rv_load(); $before = count($d['items']);
        $d['items'] = array_values(array_filter($d['items'], function ($r) use ($ids) { return !in_array((int)$r['id'], $ids, true); }));
        $n = $before - count($d['items']);
        if ($n) rv_save($d);
        return $n;
    });
    out(200, ['ok' => true, 'deleted' => (int)$n, 'message' => $n === 1 ? '1 Reservierung gelöscht' : $n . ' Reservierungen gelöscht']);
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

/* ── Website: Banner, Tageskarte, Sonderkarten, Effekte, Galerie (site-lib.php) ── */
if ($r = site_admin_action($act, $in)) out($r[0], $r[1]);

/* ── Benutzer verwalten (nur Admin) ─────────────────────────────── */
function rv_uid_from(string $name): string { $id = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name) ?? ''); return trim($id, '-') ?: 'nutzer'; }
function rv_admin_count(array $users): int { return count(array_filter($users, function ($u) { return ($u['role'] ?? '') === 'admin'; })); }
function rv_user_list(): array {
    return array_values(array_map(function ($id, $u) { return ['id' => $id, 'name' => $u['name'], 'role' => $u['role'], 'created' => $u['created'] ?? null]; }, array_keys(rv_users()), rv_users()));
}
if ($act === 'users') out(200, ['ok' => true, 'users' => rv_user_list(), 'me' => $me['id']]);

if ($act === 'user_add') {
    $name = rv_clean((string)($in['name'] ?? ''), 40);
    $role = (string)($in['role'] ?? '');
    $pass = (string)($in['password'] ?? '');
    $len = function_exists('mb_strlen') ? mb_strlen($name) : strlen($name);
    if ($len < 2) out(400, ['ok' => false, 'message' => 'Bitte einen Namen mit mindestens 2 Zeichen eingeben.']);
    if (!in_array($role, ['admin', 'team'], true)) out(400, ['ok' => false, 'message' => 'Bitte eine Rolle wählen.']);
    if (strlen($pass) < 10) out(400, ['ok' => false, 'message' => 'Das Passwort braucht mindestens 10 Zeichen.']);
    $users = rv_users();
    foreach ($users as $u) if (strcasecmp($u['name'], $name) === 0) out(400, ['ok' => false, 'message' => 'Diesen Namen gibt es schon. Der Name ist der Anmeldename.']);
    $id = rv_uid_from($name); $base = $id; $i = 2;
    while (isset($users[$id])) $id = $base . '-' . $i++;
    $users[$id] = ['name' => $name, 'role' => $role, 'hash' => password_hash($pass, PASSWORD_DEFAULT), 'created' => date('c')];
    if (!rv_save_users($users)) out(500, ['ok' => false, 'message' => 'Speichern fehlgeschlagen.']);
    out(200, ['ok' => true, 'message' => $name . ' angelegt.', 'users' => rv_user_list()]);
}

if ($act === 'user_role') {
    $users = rv_users(); $id = (string)($in['id'] ?? ''); $role = (string)($in['role'] ?? '');
    if (!isset($users[$id])) out(404, ['ok' => false, 'message' => 'Zugang nicht gefunden.']);
    if (!in_array($role, ['admin', 'team'], true)) out(400, ['ok' => false, 'message' => 'Unbekannte Rolle.']);
    if ($id === $me['id'] && $role !== 'admin') out(400, ['ok' => false, 'message' => 'Die eigene Admin-Rolle kannst du nicht abgeben. Das muss ein anderer Admin machen.']);
    if ($users[$id]['role'] === 'admin' && $role !== 'admin' && rv_admin_count($users) <= 1) out(400, ['ok' => false, 'message' => 'Es muss mindestens ein Admin bleiben.']);
    $users[$id]['role'] = $role;
    if (!rv_save_users($users)) out(500, ['ok' => false, 'message' => 'Speichern fehlgeschlagen.']);
    out(200, ['ok' => true, 'message' => $users[$id]['name'] . ' ist jetzt ' . ($role === 'admin' ? 'Admin' : 'Team') . '.', 'users' => rv_user_list()]);
}

if ($act === 'user_delete') {
    $users = rv_users(); $id = (string)($in['id'] ?? '');
    if (!isset($users[$id])) out(404, ['ok' => false, 'message' => 'Zugang nicht gefunden.']);
    if ($id === $me['id']) out(400, ['ok' => false, 'message' => 'Den eigenen Zugang kannst du nicht löschen.']);
    if ($users[$id]['role'] === 'admin' && rv_admin_count($users) <= 1) out(400, ['ok' => false, 'message' => 'Es muss mindestens ein Admin bleiben.']);
    $name = $users[$id]['name'];
    unset($users[$id]);
    if (!rv_save_users($users)) out(500, ['ok' => false, 'message' => 'Speichern fehlgeschlagen.']);
    // Push-Geräte des gelöschten Zugangs entfernen
    $subs = rv_push_subs();
    $left = array_values(array_filter($subs, function ($x) use ($id) { return ($x['user'] ?? '') !== $id; }));
    if (count($left) !== count($subs)) rv_push_save_subs($left);
    out(200, ['ok' => true, 'message' => $name . ' gelöscht.', 'users' => rv_user_list()]);
}

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

if ($act === 'plan_save') {
    $n = (array)($in['plan'] ?? []);
    $areas = [];
    foreach ((array)($n['areas'] ?? []) as $a) {
        $id = preg_replace('/[^a-z0-9_-]/', '', strtolower((string)($a['id'] ?? '')));
        if ($id !== '') $areas[] = ['id' => $id, 'name' => rv_clean((string)($a['name'] ?? $id), 30)];
    }
    if (!$areas) out(400, ['ok' => false, 'message' => 'Mindestens ein Bereich nötig.']);
    $areaIds = array_column($areas, 'id'); $tables = []; $seen = [];
    foreach ((array)($n['tables'] ?? []) as $t) {
        $id = preg_replace('/[^a-z0-9_-]/i', '', (string)($t['id'] ?? ''));
        if ($id === '' || isset($seen[$id])) continue;
        $seen[$id] = true;
        $w = max(4, min(60, (int)($t['w'] ?? 12))); $h = max(4, min(40, (int)($t['h'] ?? 10)));
        $tables[] = [
            'id' => $id, 'name' => rv_clean((string)($t['name'] ?? ''), 12) ?: $id,
            'seats' => max(1, min(40, (int)($t['seats'] ?? 4))),
            'area' => in_array($t['area'] ?? '', $areaIds, true) ? $t['area'] : $areaIds[0],
            'x' => max(0, min(100 - $w, (int)($t['x'] ?? 0))), 'y' => max(0, min(60 - $h, (int)($t['y'] ?? 0))),
            'w' => $w, 'h' => $h, 'shape' => ($t['shape'] ?? '') === 'round' ? 'round' : 'rect',
        ];
    }
    if (count($tables) > 120) out(400, ['ok' => false, 'message' => 'Zu viele Tische.']);
    out(rv_write_json('resv-tables', ['example' => false, 'areas' => $areas, 'tables' => $tables]) ? 200 : 500, ['ok' => true, 'message' => 'Tischplan gespeichert.']);
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
