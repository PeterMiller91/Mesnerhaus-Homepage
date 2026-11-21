<?php
/* Gemeinsame Logik für die Tageskarte (Upload-Seite und Telegram-Bot).
   Liegt in out/_tk/, weil PHP auf manchen Servern (open_basedir) nur
   innerhalb des Webroots lesen darf. Direkter Aufruf → 404.            */
declare(strict_types=1);

if (realpath((string)($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(404); exit; }

define('TK_DOCROOT', dirname(__DIR__));          // …/out
define('TK_REPO_ROOT', dirname(TK_DOCROOT));     // …/ (Repo-Wurzel)

/* Mögliche Orte der Config, in dieser Reihenfolge. */
function tk_config_candidates(): array {
    return [TK_REPO_ROOT . '/mesnerhaus-config.php', TK_DOCROOT . '/mesnerhaus-config.php'];
}

function tk_config_file(): ?string {
    foreach (tk_config_candidates() as $f) if (@is_file($f) && @is_readable($f)) return $f;
    return null;
}

function tk_config(): array {
    static $cfg = null;
    if ($cfg === null) {
        $file = tk_config_file();
        $cfg  = $file ? (array)require $file : [];
    }
    return $cfg;
}

/* Speicherordner: aus der Config, sonst neben out/ (falls erlaubt), sonst in out/. */
function tk_dir(): string {
    static $dir = null;
    if ($dir !== null) return $dir;
    $cfg = tk_config()['storage_dir'] ?? null;
    if (is_string($cfg) && $cfg !== '') return $dir = $cfg;
    $outside = TK_REPO_ROOT . '/storage';
    if (@is_dir($outside) || @is_writable(TK_REPO_ROOT)) return $dir = $outside;
    return $dir = TK_DOCROOT . '/tageskarte-daten';
}

function tk_paths(): array {
    $d = tk_dir();
    return ['pdf' => "$d/tageskarte.pdf", 'jpg' => "$d/tageskarte.jpg", 'meta' => "$d/tageskarte.json"];
}

/* JPEG → einseitige A4-PDF, ohne Zusatzbibliothek. */
function tk_jpeg_to_pdf(string $jpeg, int $w, int $h, int $channels): string {
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
function tk_to_jpeg(string $data): ?string {
    if (strncmp($data, "\xFF\xD8", 2) === 0) return $data;
    if (!function_exists('imagecreatefromstring')) return null;
    $im = @imagecreatefromstring($data);
    if (!$im) return null;
    ob_start(); imagejpeg($im, null, 88); imagedestroy($im);
    return (string)ob_get_clean();
}

function tk_save_atomic(string $path, string $data): bool {
    $tmp = "$path.tmp";
    return file_put_contents($tmp, $data) !== false && rename($tmp, $path);
}

/* Speichert eine neue Tageskarte aus Bild- oder PDF-Daten.
   Rückgabe: null bei Erfolg, sonst eine Fehlermeldung für den Nutzer. */
function tk_store(string $raw, string $caption): ?string {
    $pdfData = null; $jpgData = null;
    if (strncmp($raw, '%PDF', 4) === 0) {
        $pdfData = $raw;
    } else {
        $jpgData = tk_to_jpeg($raw);
        if ($jpgData === null) return 'Dieses Dateiformat kann nicht gelesen werden. Bitte ein Foto (JPEG) oder eine PDF verwenden.';
        $info = @getimagesizefromstring($jpgData);
        if (!$info || ($info[2] ?? 0) !== IMAGETYPE_JPEG) return 'Das Bild konnte nicht gelesen werden.';
        $pdfData = tk_jpeg_to_pdf($jpgData, (int)$info[0], (int)$info[1], (int)($info['channels'] ?? 3));
    }

    $dir = tk_dir();
    if (!@is_dir($dir) && !@mkdir($dir, 0755, true)) return 'Serverfehler: Speicherordner kann nicht angelegt werden.';
    $p = tk_paths();
    if (is_file($p['pdf'])) @copy($p['pdf'], "$dir/tageskarte-vorher.pdf");   // eine Version Backup

    $caption = trim($caption);
    $caption = function_exists('mb_substr') ? mb_substr($caption, 0, 120) : substr($caption, 0, 120);

    $ok = tk_save_atomic($p['pdf'], $pdfData);
    if ($ok && $jpgData !== null) $ok = tk_save_atomic($p['jpg'], $jpgData);
    elseif ($ok && is_file($p['jpg'])) @unlink($p['jpg']);                   // PDF ohne Vorschaubild
    $ok = $ok && tk_save_atomic($p['meta'], (string)json_encode(['caption' => $caption], JSON_UNESCAPED_UNICODE));
    return $ok ? null : 'Serverfehler beim Speichern.';
}

function tk_delete(): void {
    foreach (tk_paths() as $f) if (is_file($f)) @unlink($f);
}

function tk_current(): ?array {
    $p = tk_paths();
    if (!is_file($p['pdf'])) return null;
    $m = is_file($p['meta']) ? (json_decode((string)file_get_contents($p['meta']), true) ?: []) : [];
    return ['updated' => filemtime($p['pdf']), 'caption' => (string)($m['caption'] ?? ''), 'image' => is_file($p['jpg'])];
}

/* HTTP-GET über curl oder allow_url_fopen. */
function tk_http_get(string $url, int $timeout = 8): ?string {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $timeout,
            CURLOPT_FOLLOWLOCATION => true, CURLOPT_USERAGENT => 'mesnerhaus-website']);
        $res  = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ($res !== false && $code === 200) ? (string)$res : null;
    }
    $ctx = stream_context_create(['http' => ['timeout' => $timeout, 'header' => "User-Agent: mesnerhaus-website\r\n"]]);
    $res = @file_get_contents($url, false, $ctx);
    return $res === false ? null : $res;
}

