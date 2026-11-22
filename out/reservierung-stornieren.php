<?php
/* Gäste können ihre Reservierung über den Link aus der Bestätigungsmail stornieren. */
declare(strict_types=1);

require __DIR__ . '/_tk/resv-lib.php';

header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');

function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

$token = (string)($_POST['t'] ?? $_GET['t'] ?? '');
$valid = (bool)preg_match('/^[a-f0-9]{32}$/', $token);

$find = function (array $d) use ($token) {
    foreach ($d['items'] as $i => $r) if (hash_equals((string)$r['token'], $token)) return $i;
    return null;
};

$msg = null; $r = null;
if ($valid) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $r = rv_with_lock(function () use ($find) {
            $d = rv_load(); $i = $find($d);
            if ($i === null) return null;
            if (in_array($d['items'][$i]['status'], RV_ACTIVE, true)) {
                $d['items'][$i]['status'] = 'storniert';
                $d['items'][$i]['seen'] = false;
                $d['items'][$i]['updated'] = date('c');
                $d['items'][$i]['by'] = 'Gast';
                if (rv_save($d)) $d['items'][$i]['_changed'] = true;
            }
            return $d['items'][$i];
        });
        if ($r && !empty($r['_changed'])) {           // E-Mails erst nach Freigabe der Sperre
            rv_queue('push', ['kind' => 'storno', 'title' => 'Storniert vom Gast',
                'body' => rv_date_de($r['date']) . ', ' . $r['time'] . ' Uhr · ' . (int)$r['persons'] . ' P. · ' . $r['name'],
                'url' => '/reservierungen/verwaltung/?day=' . $r['date']]);
            rv_queue('owner', ['r' => $r, 'what' => 'Storniert vom Gast']);
            rv_queue('guest_cancel', ['r' => $r]);
            $kick = true;
        }
        if ($r) $msg = 'Ihre Reservierung wurde storniert. Danke, dass Sie Bescheid gegeben haben!';
    } else {
        $d = rv_load(); $i = $find($d); $r = $i === null ? null : $d['items'][$i];
    }
}
$past = $r && strtotime($r['date'] . ' ' . $r['time']) < time();
?><!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Reservierung – Mesnerhaus am Armesberg</title>
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<style>
body{margin:0;background:#FAFAF5;color:#2C2C2A;font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:max(16px,env(safe-area-inset-top)) 16px 32px}
main{max-width:480px;margin:6vh auto 0;background:#fff;border:1px solid #E0E0D6;border-radius:16px;padding:24px}
h1{font:600 24px/1.25 Georgia,serif;margin:0 0 12px}
.box{background:#F2F7E8;border-radius:12px;padding:12px 14px;margin:14px 0}
button{font:inherit;font-weight:700;border:0;border-radius:999px;padding:14px 20px;background:#A6452F;color:#fff;width:100%;cursor:pointer;min-height:48px}
a{color:#3D5C15}.ok{color:#2F5A12;font-weight:700}.muted{color:#6E6E66;font-size:14px}
</style></head><body><main>
<?php if (!empty($kick)): ?><img src="/api/queue.php" alt="" width="1" height="1" style="position:absolute;opacity:0;pointer-events:none"><?php endif; ?>
<h1>Ihre Reservierung</h1>
<?php if (!$r): ?>
  <p>Diese Reservierung haben wir nicht gefunden. Vielleicht ist der Link unvollständig oder der Termin liegt schon länger zurück.</p>
  <p class="muted">Bei Fragen erreichen Sie uns unter <a href="tel:+4915111056281">0151 110 56 281</a>.</p>
<?php else: ?>
  <div class="box"><b><?= h(rv_date_de($r['date'])) ?>, <?= h($r['time']) ?> Uhr</b><br><?= (int)$r['persons'] ?> Personen · <?= h($r['name']) ?></div>
  <?php if ($msg): ?>
    <p class="ok"><?= h($msg) ?></p>
  <?php elseif ($r['status'] === 'storniert'): ?>
    <p>Diese Reservierung ist bereits storniert.</p>
  <?php elseif ($past): ?>
    <p>Dieser Termin liegt in der Vergangenheit.</p>
  <?php elseif (in_array($r['status'], RV_ACTIVE, true)): ?>
    <p>Sie können nicht kommen? Dann stornieren Sie bitte hier, damit andere Gäste den Platz bekommen.</p>
    <form method="post"><input type="hidden" name="t" value="<?= h($token) ?>"><button type="submit">Reservierung stornieren</button></form>
  <?php else: ?>
    <p>Diese Reservierung ist nicht mehr aktiv.</p>
  <?php endif; ?>
  <p class="muted" style="margin-top:18px">Mesnerhaus am Armesberg · <a href="tel:+4915111056281">0151 110 56 281</a> · <a href="/">Zur Website</a></p>
<?php endif; ?>
</main></body></html>
