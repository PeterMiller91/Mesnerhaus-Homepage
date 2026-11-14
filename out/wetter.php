<?php
/* Wetter-Proxy: Der Server ruft Open-Meteo ab und speichert das Ergebnis
   30 Minuten zwischen. Die IP-Adressen der Besucher gehen so nicht an
   Dritte, eine Einwilligung ist dafür nicht nötig.                     */
declare(strict_types=1);

require __DIR__ . '/_tk/tageskarte-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: public, max-age=900');

const LAT = 49.9147;
const LON = 11.9133;
const TTL = 1800;

$dir   = tk_dir();
$cache = "$dir/wetter.json";

if (@is_file($cache) && time() - (int)@filemtime($cache) < TTL) { readfile($cache); exit; }

$url = 'https://api.open-meteo.com/v1/forecast?latitude=' . LAT . '&longitude=' . LON
     . '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
     . '&timezone=Europe%2FBerlin&forecast_days=5';
$data = tk_http_get($url);

if ($data !== null && is_array(json_decode($data, true)['daily'] ?? null)) {
    if (!@is_dir($dir)) @mkdir($dir, 0755, true);
    @file_put_contents("$cache.tmp", $data) !== false && @rename("$cache.tmp", $cache);
    echo $data;
    exit;
}
if (@is_file($cache)) { readfile($cache); exit; }       // veraltet, aber besser als nichts
http_response_code(502);
echo '{"error":"weather unavailable"}';
