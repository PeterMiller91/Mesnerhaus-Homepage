<?php
/* Liefert die aktuelle Tageskarte aus (hochgeladen über den Telegram-Bot).
     /tageskarte.php        → PDF
     /tageskarte.php?bild   → Vorschaubild (JPEG)
     /tageskarte.php?info   → JSON { updated, caption, image }
   Die Dateien liegen außerhalb des Webroots (siehe server/README.md). */
declare(strict_types=1);

require dirname(__DIR__) . '/server/tageskarte-lib.php';

['pdf' => $pdf, 'jpg' => $img, 'meta' => $meta] = tk_paths();

header('X-Content-Type-Options: nosniff');

if (isset($_GET['info'])) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-cache');
    if (!is_file($pdf)) { http_response_code(404); echo '{"available":false}'; exit; }
    $m = is_file($meta) ? (json_decode((string)file_get_contents($meta), true) ?: []) : [];
    echo json_encode([
        'available' => true,
        'updated'   => date('c', filemtime($pdf)),
        'caption'   => (string)($m['caption'] ?? ''),
        'image'     => is_file($img),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$file = isset($_GET['bild']) ? $img : $pdf;
$type = isset($_GET['bild']) ? 'image/jpeg' : 'application/pdf';

if (!is_file($file)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Aktuell ist keine Tageskarte hinterlegt.';
    exit;
}

$mtime = filemtime($file);
$etag  = '"' . md5($mtime . filesize($file)) . '"';
header("Content-Type: $type");
if ($type === 'application/pdf') {
    header('Content-Disposition: inline; filename="Tageskarte-Mesnerhaus-' . date('Y-m-d', $mtime) . '.pdf"');
}
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');
header('ETag: ' . $etag);
header('Cache-Control: no-cache');

if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) { http_response_code(304); exit; }
header('Content-Length: ' . filesize($file));
if ($_SERVER['REQUEST_METHOD'] === 'HEAD') exit;
readfile($file);
