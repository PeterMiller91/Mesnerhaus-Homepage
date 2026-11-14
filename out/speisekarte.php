<?php
/* Liefert die über den Telegram-Bot hochgeladene Speisekarte aus.
   Die PDF liegt außerhalb des Webroots (siehe server/README.md). */
declare(strict_types=1);

$root   = dirname(__DIR__);                          // Repo-Wurzel (Webroot = out/)
$config = is_file("$root/mesnerhaus-config.php") ? require "$root/mesnerhaus-config.php" : [];
$dir    = $config['storage_dir'] ?? "$root/storage";
$file   = "$dir/speisekarte.pdf";

if (!is_file($file)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Aktuell ist keine Speisekarte hinterlegt.';
    exit;
}

$mtime = filemtime($file);
$etag  = '"' . md5($mtime . filesize($file)) . '"';
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="Speisekarte-Mesnerhaus.pdf"');
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');
header('ETag: ' . $etag);
header('Cache-Control: public, max-age=300');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) { http_response_code(304); exit; }
header('Content-Length: ' . filesize($file));
if ($_SERVER['REQUEST_METHOD'] === 'HEAD') exit;
readfile($file);
