<?php
/* Reservierungs-App: Ersteinrichtung, Anmeldung und App-Seite. */
declare(strict_types=1);

require dirname(__DIR__) . '/_tk/resv-lib.php';

header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");

rv_session_start();

function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }
function plen(string $s): int { return function_exists('mb_strlen') ? mb_strlen($s) : strlen($s); }
function uid(string $name): string { $id = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name) ?? ''); return trim($id, '-') ?: 'nutzer'; }

$error = null;
$users = rv_users();
$action = (string)($_POST['do'] ?? '');
$csrfOk = hash_equals((string)$_SESSION['csrf'], (string)($_POST['csrf'] ?? ''));

/* ── Ersteinrichtung ─────────────────────────────────────────── */
if (!$users && $action === 'setup' && $csrfOk) {
    $key = (string)(tk_config()['upload_key'] ?? '');
    $n1 = rv_clean((string)($_POST['n1'] ?? ''), 40); $p1 = (string)($_POST['p1'] ?? '');
    $n2 = rv_clean((string)($_POST['n2'] ?? ''), 40); $p2 = (string)($_POST['p2'] ?? '');
    if (strlen($key) < 24 || !hash_equals($key, (string)($_POST['key'] ?? ''))) { usleep(800000); $error = 'Der Schlüssel stimmt nicht. Es ist derselbe wie im Tageskarten-Link (upload_key).'; }
    elseif (plen($n1) < 2 || plen($p1) < 10) $error = 'Bitte deinen Namen und ein Passwort mit mindestens 10 Zeichen eingeben.';
    elseif ($n2 !== '' && plen($p2) < 10) $error = 'Das Passwort für den zweiten Zugang braucht mindestens 10 Zeichen.';
    else {
        $u = [uid($n1) => ['name' => $n1, 'role' => 'admin', 'hash' => password_hash($p1, PASSWORD_DEFAULT)]];
        if ($n2 !== '') $u[uid($n2) === uid($n1) ? uid($n2) . '-2' : uid($n2)] = ['name' => $n2, 'role' => 'team', 'hash' => password_hash($p2, PASSWORD_DEFAULT)];
        if (rv_save_users($u)) { session_regenerate_id(true); $_SESSION['user'] = uid($n1); header('Location: ./'); exit; }
        $error = 'Speichern fehlgeschlagen: Der Speicherordner ist nicht beschreibbar.';
    }
}

/* ── Anmelden / Abmelden ─────────────────────────────────────── */
if ($users && $action === 'login' && $csrfOk) {
    if (rv_login_blocked()) $error = 'Zu viele Fehlversuche. Bitte in 15 Minuten erneut versuchen.';
    else {
        $id = uid((string)($_POST['user'] ?? ''));
        $u = $users[$id] ?? null;
        foreach ($users as $k => $v) if (!$u && strcasecmp($v['name'], (string)($_POST['user'] ?? '')) === 0) { $id = $k; $u = $v; }
        if ($u && password_verify((string)($_POST['pass'] ?? ''), (string)$u['hash'])) {
            session_regenerate_id(true); $_SESSION['user'] = $id; header('Location: ./'); exit;
        }
        rv_login_failed(); usleep(600000);
        $error = 'Name oder Passwort stimmt nicht.';
    }
}
if ($action === 'logout' && $csrfOk) { $_SESSION = []; session_destroy(); header('Location: ./'); exit; }

$me = $users ? rv_current_user() : null;

function shell(string $title, string $body, bool $app = false): void {
    echo '<!doctype html><html lang="de"><head><meta charset="utf-8">'
       . '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
       . '<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#3D5C15">'
       . '<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="/icon.svg" type="image/svg+xml">'
       . '<link rel="apple-touch-icon" href="/apple-icon.png"><meta name="apple-mobile-web-app-title" content="Reservierungen">'
       . '<title>' . h($title) . '</title><link rel="stylesheet" href="app.css?v=1"></head><body>' . $body
       . ($app ? '<script src="app.js?v=1"></script>' : '') . '</body></html>';
}

if (!$me) {
    $csrf = h((string)$_SESSION['csrf']);
    $err = $error ? '<p class="alert err" role="alert">' . h($error) . '</p>' : '';
    if (!$users) {
        shell('Reservierungen einrichten', '<main class="auth"><div class="card">
          <h1>Reservierungen einrichten</h1>
          <p class="muted">Einmalig: Lege deinen Zugang und den für Theke/Empfang an.</p>' . $err . '
          <form method="post" class="form">
            <input type="hidden" name="do" value="setup"><input type="hidden" name="csrf" value="' . $csrf . '">
            <label>Schlüssel aus dem Tageskarten-Link<input name="key" type="password" required autocomplete="off"></label>
            <fieldset><legend>Dein Zugang (darf alles)</legend>
              <label>Name<input name="n1" required autocomplete="off" placeholder="z. B. Birgit"></label>
              <label>Passwort (mind. 10 Zeichen)<input name="p1" type="password" required minlength="10" autocomplete="new-password"></label>
            </fieldset>
            <fieldset><legend>Theke / Empfang (optional)</legend>
              <label>Name<input name="n2" autocomplete="off" placeholder="z. B. Theke"></label>
              <label>Passwort (mind. 10 Zeichen)<input name="p2" type="password" minlength="10" autocomplete="new-password"></label>
            </fieldset>
            <button class="btn primary" type="submit">Einrichten</button>
          </form></div></main>');
    } else {
        shell('Anmelden – Reservierungen', '<main class="auth"><div class="card">
          <div class="brand"><span class="logo" aria-hidden="true"></span><div><h1>Reservierungen</h1><p class="muted">Mesnerhaus am Armesberg</p></div></div>' . $err . '
          <form method="post" class="form">
            <input type="hidden" name="do" value="login"><input type="hidden" name="csrf" value="' . $csrf . '">
            <label>Name<input name="user" required autocomplete="username" autocapitalize="none"></label>
            <label>Passwort<input name="pass" type="password" required autocomplete="current-password"></label>
            <button class="btn primary" type="submit">Anmelden</button>
          </form></div></main>');
    }
    exit;
}

/* ── App ─────────────────────────────────────────────────────── */
$boot = json_encode(['csrf' => $_SESSION['csrf'], 'user' => $me, 'today' => date('Y-m-d')], JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP);
shell('Reservierungen', '<div id="app" data-boot="' . h((string)$boot) . '"><p class="loading">Lädt …</p></div>
<form id="logout" method="post" hidden><input type="hidden" name="do" value="logout"><input type="hidden" name="csrf" value="' . h((string)$_SESSION['csrf']) . '"></form>', true);
