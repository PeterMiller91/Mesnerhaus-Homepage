<?php
/* Telegram-Webhook für die Tageskarte.
   Foto (oder PDF) an den Bot schicken → wird zur aktuellen Tageskarte.
   Fotos werden auf dem Server in eine PDF (DIN A4) umgewandelt.
   Einrichtung: server/README.md                                      */
declare(strict_types=1);

$root    = dirname(__DIR__, 2);                      // Repo-Wurzel (Webroot = out/)
$cfgFile = "$root/mesnerhaus-config.php";
if (!is_file($cfgFile)) { http_response_code(503); exit; }
$config = require $cfgFile;

$token   = (string)($config['telegram_bot_token'] ?? '');
$secret  = (string)($config['telegram_webhook_secret'] ?? '');
$allowed = array_map('strval', $config['telegram_allowed_chat_ids'] ?? []);
$dir     = $config['storage_dir'] ?? "$root/storage";
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

/* ── JPEG → einseitige A4-PDF, ohne Zusatzbibliothek ─────────── */
function jpegToPdf(string $jpeg, int $w, int $h, int $channels): string {
    $pageW = 595.28; $pageH = 841.89; $margin = 18;            // A4 in pt
    $scale = min(($pageW - 2 * $margin) / $w, ($pageH - 2 * $margin) / $h);
    $dw = $w * $scale; $dh = $h * $scale;
    $x = ($pageW - $dw) / 2; $y = ($pageH - $dh) / 2;
    $cs = $channels === 4 ? '/DeviceCMYK' : ($channels === 1 ? '/DeviceGray' : '/DeviceRGB');
    $decode = $channels === 4 ? ' /Decode [1 0 1 0 1 0 1 0]' : '';
    $content = sprintf("q %.2F 0 0 %.2F %.2F %.2F cm /Im0 Do Q", $dw, $dh, $x, $y);

    $objs = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        sprintf("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %.2F %.2F] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>", $pageW, $pageH),
        "<< /Type /XObject /Subtype /Image /Width $w /Height $h /ColorSpace $cs /BitsPerComponent 8 /Filter /DCTDecode$decode /Length " . strlen($jpeg) . " >>\nstream\n$jpeg\nendstream",
        "<< /Length " . strlen($content) . " >>\nstream\n$content\nendstream",
        "<< /Title (Tageskarte Mesnerhaus) /Producer (mesnerhausarmesberg.de) >>",
    ];
    $pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    $offsets = [];
    foreach ($objs as $i => $o) { $offsets[] = strlen($pdf); $pdf .= ($i + 1) . " 0 obj\n$o\nendobj\n"; }
    $xref = strlen($pdf);
    $pdf .= "xref\n0 " . (count($objs) + 1) . "\n0000000000 65535 f \n";
    foreach ($offsets as $off) $pdf .= sprintf("%010d 00000 n \n", $off);
    $pdf .= "trailer\n<< /Size " . (count($objs) + 1) . " /Root 1 0 R /Info 6 0 R >>\nstartxref\n$xref\n%%EOF\n";
    return $pdf;
}

/* PNG/WebP o. ä. nach JPEG wandeln, falls GD vorhanden ist. */
function toJpeg(string $data): ?string {
    if (strncmp($data, "\xFF\xD8", 2) === 0) return $data;
    if (!function_exists('imagecreatefromstring')) return null;
    $im = @imagecreatefromstring($data);
    if (!$im) return null;
    ob_start(); imagejpeg($im, null, 88); imagedestroy($im);
    return (string)ob_get_clean();
}

function saveAtomic(string $path, string $data): bool {
    $tmp = "$path.tmp";
    return file_put_contents($tmp, $data) !== false && rename($tmp, $path);
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

$pdfPath  = "$dir/tageskarte.pdf";
$jpgPath  = "$dir/tageskarte.jpg";
$metaPath = "$dir/tageskarte.json";

if ($text === '/status') {
    reply($token, $chatId, is_file($pdfPath)
        ? 'Online ist die Tageskarte vom ' . date('d.m.Y, H:i', filemtime($pdfPath)) . ' Uhr.' . ($site ? "\n$site/tageskarte.php" : '')
        : 'Aktuell ist keine Tageskarte online.');
    exit;
}
if ($text === '/loeschen' || $text === '/löschen') {
    foreach ([$pdfPath, $jpgPath, $metaPath] as $f) if (is_file($f)) @unlink($f);
    reply($token, $chatId, 'Die Tageskarte wurde von der Website entfernt.');
    exit;
}

/* ── Upload ──────────────────────────────────────────────────── */
$caption = trim((string)($msg['caption'] ?? ''));
$pdfData = null; $jpgData = null;

if (!empty($msg['photo']) && is_array($msg['photo'])) {
    $best = end($msg['photo']);                                  // größte Auflösung
    $jpgData = download($token, (string)$best['file_id']);
} elseif (is_array($msg['document'] ?? null)) {
    $doc = $msg['document'];
    if (($doc['file_size'] ?? 0) > $maxSize) { reply($token, $chatId, 'Die Datei ist größer als 20 MB.'); exit; }
    $raw = download($token, (string)$doc['file_id']);
    if ($raw === null) { reply($token, $chatId, 'Download fehlgeschlagen. Bitte nochmal senden.'); exit; }
    if (strncmp($raw, '%PDF', 4) === 0) {
        $pdfData = $raw;
    } else {
        $jpgData = toJpeg($raw);
        if ($jpgData === null) { reply($token, $chatId, 'Dieses Dateiformat kann ich nicht lesen. Bitte als Foto oder PDF senden.'); exit; }
    }
} else {
    if ($text !== '') reply($token, $chatId, 'Schick mir ein Foto der Tageskarte oder eine PDF. /start zeigt die Hilfe.');
    exit;
}

if ($pdfData === null && $jpgData === null) { reply($token, $chatId, 'Download fehlgeschlagen. Bitte nochmal senden.'); exit; }

if ($jpgData !== null) {
    $info = @getimagesizefromstring($jpgData);
    if (!$info || ($info[2] ?? 0) !== IMAGETYPE_JPEG) { reply($token, $chatId, 'Das Bild konnte nicht gelesen werden.'); exit; }
    $pdfData = jpegToPdf($jpgData, (int)$info[0], (int)$info[1], (int)($info['channels'] ?? 3));
}

if (!is_dir($dir) && !mkdir($dir, 0750, true)) { reply($token, $chatId, 'Serverfehler: Speicherordner fehlt.'); exit; }
if (is_file($pdfPath)) @copy($pdfPath, "$dir/tageskarte-vorher.pdf");   // eine Version Backup

$ok = saveAtomic($pdfPath, $pdfData);
if ($ok && $jpgData !== null) $ok = saveAtomic($jpgPath, $jpgData);
elseif ($ok && is_file($jpgPath)) @unlink($jpgPath);                      // PDF ohne Vorschaubild
$ok = $ok && saveAtomic($metaPath, json_encode(['caption' => function_exists('mb_substr') ? mb_substr($caption, 0, 120) : substr($caption, 0, 120)], JSON_UNESCAPED_UNICODE));

reply($token, $chatId, $ok
    ? 'Danke! Die neue Tageskarte ist online' . ($site ? ":\n$site/#menu" : '.')
    : 'Serverfehler beim Speichern.');
