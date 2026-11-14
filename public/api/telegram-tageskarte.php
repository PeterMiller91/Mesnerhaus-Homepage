<?php
/* Telegram-Webhook für die Tageskarte.
   Foto (oder PDF) an den Bot schicken → wird zur aktuellen Tageskarte.
   Fotos werden auf dem Server in eine PDF (DIN A4) umgewandelt.
   Einrichtung: server/README.md                                      */
declare(strict_types=1);

require dirname(__DIR__) . '/_tk/tageskarte-lib.php';
$config = tk_config();
if (!$config) { http_response_code(503); exit; }

$token   = (string)($config['telegram_bot_token'] ?? '');
$secret  = (string)($config['telegram_webhook_secret'] ?? '');
$allowed = array_map('strval', $config['telegram_allowed_chat_ids'] ?? []);
$site    = rtrim((string)($config['site_url'] ?? ''), '/');
$maxSize = 20 * 1024 * 1024; // Download-Limit der Telegram-Bot-API

/* Nur Telegram mit dem richtigen Secret darf hier rein. */
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || $token === '' || $secret === ''
    || !hash_equals($secret, $_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN'] ?? '')) {
    http_response_code(403);
    exit;
}

$update = json_decode((string)file_get_contents('php://input'), true);
$msg    = $update['message'] ?? null;
http_response_code(200);
if (!is_array($msg)) exit;
$chatId = (string)($msg['chat']['id'] ?? '');

/* ── Telegram-Helfer ─────────────────────────────────────────── */
function tg(string $token, string $method, array $params): ?array {
    $ctx = stream_context_create(['http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => json_encode($params),
        'timeout' => 20,
    ]]);
    $res = @file_get_contents("https://api.telegram.org/bot$token/$method", false, $ctx);
    return $res === false ? null : json_decode($res, true);
}
function reply(string $token, string $chatId, string $text): void {
    tg($token, 'sendMessage', ['chat_id' => $chatId, 'text' => $text]);
}
function download(string $token, string $fileId): ?string {
    $info = tg($token, 'getFile', ['file_id' => $fileId]);
    $path = $info['result']['file_path'] ?? null;
    if (!$path) return null;
    $data = @file_get_contents("https://api.telegram.org/file/bot$token/$path");
    return $data === false ? null : $data;
}

/* ── Befehle ─────────────────────────────────────────────────── */
$text = trim((string)($msg['text'] ?? ''));
if ($text === '/start' || $text === '/id') {
    $known = in_array($chatId, $allowed, true);
    reply($token, $chatId, $known
        ? "Hallo! Schick mir ein Foto der Tageskarte (oder eine PDF). Sie ist dann sofort auf der Website.\n"
          . "Tipp: Schreib z. B. „Sonntag 15.11.“ als Bildunterschrift dazu.\n"
          . "/status zeigt die aktuelle Karte, /loeschen nimmt sie von der Website."
        : "Deine Chat-ID ist $chatId.\nSie muss erst in der Server-Konfiguration freigeschaltet werden.");
    exit;
}

if (!in_array($chatId, $allowed, true)) exit; // Fremde ignorieren

$pdfPath = tk_paths()['pdf'];

if ($text === '/status') {
    reply($token, $chatId, is_file($pdfPath)
        ? 'Online ist die Tageskarte vom ' . date('d.m.Y, H:i', filemtime($pdfPath)) . ' Uhr.' . ($site ? "\n$site/tageskarte.php" : '')
        : 'Aktuell ist keine Tageskarte online.');
    exit;
}
if ($text === '/loeschen' || $text === '/löschen') {
    tk_delete();
    reply($token, $chatId, 'Die Tageskarte wurde von der Website entfernt.');
    exit;
}

/* ── Upload ──────────────────────────────────────────────────── */
$raw = null;
if (!empty($msg['photo']) && is_array($msg['photo'])) {
    $best = end($msg['photo']);                                  // größte Auflösung
    $raw  = download($token, (string)$best['file_id']);
} elseif (is_array($msg['document'] ?? null)) {
    if (($msg['document']['file_size'] ?? 0) > $maxSize) { reply($token, $chatId, 'Die Datei ist größer als 20 MB.'); exit; }
    $raw = download($token, (string)$msg['document']['file_id']);
} else {
    if ($text !== '') reply($token, $chatId, 'Schick mir ein Foto der Tageskarte oder eine PDF. /start zeigt die Hilfe.');
    exit;
}
if ($raw === null) { reply($token, $chatId, 'Download fehlgeschlagen. Bitte nochmal senden.'); exit; }

$err = tk_store($raw, (string)($msg['caption'] ?? ''));
reply($token, $chatId, $err ?? ('Danke! Die neue Tageskarte ist online' . ($site ? ":\n$site/#menu" : '.')));
