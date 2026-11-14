<?php
/* Upload-Seite für die Tageskarte, erreichbar nur über den geheimen Link
     https://<domain>/tageskarte-upload.php?k=<upload_key>
   Der Schlüssel steht in mesnerhaus-config.php (upload_key).
   Einrichtung: server/README.md                                           */
declare(strict_types=1);

require __DIR__ . '/_tk/tageskarte-lib.php';

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');

$cfg = tk_config();
$key = (string)($cfg['upload_key'] ?? '');
$given = (string)($_POST['k'] ?? $_GET['k'] ?? '');
$isJson = isset($_GET['json']);

function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

function page(string $title, string $body): void {
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="de"><head><meta charset="utf-8">'
       . '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
       . '<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#527A1F">'
       . '<link rel="icon" href="favicon.ico" sizes="48x48"><link rel="icon" href="icon.svg" type="image/svg+xml">'
       . '<link rel="apple-touch-icon" href="apple-icon.png"><meta name="apple-mobile-web-app-title" content="Tageskarte">'
       . '<title>' . h($title) . '</title><style>' . CSS . '</style></head><body>' . $body . '</body></html>';
}

const CSS = <<<'CSS'
:root{--brand:#8DB43A;--dark-green:#527A1F;--pale:#F2F7E8;--light:#C6DC80;--ink:#2C2C2A;--mid:#666660;--muted:#9A9A94;--line:#E0E0D6;--bg:#FAFAF5;--err:#A6452F;--ok:#3F7A22}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))}
main{max-width:520px;margin:0 auto;display:grid;gap:18px}
header{display:flex;align-items:center;gap:12px;padding-top:6px}
header .logo{width:40px;height:40px;border-radius:10px;background:var(--brand);display:grid;place-items:center;color:#fff}
h1{font:600 22px/1.2 Georgia,"Times New Roman",serif;margin:0}
header p{margin:0;font-size:13px;color:var(--muted)}
.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;display:grid;gap:14px}
.card h2{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0}
.pick{display:grid;place-items:center;gap:8px;text-align:center;border:2px dashed var(--light);border-radius:14px;padding:26px 14px;background:var(--pale);color:var(--dark-green);font-weight:700;cursor:pointer}
.pick small{font-weight:400;color:var(--mid)}
.pick input{position:absolute;width:1px;height:1px;opacity:0}
.preview{display:none;border-radius:12px;max-height:60vh;width:100%;object-fit:contain;background:var(--pale)}
label.f{display:grid;gap:6px;font-size:14px;font-weight:700;color:var(--mid)}
select,textarea,input[type=date]{font:inherit;padding:12px 14px;border:1px solid var(--line);border-radius:12px;width:100%;background:#fff;color:var(--ink)}
textarea{resize:vertical;min-height:84px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media (max-width:420px){.row{grid-template-columns:1fr}}
[hidden]{display:none!important}
.count{font-size:12px;color:var(--muted);text-align:right;margin-top:-8px}
.pill{display:inline-block;font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px}
.pill.on{background:#E8F3DC;color:var(--ok)} .pill.off{background:#F1F0EA;color:var(--muted)}
.nb{background:#3D5C15;color:#fff;border-radius:12px;padding:10px 14px;font-size:14px;font-weight:700}
input[type=text]{font:inherit;padding:12px 14px;border:1px solid var(--line);border-radius:12px;width:100%;background:#fff;color:var(--ink)}
input[type=text]:focus,button:focus-visible,.pick:focus-within{outline:3px solid var(--light);outline-offset:2px}
button{font:inherit;font-weight:700;border-radius:999px;padding:14px 20px;border:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px}
.primary{background:var(--brand);color:#fff;width:100%}
.primary:disabled{opacity:.5;cursor:not-allowed}
.ghost{background:transparent;color:var(--err);border:1.5px solid #E5C1B6;padding:10px 16px;font-size:14px}
.msg{border-radius:12px;padding:12px 14px;font-size:15px}
.msg.ok{background:#E8F3DC;color:var(--ok)}
.msg.err{background:#F8E6E0;color:var(--err)}
.cur{display:grid;grid-template-columns:96px 1fr;gap:14px;align-items:start}
.cur img{width:96px;height:128px;object-fit:cover;border-radius:10px;border:1px solid var(--line)}
.cur .ph{width:96px;height:128px;border-radius:10px;background:var(--pale);display:grid;place-items:center;color:var(--dark-green);font-size:12px;font-weight:700}
.cur b{display:block}
.cur span{font-size:13px;color:var(--muted)}
.cur a{color:var(--dark-green);font-weight:700;font-size:14px}
.links{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:6px}
.hint{font-size:13px;color:var(--muted);margin:0}
.spin{width:18px;height:18px;border:2.5px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:s .8s linear infinite;display:none}
.busy .spin{display:inline-block}
@keyframes s{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.spin{animation:none}}
CSS;

/* ── Zugang prüfen ───────────────────────────────────────────── */
if (strlen($key) < 24) {
    http_response_code(503);
    $where = tk_config_file();
    $hint = $where === null
        ? '<p class="hint">Die Datei <code>mesnerhaus-config.php</code> wurde nicht gefunden. Gesucht an diesen Orten:</p><ul class="hint">'
          . implode('', array_map(function ($f) { return '<li><code>' . h(basename(dirname($f))) . '/mesnerhaus-config.php</code></li>'; }, tk_config_candidates()))
          . '</ul><p class="hint">Der erste Ort ist der Ordner, in dem <code>out</code> liegt, der zweite ist <code>out</code> selbst. Falls PHP nicht aus dem ersten lesen darf, die Datei in den Ordner <code>out</code> legen.</p>'
        : '<p class="hint">Die Config wurde gefunden, aber <code>upload_key</code> fehlt oder ist kürzer als 24 Zeichen.</p>';
    page('Upload nicht eingerichtet', '<main><div class="card"><h1>Upload ist noch nicht eingerichtet</h1>' . $hint . '</div></main>');
    exit;
}
if ($given === '' || !hash_equals($key, $given)) {
    usleep(800000);                                   // bremst Raten aus
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Nicht gefunden.';
    exit;
}

/* ── Aktionen ────────────────────────────────────────────────── */
$flash = null; $flashOk = true;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string)($_POST['do'] ?? 'upload');
    if ($action === 'delete') {
        tk_delete();
        $flash = 'Die Tageskarte wurde von der Website entfernt.';
    } elseif ($action === 'notice_save') {
        $e = tk_notice_save((string)($_POST['notice_text'] ?? ''), (string)($_POST['notice_link'] ?? ''), (string)($_POST['notice_until'] ?? ''),
            (string)($_POST['notice_url'] ?? ''), (string)($_POST['notice_label'] ?? ''));
        if ($e === null) $flash = 'Der Hinweis-Banner ist jetzt online.';
        else { $flash = $e; $flashOk = false; }
    } elseif ($action === 'notice_delete') {
        tk_notice_delete();
        $flash = 'Der Hinweis-Banner wurde entfernt.';
    } else {
        $f = $_FILES['file'] ?? null;
        $err = is_array($f) ? (int)$f['error'] : UPLOAD_ERR_NO_FILE;
        if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) {
            $flash = 'Die Datei ist zu groß für den Server (Grenze: ' . ini_get('upload_max_filesize') . ').'; $flashOk = false;
        } elseif ($err !== UPLOAD_ERR_OK || !is_uploaded_file((string)$f['tmp_name'])) {
            $flash = 'Bitte zuerst ein Foto oder eine PDF auswählen.'; $flashOk = false;
        } elseif ((int)$f['size'] > 20 * 1024 * 1024) {
            $flash = 'Die Datei ist größer als 20 MB.'; $flashOk = false;
        } else {
            $e = tk_store((string)file_get_contents((string)$f['tmp_name']), (string)($_POST['caption'] ?? ''));
            if ($e === null) $flash = 'Danke! Die neue Tageskarte ist jetzt online.';
            else { $flash = $e; $flashOk = false; }
        }
    }
    if ($isJson) {
        header('Content-Type: application/json; charset=utf-8');
        if (!$flashOk) http_response_code(400);
        echo json_encode(['ok' => $flashOk, 'message' => $flash], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

/* ── Seite ───────────────────────────────────────────────────── */
$cur    = tk_current();
$notice = tk_notice_get();
$noticeActive = tk_notice_active() !== null;
$self = 'tageskarte-upload.php?k=' . rawurlencode($given);
$v    = $cur ? (string)$cur['updated'] : '';

ob_start(); ?>
<main>
  <header>
    <span class="logo" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>
    </span>
    <div><h1>Tageskarte &amp; Hinweise</h1><p>Mesnerhaus am Armesberg</p></div>
  </header>

  <div id="msg" class="msg <?= $flashOk ? 'ok' : 'err' ?>" <?= $flash ? '' : 'hidden' ?>><?= h((string)$flash) ?></div>

  <form class="card" id="up" method="post" action="<?= h($self) ?>" enctype="multipart/form-data">
    <h2>Neue Karte</h2>
    <input type="hidden" name="k" value="<?= h($given) ?>">
    <input type="hidden" name="do" value="upload">
    <label class="pick" id="pick">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span id="pickText">Foto aufnehmen oder auswählen</span>
      <small>Foto der Tafel oder eine PDF</small>
      <input id="file" type="file" name="file" accept="image/*,application/pdf">
    </label>
    <img id="preview" class="preview" alt="Vorschau der ausgewählten Tageskarte">
    <label class="f">Überschrift (optional)
      <input id="caption" type="text" name="caption" maxlength="120" placeholder="z. B. Sonntag, 22. November" autocomplete="off">
    </label>
    <button class="primary" id="send" type="submit"><span class="spin" aria-hidden="true"></span><span id="sendText">Hochladen</span></button>
    <p class="hint">Tipp: Karte flach hinlegen, von oben bei gutem Licht fotografieren.</p>
  </form>

  <section class="card">
    <h2>Gerade online</h2>
    <?php if ($cur): ?>
      <div class="cur">
        <?php if ($cur['image']): ?>
          <img src="tageskarte.php?bild&amp;v=<?= h($v) ?>" alt="Aktuelle Tageskarte">
        <?php else: ?>
          <div class="ph">PDF</div>
        <?php endif; ?>
        <div>
          <b><?= h($cur['caption'] !== '' ? $cur['caption'] : 'Tageskarte') ?></b>
          <span>hochgeladen am <?= h(date('d.m.Y \u\m H:i', (int)$cur['updated'])) ?> Uhr</span>
          <div class="links">
            <a href="tageskarte.php?v=<?= h($v) ?>" target="_blank" rel="noopener">PDF ansehen</a>
            <a href="./#menu" target="_blank" rel="noopener">Auf der Website</a>
          </div>
        </div>
      </div>
      <form method="post" action="<?= h($self) ?>" id="del">
        <input type="hidden" name="k" value="<?= h($given) ?>">
        <input type="hidden" name="do" value="delete">
        <button class="ghost" type="submit">Von der Website entfernen</button>
      </form>
    <?php else: ?>
      <p class="hint">Aktuell ist keine Tageskarte online. Auf der Website steht „Die nächste Tageskarte folgt in Kürze“.</p>
    <?php endif; ?>
  </section>

  <form class="card" method="post" action="<?= h($self) ?>" id="notice">
    <h2>Hinweis-Banner <?php if ($notice): ?><span class="pill <?= $noticeActive ? 'on' : 'off' ?>"><?= $noticeActive ? 'online' : 'abgelaufen' ?></span><?php endif; ?></h2>
    <p class="hint">Erscheint ganz oben auf der Website, z. B. für Betriebsurlaub, Sonderöffnungen oder Aktionen.</p>
    <?php if ($notice): ?>
      <div class="nb" aria-label="Vorschau"><?= h((string)$notice['text']) ?></div>
    <?php endif; ?>
    <input type="hidden" name="k" value="<?= h($given) ?>">
    <input type="hidden" name="do" value="notice_save">
    <label class="f">Text
      <textarea id="notice_text" name="notice_text" maxlength="160" required placeholder="z. B. Am 24. und 25. Dezember geschlossen. Wir wünschen frohe Weihnachten!"><?= h((string)($notice['text'] ?? '')) ?></textarea>
    </label>
    <div class="count"><span id="notice_count">0</span> / 160</div>
    <div class="row">
      <label class="f">Link (optional)
        <select id="notice_link" name="notice_link">
          <?php foreach (TK_NOTICE_LINKS as $val => $label): ?>
            <option value="<?= h($val) ?>" <?= ($notice['link'] ?? '') === $val ? 'selected' : '' ?>><?= h($label) ?></option>
          <?php endforeach; ?>
        </select>
      </label>
      <label class="f">Anzeigen bis (optional)
        <input id="notice_until" type="date" name="notice_until" value="<?= h((string)($notice['until'] ?? '')) ?>">
      </label>
    </div>
    <div class="row" id="custom_link" <?= ($notice['link'] ?? '') === 'custom' ? '' : 'hidden' ?>>
      <label class="f">Link-Adresse
        <input id="notice_url" type="text" inputmode="url" name="notice_url" maxlength="300" placeholder="https://www.beispiel.de" value="<?= h((string)($notice['url'] ?? '')) ?>">
      </label>
      <label class="f">Link-Text
        <input id="notice_label" type="text" name="notice_label" maxlength="40" placeholder="Mehr erfahren" value="<?= h((string)($notice['label'] ?? '')) ?>">
      </label>
    </div>
    <p class="hint">Ohne Datum bleibt der Banner, bis du ihn entfernst. Mit Datum verschwindet er nach diesem Tag automatisch.</p>
    <button class="primary" type="submit">Banner speichern</button>
  </form>
  <?php if ($notice): ?>
    <form method="post" action="<?= h($self) ?>" id="notice_del" style="margin-top:-6px">
      <input type="hidden" name="k" value="<?= h($given) ?>">
      <input type="hidden" name="do" value="notice_delete">
      <button class="ghost" type="submit">Banner entfernen</button>
    </form>
  <?php endif; ?>

  <p class="hint">Diesen Link nicht weitergeben: Wer ihn kennt, kann die Tageskarte ändern. Tipp: als Lesezeichen oder auf dem Startbildschirm speichern.</p>
</main>

<script>
(() => {
  const form = document.getElementById('up'), file = document.getElementById('file'),
        prev = document.getElementById('preview'), pickText = document.getElementById('pickText'),
        send = document.getElementById('send'), sendText = document.getElementById('sendText'),
        msg = document.getElementById('msg'), del = document.getElementById('del');

  const show = (text, ok) => { msg.textContent = text; msg.className = 'msg ' + (ok ? 'ok' : 'err'); msg.hidden = false; msg.scrollIntoView({behavior:'smooth', block:'center'}); };

  file.addEventListener('change', () => {
    const f = file.files[0]; if (!f) return;
    pickText.textContent = f.name;
    if (f.type.startsWith('image/')) { prev.src = URL.createObjectURL(f); prev.style.display = 'block'; }
    else prev.style.display = 'none';
  });

  /* Fotos im Browser auf max. 2200 px verkleinern (umgeht Upload-Grenzen, wandelt iPhone-HEIC in JPEG). */
  async function shrink(f) {
    if (!f.type.startsWith('image/')) return f;
    try {
      const bmp = await createImageBitmap(f, { imageOrientation: 'from-image' });
      const s = Math.min(1, 2200 / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas');
      c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.86));
      return blob ? new File([blob], 'tageskarte.jpg', { type: 'image/jpeg' }) : f;
    } catch { return f; }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = file.files[0];
    if (!f) { show('Bitte zuerst ein Foto oder eine PDF auswählen.', false); return; }
    send.disabled = true; send.classList.add('busy'); sendText.textContent = 'Wird hochgeladen …';
    try {
      const fd = new FormData(form);
      fd.set('file', await shrink(f));
      const r = await fetch(form.getAttribute('action') + '&json', { method: 'POST', body: fd });
      const j = await r.json().catch(() => ({ ok: false, message: 'Unerwartete Antwort vom Server (' + r.status + ').' }));
      if (j.ok) { location.replace(form.getAttribute('action') + '&ok=1'); return; }
      show(j.message || 'Hochladen fehlgeschlagen.', false);
    } catch { show('Keine Verbindung. Bitte nochmal versuchen.', false); }
    send.disabled = false; send.classList.remove('busy'); sendText.textContent = 'Hochladen';
  });

  if (del) del.addEventListener('submit', (e) => {
    const b = del.querySelector('button');
    if (b.dataset.sure !== '1') { e.preventDefault(); b.dataset.sure = '1'; b.textContent = 'Wirklich entfernen? Nochmal tippen'; }
  });

  const nt = document.getElementById('notice_text'), nc = document.getElementById('notice_count');
  if (nt && nc) { const u = () => nc.textContent = nt.value.length; nt.addEventListener('input', u); u(); }
  const nl = document.getElementById('notice_link'), cl = document.getElementById('custom_link');
  if (nl && cl) { const t = () => { cl.hidden = nl.value !== 'custom'; }; nl.addEventListener('change', t); t(); }
  const nd = document.getElementById('notice_del');
  if (nd) nd.addEventListener('submit', (e) => {
    const b = nd.querySelector('button');
    if (b.dataset.sure !== '1') { e.preventDefault(); b.dataset.sure = '1'; b.textContent = 'Wirklich entfernen? Nochmal tippen'; }
  });

  if (new URLSearchParams(location.search).get('ok') === '1') show('Danke! Die neue Tageskarte ist jetzt online.', true);
})();
</script>
<?php
page('Tageskarte & Hinweise', (string)ob_get_clean());
