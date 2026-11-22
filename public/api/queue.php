<?php
/* Verschickt wartende E-Mails und Push-Nachrichten (siehe rv_queue in resv-lib.php).
   Wird vom Browser nach einer Buchung/Änderung per sendBeacon aufgerufen; gibt keine Daten preis. */
declare(strict_types=1);

require dirname(__DIR__) . '/_tk/resv-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
rv_finish_response('{"ok":true}');
rv_queue_run();
