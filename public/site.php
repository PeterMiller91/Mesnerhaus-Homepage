<?php
/* Öffentliche Website-Inhalte aus der Verwaltung („Website“):
     /site.php           → JSON { effect, specials, gallery } für die Startseite
     /site.php?f=<datei> → Bild bzw. PDF (Sonderkarten, Galerie-Uploads) */
declare(strict_types=1);

require __DIR__ . '/_tk/site-lib.php';

header('X-Content-Type-Options: nosniff');

if (isset($_GET['f'])) {
    $name = (string)$_GET['f'];
    $path = site_dir() . '/' . $name;
    if (!preg_match('/^[a-z0-9-]+\.(jpg|pdf)$/', $name) || !is_file($path)) {
        http_response_code(404); header('Content-Type: text/plain; charset=utf-8'); echo 'Nicht gefunden.'; exit;
    }
    $pdf = substr($name, -4) === '.pdf';
    header('Content-Type: ' . ($pdf ? 'application/pdf' : 'image/jpeg'));
    if ($pdf) header('Content-Disposition: inline; filename="Mesnerhaus-' . $name . '"');
    header('Cache-Control: public, max-age=31536000, immutable');   // Dateinamen sind eindeutig, Inhalte ändern sich nie
    header('Content-Length: ' . filesize($path));
    readfile($path);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');
echo json_encode(site_public(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
