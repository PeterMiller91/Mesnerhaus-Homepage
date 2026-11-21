/* Reservierungs-App Mesnerhaus – ohne Framework, alle Gästedaten werden escaped. */
(function () {
  'use strict';
  var root = document.getElementById('app');
  var boot = JSON.parse(root.getAttribute('data-boot'));
  var isAdmin = boot.user.role === 'admin';
  var S = { date: boot.today, data: null, menu: false };

  /* ── Helfer ─────────────────────────────────────────────── */
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  var ICON = {
    left: '<path d="M15 18l-6-6 6-6"/>', right: '<path d="M9 18l6-6-6-6"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    print: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    check: '<path d="M20 6L9 17l-5-5"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    msg: '<path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.4A8.5 8.5 0 1 1 21 12z"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  function ico(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + '</svg>'; }
  var STATUS = { bestaetigt: 'Bestätigt', erschienen: 'Da', storniert: 'Storniert', abgelehnt: 'Abgelehnt', nicht_erschienen: 'Nicht erschienen' };
  var SOURCE = { online: 'Online', telefon: 'Telefon', whatsapp: 'WhatsApp', email: 'E-Mail', vor_ort: 'Vor Ort' };
  var WD = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  function addDays(d, n) { var x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); }
  function shortDate(d) { var x = new Date(d + 'T12:00:00'); return WD[x.getDay()].slice(0, 2) + ' ' + x.getDate() + '.' + (x.getMonth() + 1) + '.'; }
  function toast(t) {
    var el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = t;
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 3200);
  }
  function api(method, body, query) {
    var opt = { method: method, headers: { 'X-CSRF': boot.csrf }, credentials: 'same-origin' };
    if (body) { opt.body = JSON.stringify(body); opt.headers['Content-Type'] = 'application/json'; }
    return fetch('api.php' + (query || ''), opt).then(function (r) {
      if (r.status === 401) { location.reload(); throw new Error('login'); }
      return r.json().then(function (j) { j._status = r.status; return j; });
    });
  }
  function phoneIntl(p) {
    var d = String(p || '').replace(/[^\d+]/g, '');
    if (d.indexOf('+') === 0) return d.slice(1);
    if (d.indexOf('00') === 0) return d.slice(2);
    if (d.indexOf('0') === 0) return '49' + d.slice(1);
    return d;
  }

  /* ── Laden ──────────────────────────────────────────────── */
  function load(date) {
    if (date) S.date = date;
    return api('GET', null, '?day=' + encodeURIComponent(S.date)).then(function (j) { S.data = j; render(); });
  }

  /* ── Darstellung ────────────────────────────────────────── */
  function render() {
    var d = S.data;
    var html = '';
    html += '<header class="top"><div class="top-inner">' +
      '<div class="brand"><span class="logo" aria-hidden="true"></span><div><h1>Reservierungen</h1><p class="muted">Mesnerhaus am Armesberg</p></div></div>' +
      '<div class="datenav">' +
        '<button class="icon-btn" data-act="prev" aria-label="Vorheriger Tag">' + ico('left') + '</button>' +
        '<label class="day" title="Datum wählen">' + esc(d.label) + '<input type="date" id="pick" value="' + esc(d.date) + '"></label>' +
        '<button class="icon-btn" data-act="pickdate" aria-label="Datum wählen">' + ico('cal') + '</button>' +
        '<button class="icon-btn" data-act="next" aria-label="Nächster Tag">' + ico('right') + '</button>' +
      '</div>' +
      '<div class="top-actions">' +
        '<button class="btn ghost hide-sm" data-act="print">' + ico('print') + 'Drucken</button>' +
        '<button class="btn primary hide-sm" data-act="new">' + ico('plus') + 'Eintragen</button>' +
        '<div class="menu"><button class="icon-btn" data-act="menu" aria-label="Menü" aria-expanded="' + S.menu + '">' + ico('menu') + '</button>' +
          (S.menu ? '<div class="menu-list" role="menu"><div class="who">Angemeldet als <b>' + esc(boot.user.name) + '</b></div>' +
            (isAdmin ? '<button role="menuitem" data-act="settings">Einstellungen</button>' : '') +
            '<button role="menuitem" data-act="print">Tagesliste drucken</button>' +
            '<button role="menuitem" data-act="password">Passwort ändern</button>' +
            '<button role="menuitem" data-act="logout">Abmelden</button></div>' : '') +
        '</div>' +
      '</div></div></header>';

    html += '<main class="app">';
    html += '<nav class="daychips" aria-label="Nächste Tage">' + d.next.map(function (n) {
      return '<button class="daychip' + (n.date === d.date ? ' on' : '') + '" data-day="' + esc(n.date) + '"><b>' + esc(shortDate(n.date)) + '</b><span>' +
        (n.count ? n.count + ' Res. · ' + n.guests + ' Gäste' : (n.open ? 'noch frei' : 'geschlossen')) + '</span></button>';
    }).join('') + '</nav>';

    if (d.unseen.length) {
      html += '<div class="banner" role="status"><b>' + d.unseen.length + (d.unseen.length === 1 ? ' neue Online-Reservierung' : ' neue Online-Reservierungen') + '</b>' +
        '<div class="chips">' + d.unseen.map(function (u) {
          return '<button data-open="' + u.id + '" data-day="' + esc(u.date) + '">' + esc(shortDate(u.date)) + ' ' + esc(u.time) + ' · ' + esc(u.name) + ' (' + u.persons + ')' + (u.status === 'storniert' ? ' · storniert' : '') + '</button>';
        }).join('') + '</div><button class="btn small ghost" data-act="seenall">Alle gesehen</button></div>';
    }

    html += '<section class="kpis" aria-label="Kennzahlen">' +
      '<div class="kpi"><small>Reservierungen</small><b>' + d.stats.count + '</b></div>' +
      '<div class="kpi"><small>Gäste</small><b>' + d.stats.guests + '</b></div>' +
      '<div class="kpi"><small>Höchste Belegung</small><b>' + d.stats.peak + '</b> <span class="sub">von ' + d.seats + '</span></div>' +
      '<div class="kpi"><small>Online-Buchung</small><div class="toggle"><span class="dot' + (d.online_enabled ? '' : ' off') + '"></span>' + (d.online_enabled ? 'aktiv' : 'pausiert') + '</div></div>' +
      '</section>';

    html += '<div class="cols"><section class="panel"><h2>Ablauf <span class="count">' + d.items.length + ' Einträge</span></h2>' +
      '<p class="print-title">Reservierungen ' + esc(d.label) + ' · ' + d.stats.guests + ' Gäste</p>';
    if (!d.open) html += '<p class="closed-note">An diesem Tag ist regulär geschlossen. Feiern und Gruppen kannst du trotzdem eintragen.</p>';
    if (!d.items.length) html += '<p class="empty">Noch keine Reservierungen für diesen Tag.</p>';
    html += d.items.map(function (r) {
      var inactive = !(r.status === 'bestaetigt' || r.status === 'erschienen');
      var meta = [SOURCE[r.source] || r.source];
      if (r.table) meta.push('Tisch ' + r.table);
      if (r.note) meta.push(r.note);
      if (r.phone) meta.push(r.phone);
      return '<div class="row' + (inactive ? ' inactive' : '') + '">' +
        '<div class="t">' + esc(r.time) + '</div>' +
        '<button class="who" data-open="' + r.id + '"><b>' + esc(r.name) + (r.seen ? '' : ' <span class="chip neu">Neu</span>') + '</b><span>' + esc(meta.join(' · ')) + '</span></button>' +
        '<div class="p">' + r.persons + ' P.</div>' +
        '<div class="acts"><span class="chip ' + esc(r.status) + '">' + esc(STATUS[r.status] || r.status) + '</span>' +
          (r.status === 'bestaetigt' ? '<button class="btn small ghost" data-here="' + r.id + '" aria-label="' + esc(r.name) + ' ist da">' + ico('check') + '<span class="hide-xs">Da</span></button>' : '') +
        '</div></div>';
    }).join('');
    html += '</section><aside class="panel"><h2>Belegung</h2>' +
      (d.load.length ? '<div class="bars">' + d.load.map(function (l) {
        return '<div class="bar"><span>' + esc(l.time) + '</span><div class="track"><div class="fill' + (l.pct >= 85 ? ' hi' : '') + '" style="width:' + l.pct + '%"></div></div><span>' + l.guests + '/' + d.seats + '</span></div>';
      }).join('') + '</div><p class="hint" style="margin-top:10px">Gäste am Tisch, eine Reservierung belegt ' + d.duration + ' Minuten.</p>' : '<p class="empty">–</p>') +
      '</aside></div>';
    html += '</main><button class="btn primary fab" data-act="new" aria-label="Reservierung eintragen">' + ico('plus') + 'Eintragen</button>';
    root.innerHTML = html;

    $('#pick').addEventListener('change', function (e) { if (e.target.value) load(e.target.value); });
  }

  /* ── Bearbeiten / Eintragen ─────────────────────────────── */
  function dialog(title, body, foot) {
    var dlg = document.createElement('dialog');
    dlg.innerHTML = '<form class="dlg form" method="dialog" novalidate><header><h2>' + esc(title) + '</h2><button type="button" class="icon-btn" data-close aria-label="Schließen">' + ico('close') + '</button></header>' +
      '<div class="body">' + body + '<p class="alert err" data-err hidden></p></div><footer>' + foot + '</footer></form>';
    document.body.appendChild(dlg);
    dlg.addEventListener('close', function () { dlg.remove(); });
    $('[data-close]', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.showModal();
    return dlg;
  }
  function showErr(dlg, msg) { var e = $('[data-err]', dlg); e.textContent = msg; e.hidden = false; }

  function openEdit(id) {
    var r = id ? S.data.items.filter(function (x) { return x.id === id; })[0] : null;
    if (id && !r) return;
    if (r && !r.seen) api('POST', { action: 'seen', ids: [r.id] }).then(function () { r.seen = true; S.data.unseen = S.data.unseen.filter(function (u) { return u.id !== r.id; }); render(); });
    var v = r || { date: S.date, time: (S.data.slots[2] || S.data.slots[0] || '12:00'), persons: 2, name: '', phone: '', email: '', note: '', table: '', source: 'telefon', status: 'bestaetigt' };
    var timeOpts = S.data.slots.slice(); if (timeOpts.indexOf(v.time) < 0) timeOpts.push(v.time); timeOpts.sort();
    var opt = function (map, cur) { return Object.keys(map).map(function (k) { return '<option value="' + k + '"' + (k === cur ? ' selected' : '') + '>' + map[k] + '</option>'; }).join(''); };
    var quick = '';
    if (r) {
      var msg = 'Grüß Gott ' + r.name + ', Ihr Tisch für ' + r.persons + ' Personen am ' + shortDate(r.date).slice(3) + ' um ' + r.time + ' Uhr ist bestätigt. Wir freuen uns auf Sie! Ihr Mesnerhaus';
      quick = '<div class="quick">' +
        (r.phone ? '<a class="btn small ghost" href="tel:' + esc(r.phone.replace(/[^\d+]/g, '')) + '">' + ico('phone') + 'Anrufen</a>' +
          '<a class="btn small ghost" target="_blank" rel="noopener" href="https://wa.me/' + esc(phoneIntl(r.phone)) + '?text=' + encodeURIComponent(msg) + '">' + ico('msg') + 'WhatsApp-Bestätigung</a>' : '') +
        '</div><p class="hint" style="margin:-6px 0 12px">' + esc(SOURCE[r.source] || '') + ' eingegangen am ' + esc(new Date(r.created).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })) +
        (r.by ? ' · zuletzt geändert von ' + esc(r.by) : '') + '</p>';
    }
    var body = quick +
      '<div class="grid3">' +
        '<label>Datum<input type="date" name="date" required value="' + esc(v.date) + '"></label>' +
        '<label>Uhrzeit<input type="time" name="time" required step="300" list="slots" value="' + esc(v.time) + '"><datalist id="slots">' + timeOpts.map(function (t) { return '<option value="' + esc(t) + '">'; }).join('') + '</datalist></label>' +
        '<label>Personen<input type="number" name="persons" min="1" max="200" required value="' + esc(v.persons) + '"></label>' +
      '</div>' +
      '<label>Name<input name="name" required maxlength="80" value="' + esc(v.name) + '" autocomplete="off"></label>' +
      '<div class="grid2"><label>Telefon<input name="phone" type="tel" maxlength="40" value="' + esc(v.phone) + '" autocomplete="off"></label>' +
      '<label>E-Mail<input name="email" type="email" maxlength="120" value="' + esc(v.email) + '" autocomplete="off"></label></div>' +
      '<label>Notiz / Wunsch<textarea name="note" maxlength="300">' + esc(v.note) + '</textarea></label>' +
      '<div class="grid3"><label>Tisch<input name="table" maxlength="30" value="' + esc(v.table) + '"></label>' +
      '<label>Quelle<select name="source"' + (r && r.source === 'online' ? ' disabled' : '') + '>' + opt(SOURCE, v.source) + '</select></label>' +
      '<label>Status<select name="status">' + opt(STATUS, v.status) + '</select></label></div>' +
      (!r ? '<label class="check"><input type="checkbox" name="send_mail"> Bestätigung per E-Mail an den Gast senden</label>' : '');
    var foot = (r && (r.status === 'bestaetigt') ? '<button type="button" class="btn danger" data-cancel>Stornieren</button>' : '') +
      '<span style="flex:1"></span><button type="button" class="btn ghost" data-close2>Abbrechen</button><button type="submit" class="btn primary">Speichern</button>';
    var dlg = dialog(r ? r.name : 'Reservierung eintragen', body, foot);
    $('[data-close2]', dlg).addEventListener('click', function () { dlg.close(); });
    if ($('[data-cancel]', dlg)) $('[data-cancel]', dlg).addEventListener('click', function (e) {
      var b = e.currentTarget;
      if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Wirklich stornieren?'; return; }
      api('POST', { action: 'status', id: r.id, status: 'storniert' }).then(function () { dlg.close(); toast('Storniert'); load(); });
    });
    var form = $('form', dlg);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(form), data = { action: 'save' };
      f.forEach(function (val, key) { data[key] = val; });
      data.persons = parseInt(data.persons, 10) || 0;
      data.send_mail = !!form.send_mail && form.send_mail.checked;
      if (r) { data.id = r.id; data.source = r.source; }
      var send = function (force) {
        data.force = force;
        api('POST', data).then(function (j) {
          if (j.ok) { dlg.close(); toast(r ? 'Gespeichert' : (j.mailed ? 'Eingetragen, Bestätigung verschickt' : 'Eingetragen')); load(data.date); return; }
          if (j.over) {
            var btn = $('button[type=submit]', dlg); showErr(dlg, j.message);
            btn.textContent = 'Trotzdem eintragen'; btn.onclick = function (ev) { ev.preventDefault(); send(true); };
            return;
          }
          showErr(dlg, j.message || 'Speichern fehlgeschlagen.');
        });
      };
      send(false);
    });
  }

  /* ── Einstellungen (Admin) ──────────────────────────────── */
  function openSettings() {
    api('GET', null, '?settings').then(function (j) {
      var s = j.settings, closed = (s.closed_dates || []).slice();
      var wk = [1, 2, 3, 4, 5, 6, 0].map(function (i) {
        var d = s.week[String(i)];
        return '<div class="wd"><label><input type="checkbox" data-wd="' + i + '"' + (d ? ' checked' : '') + '> ' + WD[i] + '</label>' +
          ['open', 'last', 'close'].map(function (k) { return '<input type="time" aria-label="' + WD[i] + ' ' + k + '" data-wdt="' + i + '-' + k + '" value="' + esc(d ? d[k] : { open: '11:00', last: '15:30', close: '17:00' }[k]) + '">'; }).join('') + '</div>';
      }).join('');
      var users = j.users.map(function (u) {
        return '<div class="grid2" style="align-items:end"><label>' + esc(u.name) + ' (' + (u.role === 'admin' ? 'Admin' : 'Team') + ')<input type="password" minlength="10" placeholder="Neues Passwort" data-upw="' + esc(u.id) + '" autocomplete="new-password"></label>' +
          '<button type="button" class="btn small ghost" data-setpw="' + esc(u.id) + '">Passwort setzen</button></div>';
      }).join('');
      var body =
        '<fieldset><legend>Online-Buchung</legend>' +
        '<label class="check"><input type="checkbox" name="online_enabled"' + (s.online_enabled ? ' checked' : '') + '> Online-Buchung auf der Website aktiv</label>' +
        '<div class="grid3"><label>Plätze gesamt<input type="number" name="seats" min="1" value="' + s.seats + '"></label>' +
        '<label>davon online<input type="number" name="online_seats" min="0" value="' + s.online_seats + '"></label>' +
        '<label>Max. Personen online<input type="number" name="max_online" min="1" value="' + s.max_online + '"></label></div>' +
        '<div class="grid3"><label>Dauer (Min.)<input type="number" name="duration" min="30" step="15" value="' + s.duration + '"></label>' +
        '<label>Raster<select name="interval">' + [15, 30, 60].map(function (n) { return '<option' + (n === s.interval ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>' +
        '<label>Vorlauf (Std.)<input type="number" name="cutoff_hours" min="0" value="' + s.cutoff_hours + '"></label></div>' +
        '<label>So viele Tage im Voraus buchbar<input type="number" name="days_ahead" min="1" value="' + s.days_ahead + '"></label>' +
        '<label>Benachrichtigung an (leer = Kontaktadresse)<input type="email" name="notify_email" value="' + esc(s.notify_email) + '"></label></fieldset>' +
        '<fieldset><legend>Öffnungstage</legend><div class="week"><div class="wd head"><span></span><span>Öffnet</span><span>Letzte Ankunft</span><span>Schließt</span></div>' + wk + '</div></fieldset>' +
        '<fieldset><legend>Geschlossene Tage (Urlaub, Feiertage)</legend><div class="tags" data-closed></div>' +
        '<div class="grid2" style="align-items:end"><label>Datum<input type="date" data-addday></label><button type="button" class="btn small ghost" data-addbtn>Hinzufügen</button></div></fieldset>' +
        '<fieldset><legend>Zugänge</legend>' + users + '</fieldset>' +
        '<fieldset><legend>E-Mail-Versand</legend>' +
        '<p class="hint">Versandweg: <b>' + (j.mail.mode === 'smtp' ? 'SMTP über ' + esc(j.mail.smtp_host) + ':' + j.mail.smtp_port : 'PHP mail() des Webservers') + '</b> · Absender: ' + esc(j.mail.from) + '</p>' +
        '<div class="grid2" style="align-items:end"><label>Test-E-Mail an<input type="email" data-testto value="' + esc(s.notify_email || '') + '" placeholder="deine@adresse.de"></label>' +
        '<button type="button" class="btn small ghost" data-testmail>Test-E-Mail senden</button></div>' +
        '<p class="alert" data-testres hidden></p>' +
        (j.mail.log.length ? '<div class="hint"><b>Letzte Versuche</b><ul style="margin:6px 0 0;padding-left:18px">' + j.mail.log.slice(0, 8).map(function (l) {
          return '<li>' + esc(new Date(l.at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })) + ' · ' + esc(l.what) + ' an ' + esc(l.to) + ': ' +
            (l.ok ? '<b style="color:var(--ok-fg)">angenommen</b>' : '<b style="color:var(--err)">fehlgeschlagen</b> ' + esc(l.error)) + '</li>';
        }).join('') + '</ul></div>' : '<p class="hint">Noch keine Versuche protokolliert.</p>') +
        '</fieldset>';
      var dlg = dialog('Einstellungen', body, '<button type="button" class="btn ghost" data-close2>Abbrechen</button><button type="submit" class="btn primary">Speichern</button>');
      var drawClosed = function () {
        $('[data-closed]', dlg).innerHTML = closed.length ? closed.map(function (c, i) { return '<span>' + esc(shortDate(c)) + c.slice(0, 4) + '<button type="button" aria-label="Entfernen" data-rm="' + i + '">' + ico('close') + '</button></span>'; }).join('') : '<span class="muted" style="background:none;padding:0">Keine</span>';
        $$('[data-rm]', dlg).forEach(function (b) { b.addEventListener('click', function () { closed.splice(+b.dataset.rm, 1); drawClosed(); }); });
      };
      drawClosed();
      $('[data-addbtn]', dlg).addEventListener('click', function () { var v = $('[data-addday]', dlg).value; if (v && closed.indexOf(v) < 0) { closed.push(v); closed.sort(); drawClosed(); } });
      $('[data-close2]', dlg).addEventListener('click', function () { dlg.close(); });
      $$('[data-setpw]', dlg).forEach(function (b) {
        b.addEventListener('click', function () {
          var inp = $('[data-upw="' + b.dataset.setpw + '"]', dlg);
          api('POST', { action: 'user_password', id: b.dataset.setpw, new: inp.value }).then(function (r) { if (r.ok) { inp.value = ''; toast(r.message); } else showErr(dlg, r.message || 'Fehler'); });
        });
      });
      $('[data-testmail]', dlg).addEventListener('click', function (e) {
        var b = e.currentTarget, res = $('[data-testres]', dlg);
        b.disabled = true; b.textContent = 'Wird gesendet …';
        api('POST', { action: 'mail_test', to: $('[data-testto]', dlg).value }).then(function (r) {
          res.textContent = r.message || 'Fehler'; res.className = 'alert ' + (r.ok ? 'ok' : 'err'); res.hidden = false;
          b.disabled = false; b.textContent = 'Test-E-Mail senden';
        });
      });
      var form = $('form', dlg);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var week = {};
        $$('[data-wd]', dlg).forEach(function (c) {
          if (!c.checked) return;
          var i = c.dataset.wd;
          week[i] = { open: $('[data-wdt="' + i + '-open"]', dlg).value, last: $('[data-wdt="' + i + '-last"]', dlg).value, close: $('[data-wdt="' + i + '-close"]', dlg).value };
        });
        var n = { week: week, closed_dates: closed, online_enabled: form.online_enabled.checked };
        ['seats', 'online_seats', 'max_online', 'duration', 'interval', 'cutoff_hours', 'days_ahead'].forEach(function (k) { n[k] = parseInt(form[k].value, 10); });
        n.notify_email = form.notify_email.value;
        api('POST', { action: 'settings', settings: n }).then(function (r) { if (r.ok) { dlg.close(); toast('Einstellungen gespeichert'); load(); } else showErr(dlg, r.message || 'Fehler'); });
      });
    });
  }

  function openPassword() {
    var dlg = dialog('Passwort ändern', '<label>Bisheriges Passwort<input type="password" name="old" required autocomplete="current-password"></label>' +
      '<label>Neues Passwort (mind. 10 Zeichen)<input type="password" name="new" required minlength="10" autocomplete="new-password"></label>',
      '<button type="button" class="btn ghost" data-close2>Abbrechen</button><button type="submit" class="btn primary">Ändern</button>');
    $('[data-close2]', dlg).addEventListener('click', function () { dlg.close(); });
    var form = $('form', dlg);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      api('POST', { action: 'password', old: form.old.value, new: form['new'].value }).then(function (r) { if (r.ok) { dlg.close(); toast('Passwort geändert'); } else showErr(dlg, r.message); });
    });
  }

  /* ── Klicks ─────────────────────────────────────────────── */
  root.addEventListener('click', function (e) {
    var t = e.target.closest('button,[data-day]');
    if (!t) { if (S.menu) { S.menu = false; render(); } return; }
    var act = t.dataset.act;
    if (t.dataset.open) {
      var go = t.dataset.day && t.dataset.day !== S.date ? load(t.dataset.day) : Promise.resolve();
      var oid = parseInt(t.dataset.open, 10);
      go.then(function () { openEdit(oid); });
      return;
    }
    if (t.dataset.here) { api('POST', { action: 'status', id: parseInt(t.dataset.here, 10), status: 'erschienen' }).then(function () { load(); }); return; }
    if (t.dataset.day && !act) { load(t.dataset.day); return; }
    if (act !== 'menu' && S.menu) S.menu = false;
    if (act === 'prev') load(addDays(S.date, -1));
    else if (act === 'next') load(addDays(S.date, 1));
    else if (act === 'pickdate') { var p = $('#pick'); if (p.showPicker) p.showPicker(); else p.focus(); }
    else if (act === 'new') { render(); openEdit(0); }
    else if (act === 'print') { render(); setTimeout(function () { window.print(); }, 50); }
    else if (act === 'menu') { S.menu = !S.menu; render(); }
    else if (act === 'settings') { render(); openSettings(); }
    else if (act === 'password') { render(); openPassword(); }
    else if (act === 'logout') document.getElementById('logout').submit();
    else if (act === 'seenall') api('POST', { action: 'seen', ids: S.data.unseen.map(function (u) { return u.id; }) }).then(function () { load(); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.menu) { S.menu = false; render(); } });

  // Alle 60 Sekunden aktualisieren, solange die App sichtbar ist und kein Dialog offen ist
  setInterval(function () { if (!document.hidden && !document.querySelector('dialog[open]') && !S.menu) load(); }, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !document.querySelector('dialog[open]')) load(); });

  load().catch(function () { root.innerHTML = '<p class="loading">Verbindung fehlgeschlagen. Bitte neu laden.</p>'; });
})();
