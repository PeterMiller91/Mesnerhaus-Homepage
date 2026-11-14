<?php
/* Liefert den aktuellen Hinweis-Banner als JSON (gepflegt über die Upload-Seite). */
declare(strict_types=1);

require __DIR__ . '/_tk/tageskarte-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');
header('X-Content-Type-Options: nosniff');

$n = tk_notice_active();
echo json_encode($n
    ? ['active' => true, 'text' => $n['text'], 'link' => $n['link'] ?? '', 'url' => $n['url'] ?? '', 'label' => $n['label'] ?? '', 'until' => $n['until'] ?? '', 'updated' => $n['updated'] ?? '']
    : ['active' => false], JSON_UNESCAPED_UNICODE);
