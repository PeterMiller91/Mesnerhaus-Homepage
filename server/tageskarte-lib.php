<?php
/* Gemeinsame Logik für die Tageskarte (Upload-Seite und Telegram-Bot).
   Liegt außerhalb des Webroots out/ und wird per require eingebunden. */
declare(strict_types=1);

const TK_REPO_ROOT = __DIR__ . '/..';

function tk_config(): array {
    static $cfg = null;
    if ($cfg === null) {
        $file = TK_REPO_ROOT . '/mesnerhaus-config.php';
        $cfg  = is_file($file) ? (array)require $file : [];
    }
    return $cfg;
}

function tk_dir(): string {
    return (string)(tk_config()['storage_dir'] ?? TK_REPO_ROOT . '/storage');
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
    if (!is_dir($dir) && !@mkdir($dir, 0750, true)) return 'Serverfehler: Speicherordner kann nicht angelegt werden.';
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
