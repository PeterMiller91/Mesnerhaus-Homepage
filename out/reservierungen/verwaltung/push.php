<?php
/* Abholstelle für den Service Worker: Nach einer (leeren) Push-Nachricht fragt das Gerät hier,
   was es anzeigen soll. Ausweis ist die geheime Push-Adresse des Geräts (endpoint), keine Sitzung,
   damit es auch funktioniert, wenn die App geschlossen ist.                                       */
declare(strict_types=1);

require dirname(__DIR__, 2) . '/_tk/resv-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$generic = ['title' => 'Reservierungen', 'body' => 'Es gibt Neuigkeiten. Tippen zum Öffnen.', 'url' => '/reservierungen/verwaltung/', 'tag' => 'mh-generic'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }
$in = json_decode((string)file_get_contents('php://input'), true);
$ep = is_array($in) ? (string)($in['endpoint'] ?? '') : '';

$events = rv_with_lock(function () use ($ep) {
    if ($ep === '') return null;
    $subs = rv_push_subs(); $idx = null;
    foreach ($subs as $i => $s) if (hash_equals($s['endpoint'], $ep)) { $idx = $i; break; }
    if ($idx === null) return null;
    $sub = $subs[$idx];
    $ev = rv_read_json('resv-push-events', ['items' => []]);
    $out = [];
    foreach ($ev['items'] as $e) {
        if ((int)$e['id'] <= (int)($sub['last_event'] ?? 0) || $e['at'] < time() - 86400) continue;
        if ($e['user'] !== '' && $e['user'] !== $sub['user']) continue;
        if ($e['kind'] !== 'test' && empty($sub['prefs'][$e['kind']])) continue;
        $out[] = ['title' => $e['title'], 'body' => $e['body'], 'url' => $e['url'], 'tag' => 'mh-' . $e['id']];
    }
    if ($ev['items']) { $subs[$idx]['last_event'] = max(array_column($ev['items'], 'id')); rv_push_save_subs($subs); }
    return array_slice($out, 0, 3);
});

echo json_encode(['items' => $events ?: [$generic]], JSON_UNESCAPED_UNICODE);
