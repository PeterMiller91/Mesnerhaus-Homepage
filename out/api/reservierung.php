<?php
/* Öffentliche Schnittstelle für die Online-Buchung auf der Website.
     GET  ?tage&persons=N             → nächste Öffnungstage mit Verfügbarkeit
     GET  ?zeiten&date=Y-m-d&persons=N → Uhrzeiten des Tages (frei ja/nein)
     POST (JSON)                       → Reservierung anlegen, sofort bestätigt, wenn Platz frei ist */
declare(strict_types=1);

require dirname(__DIR__) . '/_tk/resv-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function out(int $code, array $data): void { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }

$s = rv_settings();
if (empty($s['online_enabled'])) out(200, ['ok' => false, 'disabled' => true, 'message' => 'Online-Reservierung ist gerade pausiert. Bitte rufen Sie uns an.']);

$persons = max(1, min((int)$s['max_online'], (int)($_GET['persons'] ?? 2)));

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $items = rv_load()['items'];

    if (isset($_GET['tage'])) {
        $days = [];
        for ($i = 0; $i <= (int)$s['days_ahead'] && count($days) < 8; $i++) {
            $date = date('Y-m-d', strtotime("+$i days"));
            $day = rv_day($s, $date);
            if (!$day) continue;
            $open = 0; $total = 0;
            foreach (rv_slots($s, $day) as $t) {
                if (!rv_bookable_time($s, $date, $t)) continue;
                $total++;
                if (rv_free($s, $items, $date, $t, true) >= $persons) $open++;
            }
            if ($total === 0) continue;   // heute schon vorbei
            $days[] = ['date' => $date, 'label' => rv_date_de($date), 'status' => $open === 0 ? 'voll' : ($open <= max(1, intdiv($total, 3)) ? 'wenige' : 'frei')];
        }
        out(200, ['ok' => true, 'max_online' => (int)$s['max_online'], 'days' => $days]);
    }

    if (isset($_GET['zeiten'])) {
        $date = (string)($_GET['date'] ?? '');
        $day = rv_valid_date($date) ? rv_day($s, $date) : null;
        if (!$day) out(200, ['ok' => true, 'slots' => []]);
        $slots = [];
        foreach (rv_slots($s, $day) as $t) {
            if (!rv_bookable_time($s, $date, $t)) continue;
            $slots[] = ['time' => $t, 'free' => rv_free($s, $items, $date, $t, true) >= $persons];
        }
        out(200, ['ok' => true, 'slots' => $slots]);
    }
    out(400, ['ok' => false, 'message' => 'Unbekannte Anfrage.']);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['ok' => false]);

$in = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($in)) out(400, ['ok' => false, 'message' => 'Ungültige Anfrage.']);

// Spamschutz: verstecktes Feld muss leer sein, Formular nicht in unter 3 Sekunden ausgefüllt
if (trim((string)($in['website'] ?? '')) !== '' || (int)($in['elapsed'] ?? 0) < 3000) out(200, ['ok' => true, 'message' => 'Danke!']);

$date    = (string)($in['date'] ?? '');
$time    = (string)($in['time'] ?? '');
$persons = (int)($in['persons'] ?? 0);
$name    = rv_clean((string)($in['name'] ?? ''), 80);
$phone   = rv_clean((string)($in['phone'] ?? ''), 40);
$email   = rv_clean((string)($in['email'] ?? ''), 120);
$note    = rv_clean((string)($in['note'] ?? ''), 300);

if (!rv_valid_date($date) || !preg_match('/^\d{2}:\d{2}$/', $time)) out(400, ['ok' => false, 'message' => 'Bitte Datum und Uhrzeit wählen.']);
if ($persons < 1) out(400, ['ok' => false, 'message' => 'Bitte die Personenzahl angeben.']);
if ($persons > (int)$s['max_online']) out(400, ['ok' => false, 'message' => 'Für Gruppen ab ' . ((int)$s['max_online'] + 1) . ' Personen rufen Sie uns bitte an oder schreiben per WhatsApp.']);
if ((function_exists("mb_strlen") ? mb_strlen($name) : strlen($name)) < 2) out(400, ['ok' => false, 'message' => 'Bitte Ihren Namen angeben.']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) out(400, ['ok' => false, 'message' => 'Bitte eine gültige E-Mail-Adresse angeben, dorthin schicken wir die Bestätigung.']);
if (strlen(preg_replace('/\D/', '', $phone)) < 6) out(400, ['ok' => false, 'message' => 'Bitte eine Telefonnummer für Rückfragen angeben.']);

$day = rv_day($s, $date);
if (!$day || !in_array($time, rv_slots($s, $day), true) || !rv_bookable_time($s, $date, $time)) {
    out(400, ['ok' => false, 'message' => 'Zu diesem Zeitpunkt können wir online leider nicht reservieren. Bitte wählen Sie eine andere Uhrzeit oder rufen Sie an.']);
}
if (!rv_rate_ok()) out(429, ['ok' => false, 'message' => 'Zu viele Anfragen. Bitte rufen Sie uns an.']);

$result = rv_with_lock(function () use ($s, $date, $time, $persons, $name, $phone, $email, $note) {
    $d = rv_load();
    if (rv_free($s, $d['items'], $date, $time, true) < $persons) return null;
    $r = [
        'id' => (int)$d['next_id'], 'date' => $date, 'time' => $time, 'persons' => $persons,
        'name' => $name, 'phone' => $phone, 'email' => $email, 'note' => $note, 'table' => '',
        'status' => 'bestaetigt', 'source' => 'online', 'seen' => false, 'token' => rv_new_token(),
        'created' => date('c'), 'updated' => date('c'), 'by' => 'Online',
    ];
    $d['next_id']++;
    $d['items'][] = $r;
    return rv_save($d) ? $r : false;
});

if ($result === null) out(409, ['ok' => false, 'full' => true, 'message' => 'Diese Uhrzeit ist gerade ausgebucht. Bitte wählen Sie eine andere.']);
if ($result === false) out(500, ['ok' => false, 'message' => 'Speichern fehlgeschlagen. Bitte rufen Sie uns an.']);

$mailed = rv_mail_guest_confirm($result);
rv_mail_owner($result, 'Neue Online-Reservierung');

out(200, [
    'ok' => true,
    'message' => 'Ihr Tisch ist reserviert: ' . rv_date_de($date) . ' um ' . $time . ' Uhr für ' . $persons . ($persons === 1 ? ' Person.' : ' Personen.'),
    'mailed' => $mailed,
]);