/* ── Hinweis-Banner ──────────────────────────────────────────── */
const TK_NOTICE_LINKS = [
    ''          => 'Kein Link',
    '#menu'     => 'Zur Tageskarte',
    '#hours'    => 'Tisch reservieren',
    '#location' => 'Anfahrt',
    'tel'       => 'Anrufen',
    'custom'    => 'Eigener Link …',
];

function tk_notice_file(): string { return tk_dir() . '/hinweis.json'; }

function tk_notice_get(): ?array {
    $f = tk_notice_file();
    if (!@is_file($f)) return null;
    $n = json_decode((string)@file_get_contents($f), true);
    return is_array($n) && ($n['text'] ?? '') !== '' ? $n : null;
}

/* Aktiv = vorhanden und „anzeigen bis“ (falls gesetzt) noch nicht vorbei (Zeitzone Berlin). */
function tk_notice_active(): ?array {
    $n = tk_notice_get();
    if (!$n) return null;
    $until = (string)($n['until'] ?? '');
    if ($until !== '') {
        $today = (new DateTime('now', new DateTimeZone('Europe/Berlin')))->format('Y-m-d');
        if ($until < $today) return null;
    }
    return $n;
}

function tk_notice_save(string $text, string $link, string $until, string $url = '', string $label = ''): ?string {
    $text = trim(preg_replace('/\s+/u', ' ', $text) ?? '');
    if ($text === '') return 'Bitte einen Text eingeben.';
    $len = function_exists('mb_strlen') ? mb_strlen($text) : strlen($text);
    if ($len > 160) return 'Der Text ist zu lang (höchstens 160 Zeichen).';
    if (!array_key_exists($link, TK_NOTICE_LINKS)) $link = '';
    if ($until !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $until)) $until = '';

    $url = trim($url); $label = trim(preg_replace('/\s+/u', ' ', $label) ?? '');
    if ($link === 'custom') {
        if ($url !== '' && !preg_match('#^(https?://|/)#i', $url)) $url = 'https://' . $url;   // „www.beispiel.de“ erlauben
        $okUrl = $url !== '' && (substr($url, 0, 1) === '/' ? substr($url, 0, 2) !== '//' : filter_var($url, FILTER_VALIDATE_URL) !== false);
        if (!$okUrl || !preg_match('#^(https?://|/)#i', $url)) return 'Bitte eine gültige Link-Adresse eingeben, z. B. https://www.beispiel.de';
        if (strlen($url) > 300) return 'Die Link-Adresse ist zu lang.';
        if ($label === '') $label = 'Mehr erfahren';
        $llen = function_exists('mb_strlen') ? mb_strlen($label) : strlen($label);
        if ($llen > 40) return 'Der Link-Text ist zu lang (höchstens 40 Zeichen).';
    } else {
        $url = ''; $label = '';
    }

    $dir = tk_dir();
    if (!@is_dir($dir) && !@mkdir($dir, 0755, true)) return 'Serverfehler: Speicherordner kann nicht angelegt werden.';
    $data = json_encode(['text' => $text, 'link' => $link, 'url' => $url, 'label' => $label, 'until' => $until, 'updated' => date('c')], JSON_UNESCAPED_UNICODE);
    return tk_save_atomic(tk_notice_file(), (string)$data) ? null : 'Serverfehler beim Speichern.';
}

function tk_notice_delete(): void {
    $f = tk_notice_file();
    if (@is_file($f)) @unlink($f);
}
