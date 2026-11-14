<?php
/* Telegram-Webhook: Eine PDF an den Bot schicken → wird zur aktuellen
   Speisekarte auf der Website. Einrichtung: server/README.md          */
declare(strict_types=1);

$root   = dirname(__DIR__, 2);                       // Repo-Wurzel (Webroot = out/)
$cfgFile = "$root/mesnerhaus-config.php";
if (!is_file($cfgFile)) { http_response_code(503); exit; }
$config = require $cfgFile;

$token   = (string)($config['telegram_bot_token'] ?? '');
$secret  = (string)($config['telegram_webhook_secret'] ?? '');
$allowed = array_map('strval', $config['telegram_allowed_chat_ids'] ?? []);
$dir     = $config['storage_dir'] ?? "$root/storage";
$maxSize = 20 * 1024 * 1024; // Telegram-Bot-API-Limit für Downloads

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

/* /start bzw. /id: zeigt die Chat-ID, damit man sie in die Config eintragen kann. */
$text = trim((string)($msg['text'] ?? ''));
if ($text === '/start' || $text === '/id') {
    $known = in_array($chatId, $allowed, true);
    reply($token, $chatId, $known
        ? "Hallo! Schick mir die Speisekarte als PDF, dann ist sie sofort auf der Website.\n/status zeigt den aktuellen Stand."
        : "Deine Chat-ID ist $chatId.\nSie muss erst in der Server-Konfiguration freigeschaltet werden.");
    exit;
}

if (!in_array($chatId, $allowed, true)) exit; // Fremde ignorieren

if ($text === '/status') {
    $f = "$dir/speisekarte.pdf";
    reply($token, $chatId, is_file($f)
        ? 'Aktuelle Speisekarte vom ' . date('d.m.Y H:i', filemtime($f)) . ' Uhr (' . round(filesize($f) / 1024) . ' KB).'
        : 'Noch keine Speisekarte hochgeladen.');
    exit;
}

$doc = $msg['document'] ?? null;
if (!is_array($doc)) {
    if (isset($msg['photo'])) {
        reply($token, $chatId, 'Bitte die Speisekarte als PDF-Datei senden (Büroklammer → Datei), nicht als Foto.');
    }
    exit;
}

$isPdf = ($doc['mime_type'] ?? '') === 'application/pdf'
      || str_ends_with(strtolower((string)($doc['file_name'] ?? '')), '.pdf');
if (!$isPdf) { reply($token, $chatId, 'Das ist keine PDF-Datei. Bitte eine PDF senden.'); exit; }
if (($doc['file_size'] ?? 0) > $maxSize) { reply($token, $chatId, 'Die Datei ist größer als 20 MB. Bitte verkleinern.'); exit; }

$info = tg($token, 'getFile', ['file_id' => $doc['file_id']]);
$path = $info['result']['file_path'] ?? null;
if (!$path) { reply($token, $chatId, 'Download fehlgeschlagen. Bitte nochmal versuchen.'); exit; }

$data = @file_get_contents("https://api.telegram.org/file/bot$token/$path");
if ($data === false || strncmp($data, '%PDF', 4) !== 0) {
    reply($token, $chatId, 'Die Datei konnte nicht gelesen werden oder ist keine gültige PDF.');
    exit;
}

if (!is_dir($dir) && !mkdir($dir, 0750, true)) { reply($token, $chatId, 'Serverfehler: Speicherordner fehlt.'); exit; }
$target = "$dir/speisekarte.pdf";
if (is_file($target)) @copy($target, "$dir/speisekarte-vorher.pdf"); // eine Version Backup
$tmp = "$target.tmp";
if (file_put_contents($tmp, $data) === false || !rename($tmp, $target)) {
    reply($token, $chatId, 'Serverfehler beim Speichern.');
    exit;
}

$site = rtrim((string)($config['site_url'] ?? ''), '/');
reply($token, $chatId, 'Danke! Die neue Speisekarte ist jetzt online' . ($site ? ": $site/speisekarte.php" : '.'));
