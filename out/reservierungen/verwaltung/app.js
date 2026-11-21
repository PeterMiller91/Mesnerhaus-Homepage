/* Reservierungs-App Mesnerhaus – ohne Framework, alle Gästedaten werden escaped. */
(function () {
  'use strict';
  var root = document.getElementById('app');
  var boot = JSON.parse(root.getAttribute('data-boot'));
  var isAdmin = boot.user.role === 'admin';
  var S = { date: boot.day || boot.today, data: null, menu: false, view: 'liste', planTime: null, area: null, assign: null, edit: null, sel: null };
  try { if (localStorage.getItem('mh-view') === 'plan') S.view = 'plan'; } catch { /* egal */ }

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
            (isAdmin ? '<button role="menuitem" data-act="settings">Einstellungen</button><button role="menuitem" data-act="templates">E-Mail-Vorlagen</button>' : '') +
            '<button role="menuitem" data-act="push">Benachrichtigungen</button>' +
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

    html += '<div class="viewswitch" role="tablist" aria-label="Ansicht">' +
      '<button role="tab" data-view="liste" aria-selected="' + (S.view !== 'plan') + '">Liste</button>' +
      '<button role="tab" data-view="plan" aria-selected="' + (S.view === 'plan') + '">Tischplan</button></div>';
    if (S.view === 'plan') { html += planHtml(d); } else {
    html += '<div class="cols"><section class="panel"><h2>Ablauf <span class="count">' + d.items.length + ' Einträge</span></h2>' +
      '<p class="print-title">Reservierungen ' + esc(d.label) + ' · ' + d.stats.guests + ' Gäste</p>';
    if (!d.open) html += '<p class="closed-note">An diesem Tag ist regulär geschlossen. Feiern und Gruppen kannst du trotzdem eintragen.</p>';
    if (!d.items.length) html += '<p class="empty">Noch keine Reservierungen für diesen Tag.</p>';
    html += d.items.map(function (r) {
      var inactive = !(r.status === 'bestaetigt' || r.status === 'erschienen');
      var meta = [SOURCE[r.source] || r.source];
      if (r.table) meta.push(/^tisch/i.test(r.table) ? r.table : 'Tisch ' + r.table);
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
    }
    html += '</main><button class="btn primary fab" data-act="new" aria-label="Reservierung eintragen">' + ico('plus') + 'Eintragen</button>';
    root.innerHTML = html;

    $('#pick').addEventListener('change', function (e) { if (e.target.value) load(e.target.value); });
    if (S.view === 'plan') bindPlan();
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

  function openEdit(id, preset) {
    var r = id ? S.data.items.filter(function (x) { return x.id === id; })[0] : null;
    if (id && !r) return;
    if (r && !r.seen) api('POST', { action: 'seen', ids: [r.id] }).then(function () { r.seen = true; S.data.unseen = S.data.unseen.filter(function (u) { return u.id !== r.id; }); render(); });
    var v = r || Object.assign({ date: S.date, time: (S.data.slots[2] || S.data.slots[0] || '12:00'), persons: 2, name: '', phone: '', email: '', note: '', table: '', tables: [], source: 'telefon', status: 'bestaetigt' }, preset || {});
    var sel = (v.tables || []).slice();
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
      '<div class="grid2"><label>Telefon *<input name="phone" type="tel" maxlength="40" value="' + esc(v.phone) + '" autocomplete="off"></label>' +
      '<label>E-Mail *<input name="email" type="email" maxlength="120" value="' + esc(v.email) + '" autocomplete="off"></label></div>' +
      '<p class="hint" style="margin-top:-6px">* Pflicht bei neuen Reservierungen. Ausnahme: Quelle „Vor Ort“.</p>' +
      '<label>Notiz / Wunsch<textarea name="note" maxlength="300">' + esc(v.note) + '</textarea></label>' +
      '<div class="tblfield"><span class="lbl">Tisch' + (v.table && !(v.tables || []).length ? ' <span class="muted">(bisher: ' + esc(v.table) + ')</span>' : '') + '</span><div class="tblpick" data-tblpick></div></div>' +
      '<div class="grid2"><label>Quelle<select name="source"' + (r && r.source === 'online' ? ' disabled' : '') + '>' + opt(SOURCE, v.source) + '</select></label>' +
      '<label>Status<select name="status">' + opt(STATUS, v.status) + '</select></label></div>' +
      (!r ? '<label class="check"><input type="checkbox" name="send_mail"> Bestätigung per E-Mail an den Gast senden</label>' : '');
    var foot = (r && r.status === 'bestaetigt' && r.email ? '<label class="check" style="font-size:13px;margin-right:8px"><input type="checkbox" data-notify checked> Gast per E-Mail informieren</label>' : '') +
      (r && (r.status === 'bestaetigt') ? '<button type="button" class="btn danger" data-cancel>Stornieren</button>' : '') +
      '<span style="flex:1"></span><button type="button" class="btn ghost" data-close2>Abbrechen</button><button type="submit" class="btn primary">Speichern</button>';
    var dlg = dialog(r ? r.name : 'Reservierung eintragen', body, foot);
    $('[data-close2]', dlg).addEventListener('click', function () { dlg.close(); });
    if ($('[data-cancel]', dlg)) $('[data-cancel]', dlg).addEventListener('click', function (e) {
      var b = e.currentTarget;
      if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Wirklich stornieren?'; return; }
      var notify = !!$('[data-notify]', dlg) && $('[data-notify]', dlg).checked;
      api('POST', { action: 'status', id: r.id, status: 'storniert', notify: notify }).then(function (j) { dlg.close(); toast(j.mailed ? 'Storniert, Gast informiert' : 'Storniert'); load(); });
    });
    var form = $('form', dlg);
    var drawPick = function () {
      var t = form.time.value || v.time, dt = form.date.value || v.date;
      var taken = tablesTaken(dt, t, r ? r.id : 0);
      var plan = S.data.plan;
      $('[data-tblpick]', dlg).innerHTML = plan.areas.map(function (a) {
        var ts = plan.tables.filter(function (x) { return x.area === a.id; });
        if (!ts.length) return '';
        return '<div class="tblarea"><small>' + esc(a.name) + '</small>' + ts.map(function (x) {
          var on = sel.indexOf(x.id) >= 0, busy = taken[x.id];
          return '<button type="button" data-pick="' + esc(x.id) + '" aria-pressed="' + on + '" class="pk' + (on ? ' on' : '') + (busy && !on ? ' busy' : '') + '"' +
            (busy ? ' title="belegt: ' + esc(busy) + '"' : '') + '>' + esc(x.name) + ' <span>' + x.seats + '</span></button>';
        }).join('') + '</div>';
      }).join('') + '<p class="hint" style="margin:4px 0 0">Mehrere Tische antippen für Gruppen. Grau = zu dieser Zeit schon belegt.</p>';
      $$('[data-pick]', dlg).forEach(function (b) {
        b.addEventListener('click', function () {
          var id2 = b.dataset.pick, i = sel.indexOf(id2);
          if (i >= 0) sel.splice(i, 1); else sel.push(id2);
          drawPick();
        });
      });
    };
    drawPick();
    form.time.addEventListener('change', drawPick); form.date.addEventListener('change', drawPick);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(form), data = { action: 'save' };
      f.forEach(function (val, key) { data[key] = val; });
      data.persons = parseInt(data.persons, 10) || 0;
      if (!r && data.source !== 'vor_ort') {
        if (String(data.phone || '').replace(/\D/g, '').length < 6) { showErr(dlg, 'Bitte eine Telefonnummer eintragen.'); form.phone.focus(); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(data.email || '').trim())) { showErr(dlg, 'Bitte eine gültige E-Mail-Adresse eintragen.'); form.email.focus(); return; }
      }
      data.send_mail = !!form.send_mail && form.send_mail.checked;
      data.tables = sel;
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

  /* ── E-Mail-Vorlagen (Admin) ────────────────────────────── */
  function openTemplates() {
    api('GET', null, '?templates').then(function (j) {
      var keys = Object.keys(j.templates), cur = keys[0];
      var data = {};
      keys.forEach(function (k) { data[k] = { subject: j.templates[k].subject, body: j.templates[k].body }; });
      // wie auf dem Server: Zeilen mit leerem Platzhalter entfallen
      var render = function (tpl) {
        var out = [];
        tpl.split('\n').forEach(function (line) {
          var empty = false;
          var r = line.replace(/\{([a-z_]+)\}/g, function (m, k) {
            if (!(k in j.sample)) return m;
            if (j.sample[k] === '') empty = true;
            return j.sample[k];
          });
          if (!empty) out.push(r);
        });
        return out.join('\n').replace(/\n{3,}/g, '\n\n');
      };
      var chips = Object.keys(j.placeholders).map(function (k) {
        return '<button type="button" class="btn small ghost" data-ph="' + esc(k) + '" title="' + esc(j.placeholders[k]) + '">{' + esc(k) + '}</button>';
      }).join('');
      var body =
        '<div class="tabs" role="tablist">' + keys.map(function (k) { return '<button type="button" role="tab" data-tab="' + k + '">' + esc(j.templates[k].label) + '</button>'; }).join('') + '</div>' +
        '<label>Betreff<input name="subject" maxlength="200"></label>' +
        '<label>Text<textarea name="body" rows="12" style="min-height:240px"></textarea></label>' +
        '<div><p class="hint" style="margin-bottom:6px">Platzhalter antippen, um sie an der Cursorposition einzufügen. Eine Zeile, deren Platzhalter leer ist (z. B. kein Wunsch), wird weggelassen.</p><div class="quick" style="margin:0">' + chips + '</div></div>' +
        '<div><p class="hint" style="margin-bottom:6px"><b>Vorschau</b> mit Beispieldaten</p><div class="preview"><div class="pv-subj"></div><pre class="pv-body"></pre></div></div>' +
        '<div class="grid2" style="align-items:end"><label>Test an<input type="email" data-tto placeholder="deine@adresse.de"></label><button type="button" class="btn small ghost" data-tsend>Test senden (gespeicherte Vorlage)</button></div>' +
        '<p class="alert" data-tres hidden></p>';
      var dlg = dialog('E-Mail-Vorlagen', body, '<button type="button" class="btn ghost" data-reset>Standard wiederherstellen</button><span style="flex:1"></span>' +
        '<button type="button" class="btn ghost" data-close2>Schließen</button><button type="submit" class="btn primary">Speichern</button>');
      var form = $('form', dlg), subj = form.subject, txt = form.body, last = txt;
      var preview = function () {
        $('.pv-subj', dlg).textContent = 'Betreff: ' + render(subj.value);
        $('.pv-body', dlg).textContent = render(txt.value);
      };
      var show = function () {
        $$('[data-tab]', dlg).forEach(function (b) {
          b.setAttribute('aria-selected', String(b.dataset.tab === cur));
          b.className = 'tab' + (b.dataset.tab === cur ? ' on' : '');
        });
        subj.value = data[cur].subject; txt.value = data[cur].body; preview();
      };
      subj.addEventListener('input', function () { data[cur].subject = subj.value; preview(); });
      txt.addEventListener('input', function () { data[cur].body = txt.value; preview(); });
      subj.addEventListener('focus', function () { last = subj; });
      txt.addEventListener('focus', function () { last = txt; });
      $$('[data-tab]', dlg).forEach(function (b) { b.addEventListener('click', function () { cur = b.dataset.tab; show(); }); });
      $$('[data-ph]', dlg).forEach(function (b) {
        b.addEventListener('mousedown', function (e) { e.preventDefault(); });
        b.addEventListener('click', function () {
          var el = last, ins = '{' + b.dataset.ph + '}', a = el.selectionStart || 0, z = el.selectionEnd || 0;
          el.value = el.value.slice(0, a) + ins + el.value.slice(z);
          el.focus(); el.selectionStart = el.selectionEnd = a + ins.length;
          el.dispatchEvent(new Event('input'));
        });
      });
      $('[data-reset]', dlg).addEventListener('click', function (e) {
        var b = e.currentTarget;
        if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Wirklich? Nochmal tippen'; return; }
        data[cur] = { subject: j.defaults[cur].subject, body: j.defaults[cur].body }; show();
        b.dataset.sure = ''; b.textContent = 'Standard wiederherstellen';
      });
      $('[data-close2]', dlg).addEventListener('click', function () { dlg.close(); });
      $('[data-tsend]', dlg).addEventListener('click', function () {
        var res = $('[data-tres]', dlg);
        api('POST', { action: 'template_test', key: cur, to: $('[data-tto]', dlg).value }).then(function (r) {
          res.textContent = r.message || 'Fehler'; res.className = 'alert ' + (r.ok ? 'ok' : 'err'); res.hidden = false;
        });
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (data.confirm && data.confirm.body.indexOf('{storno_link}') < 0 && !form.dataset.warned) {
          form.dataset.warned = '1';
          showErr(dlg, 'Hinweis: In der Bestätigung fehlt {storno_link}. Gäste können dann nicht selbst stornieren. Nochmal „Speichern“ zum Bestätigen.');
          return;
        }
        api('POST', { action: 'templates', templates: data }).then(function (r) {
          if (r.ok) { toast('Vorlagen gespeichert'); dlg.close(); } else showErr(dlg, r.message || 'Fehler');
        });
      });
      show();
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

  /* ── Tischplan ──────────────────────────────────────────── */
  function minutes(t) { var p = String(t).split(':'); return (+p[0]) * 60 + (+p[1]); }
  function isActive(r) { return r.status === 'bestaetigt' || r.status === 'erschienen'; }
  function overlaps(r, t, dur) { var a = minutes(r.time), m = minutes(t); return m >= a && m < a + dur; }
  // Welche Tische sind zu dieser Zeit (für die Dauer einer neuen Reservierung) belegt? → { id: Name }
  function tablesTaken(date, time, exceptId) {
    var out = {}, dur = S.data.duration, a = minutes(time);
    if (date !== S.data.date) return out;
    S.data.items.forEach(function (r) {
      if (!isActive(r) || r.id === exceptId) return;
      var b = minutes(r.time);
      if (b >= a + dur || b + dur <= a) return;
      (r.tables || []).forEach(function (id) { out[id] = r.name; });
    });
    return out;
  }
  function planTimes(d) { return d.slots.length ? d.slots : d.load.map(function (l) { return l.time; }); }
  function defaultTime(d) {
    var times = planTimes(d);
    if (!times.length) return '12:00';
    if (d.date === boot.today) {
      var now = new Date(), m = now.getHours() * 60 + now.getMinutes(), best = times[0];
      times.forEach(function (t) { if (minutes(t) <= m) best = t; });
      return best;
    }
    var busy = d.load.slice().sort(function (x, y) { return y.guests - x.guests; })[0];
    return busy && busy.guests ? busy.time : times[0];
  }

  function planHtml(d) {
    var plan = S.edit || d.plan, editing = !!S.edit;
    if (!S.area || !plan.areas.some(function (a) { return a.id === S.area; })) {
      var withTables = plan.areas.filter(function (a) { return plan.tables.some(function (t) { return t.area === a.id; }); })[0];
      S.area = (withTables || plan.areas[0]).id;
    }
    var times = planTimes(d);
    if (!S.planTime || times.indexOf(S.planTime) < 0) S.planTime = defaultTime(d);
    var T = S.planTime, dur = d.duration;
    var occ = {}, clash = {};
    d.items.forEach(function (r) {
      if (!isActive(r) || !overlaps(r, T, dur)) return;
      (r.tables || []).forEach(function (id) { if (occ[id]) clash[id] = true; else occ[id] = r; });
    });
    var assigning = S.assign ? d.items.filter(function (r) { return r.id === S.assign; })[0] : null;
    var unassigned = d.items.filter(function (r) { return isActive(r) && !(r.tables || []).length; });

    var h = '<section class="panel plan-panel">';
    h += '<div class="plan-head"><h2>Tischplan</h2>';
    if (plan.areas.length > 1) h += '<div class="seg">' + plan.areas.map(function (a) {
      return '<button data-area="' + esc(a.id) + '" aria-pressed="' + (a.id === S.area) + '">' + esc(a.name) + '</button>';
    }).join('') + '</div>';
    h += '<span style="flex:1"></span>';
    if (editing) {
      h += '<button class="btn small ghost" data-act="addtable">' + ico('plus') + 'Tisch</button>' +
        '<button class="btn small ghost" data-act="cancelplan">Abbrechen</button><button class="btn small primary" data-act="saveplan">Plan speichern</button>';
    } else {
      h += '<button class="btn small ghost" data-act="autoassign">Automatisch zuweisen</button>' +
        (isAdmin ? '<button class="btn small ghost" data-act="editplan">' + ico('edit') + 'Bearbeiten</button>' : '');
    }
    h += '</div>';

    if (plan.example && !editing) h += '<p class="closed-note">Das ist ein <b>Beispiel-Tischplan</b>. ' + (isAdmin ? 'Unter „Bearbeiten“ passt du ihn an eure Gaststube an.' : 'Die Inhaberin kann ihn an die Gaststube anpassen.') + '</p>';

    if (!editing) {
      h += '<div class="times" role="group" aria-label="Uhrzeit">' + times.map(function (t) {
        return '<button data-ptime="' + esc(t) + '" aria-pressed="' + (t === T) + '">' + esc(t) + '</button>';
      }).join('') + '</div>';
      if (assigning) {
        h += '<div class="assignbar" role="status"><span>Tische für <b>' + esc(assigning.name) + '</b> (' + assigning.persons + ' P., ' + esc(assigning.time) + ' Uhr) antippen' +
          ((assigning.tables || []).length ? ' · gewählt: ' + esc(assigning.table) : '') + '</span><button class="btn small primary" data-act="assigndone">Fertig</button></div>';
      }
    } else {
      var seatsArea = plan.tables.filter(function (t) { return t.area === S.area; }).reduce(function (n, t) { return n + (+t.seats); }, 0);
      var seatsAll = plan.tables.reduce(function (n, t) { return n + (+t.seats); }, 0);
      h += '<p class="hint">Tische ziehen zum Verschieben, antippen zum Bearbeiten. Plätze hier: <b>' + seatsArea + '</b>, gesamt: <b>' + seatsAll + '</b>' +
        (seatsAll !== d.seats ? ' <span style="color:var(--warn)">(Einstellungen: ' + d.seats + ' Plätze)</span>' : '') + '</p>';
    }

    h += '<div class="plan-layout' + (editing && S.sel ? ' with-side' : '') + '"><div class="plan-wrap"><div class="plan' + (editing ? ' editing' : '') + (assigning ? ' assigning' : '') + '" data-plan>';
    plan.tables.filter(function (t) { return t.area === S.area; }).forEach(function (t) {
      var r = occ[t.id], cls = 'tbl ' + (t.shape === 'round' ? 'round' : 'rect');
      var mine = assigning && (assigning.tables || []).indexOf(t.id) >= 0;
      if (editing) cls += S.sel === t.id ? ' sel' : '';
      else if (mine) cls += ' mine';
      else if (r) cls += r.status === 'erschienen' ? ' here' : ' busy';
      if (!editing && clash[t.id]) cls += ' clash';
      var style = 'left:' + t.x + '%;top:' + (t.y / 60 * 100) + '%;width:' + t.w + '%;height:' + (t.h / 60 * 100) + '%';
      var inner = '<b>' + esc(t.name) + '</b>' + (r && !editing && !mine ? '<span class="g">' + esc(r.name) + '</span><span class="s">' + r.persons + ' P. · ' + esc(r.time) + '</span>' : '<span class="s">' + t.seats + ' Pl.</span>');
      var label = 'Tisch ' + t.name + ', ' + t.seats + ' Plätze' + (r ? ', belegt von ' + r.name + ' ab ' + r.time : ', frei');
      h += editing
        ? '<div class="' + cls + '" style="' + style + '" data-etbl="' + esc(t.id) + '" role="button" tabindex="0" aria-label="' + esc(label) + '">' + inner + '</div>'
        : '<button class="' + cls + '" style="' + style + '" data-tbl="' + esc(t.id) + '" aria-label="' + esc(label) + '">' + inner + '</button>';
    });
    h += '</div></div>';

    if (editing && S.sel) {
      var st = plan.tables.filter(function (t) { return t.id === S.sel; })[0];
      if (st) {
        h += '<aside class="plan-side form"><h3>Tisch ' + esc(st.name) + '</h3>' +
          '<div class="grid2"><label>Nummer/Name<input data-tf="name" maxlength="12" value="' + esc(st.name) + '"></label>' +
          '<label>Plätze<input data-tf="seats" type="number" min="1" max="40" value="' + st.seats + '"></label></div>' +
          '<div class="grid2"><label>Form<select data-tf="shape"><option value="rect"' + (st.shape !== 'round' ? ' selected' : '') + '>eckig</option><option value="round"' + (st.shape === 'round' ? ' selected' : '') + '>rund</option></select></label>' +
          '<label>Bereich<select data-tf="area">' + plan.areas.map(function (a) { return '<option value="' + esc(a.id) + '"' + (a.id === st.area ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('') + '</select></label></div>' +
          '<div class="grid2"><label>Breite<input data-tf="w" type="number" min="4" max="60" value="' + st.w + '"></label>' +
          '<label>Höhe<input data-tf="h" type="number" min="4" max="40" value="' + st.h + '"></label></div>' +
          '<button class="btn small danger" data-act="deltable">Tisch löschen</button></aside>';
      }
    }
    h += '</div>';

    if (!editing) {
      h += '<div class="plan-foot"><div class="legend"><span><i class="lg free"></i>frei</span><span><i class="lg busy"></i>reserviert</span><span><i class="lg here"></i>Gäste da</span><span><i class="lg clash"></i>doppelt belegt</span></div>';
      if (unassigned.length) {
        h += '<div class="unassigned"><b>Ohne Tisch (' + unassigned.length + '):</b> ' + unassigned.map(function (r) {
          return '<button class="ua' + (overlaps(r, T, dur) ? ' now' : '') + (S.assign === r.id ? ' on' : '') + '" data-assign="' + r.id + '">' + esc(r.time) + ' ' + esc(r.name) + ' · ' + r.persons + ' P.</button>';
        }).join('') + '<p class="hint" style="margin:6px 0 0">Antippen, dann die passenden Tische im Plan wählen.</p></div>';
      } else if (d.items.some(isActive)) h += '<p class="hint">Alle Reservierungen dieses Tages haben einen Tisch.</p>';
      h += '</div>';
    }
    return h + '</section>';
  }

  function bindPlan() {
    if (!S.edit) return;
    var box = $('[data-plan]');
    if (!box) return;
    $$('[data-etbl]', box).forEach(function (el) {
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        var t = S.edit.tables.filter(function (x) { return x.id === el.dataset.etbl; })[0];
        var rect = box.getBoundingClientRect(), sx = e.clientX, sy = e.clientY, ox = t.x, oy = t.y, moved = false;
        el.setPointerCapture(e.pointerId);
        var move = function (ev) {
          var dx = Math.round((ev.clientX - sx) / rect.width * 100), dy = Math.round((ev.clientY - sy) / rect.height * 60);
          if (dx || dy) moved = true;
          t.x = Math.max(0, Math.min(100 - t.w, ox + dx)); t.y = Math.max(0, Math.min(60 - t.h, oy + dy));
          el.style.left = t.x + '%'; el.style.top = (t.y / 60 * 100) + '%';
        };
        var up = function () {
          el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
          if (!moved || S.sel !== t.id) { S.sel = t.id; render(); }
        };
        el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); S.sel = el.dataset.etbl; render(); } });
    });
    $$('[data-tf]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var t = S.edit.tables.filter(function (x) { return x.id === S.sel; })[0], k = inp.dataset.tf;
        if (!t) return;
        if (k === 'seats' || k === 'w' || k === 'h') t[k] = Math.max(1, parseInt(inp.value, 10) || 1); else t[k] = inp.value;
        t.w = Math.min(60, Math.max(4, t.w)); t.h = Math.min(40, Math.max(4, t.h));
        t.x = Math.min(t.x, 100 - t.w); t.y = Math.min(t.y, 60 - t.h);
        if (k === 'area') S.area = t.area;
        render();
      });
    });
  }

  function openTableDialog(tid) {
    var d = S.data, t = d.plan.tables.filter(function (x) { return x.id === tid; })[0];
    if (!t) return;
    var taken = tablesTaken(d.date, S.planTime, 0);
    var cand = d.items.filter(function (r) { return isActive(r) && !(r.tables || []).length; });
    var body = '<p class="hint">' + t.seats + ' Plätze · ' + esc(S.planTime) + ' Uhr</p>' +
      (cand.length ? '<p style="margin:8px 0 6px;font-weight:700">Reservierung zuweisen</p><div class="cand">' + cand.map(function (r) {
        return '<button type="button" class="btn small ghost" data-cand="' + r.id + '">' + esc(r.time) + ' · ' + esc(r.name) + ' · ' + r.persons + ' P.</button>';
      }).join('') + '</div>' : '<p class="hint">Alle Reservierungen dieses Tages haben schon einen Tisch.</p>') +
      (taken[tid] ? '<p class="alert err">Zu dieser Zeit (für die nächsten ' + d.duration + ' Min.) teilweise belegt von ' + esc(taken[tid]) + '.</p>' : '');
    var dlg = dialog('Tisch ' + t.name, body, '<button type="button" class="btn ghost" data-close2>Schließen</button><button type="button" class="btn primary" data-newhere>' + ico('plus') + 'Neue Reservierung hier</button>');
    $('[data-close2]', dlg).addEventListener('click', function () { dlg.close(); });
    $('[data-newhere]', dlg).addEventListener('click', function () { dlg.close(); openEdit(0, { time: S.planTime, tables: [tid] }); });
    $$('[data-cand]', dlg).forEach(function (b) {
      b.addEventListener('click', function () {
        var r = d.items.filter(function (x) { return x.id === +b.dataset.cand; })[0];
        api('POST', { action: 'assign', id: r.id, tables: [tid] }).then(function (j) {
          if (!j.ok) { showErr(dlg, j.message || 'Zuweisen fehlgeschlagen.'); return; }
          dlg.close(); toast('Tisch ' + t.name + ': ' + r.name); load();
        });
      });
    });
  }

  function toggleAssign(tid) {
    var r = S.data.items.filter(function (x) { return x.id === S.assign; })[0];
    if (!r) { S.assign = null; render(); return; }
    var tables = (r.tables || []).slice(), i = tables.indexOf(tid);
    if (i >= 0) tables.splice(i, 1); else tables.push(tid);
    api('POST', { action: 'assign', id: r.id, tables: tables }).then(function (j) {
      if (!j.ok) { toast(j.message || 'Geht nicht'); return; }
      load();
    });
  }

  function planClick(t, act) {
    if (t.dataset.view) {
      S.view = t.dataset.view; S.assign = null;
      try { localStorage.setItem('mh-view', S.view); } catch { /* egal */ }
      render(); return true;
    }
    if (t.dataset.ptime) { S.planTime = t.dataset.ptime; render(); return true; }
    if (t.dataset.area) { S.area = t.dataset.area; S.sel = null; render(); return true; }
    if (t.dataset.assign) { var a = +t.dataset.assign; S.assign = S.assign === a ? null : a; render(); return true; }
    if (t.dataset.tbl) {
      var tid = t.dataset.tbl;
      if (S.assign) { toggleAssign(tid); return true; }
      var r = S.data.items.filter(function (x) { return isActive(x) && overlaps(x, S.planTime, S.data.duration) && (x.tables || []).indexOf(tid) >= 0; })[0];
      if (r) openEdit(r.id); else openTableDialog(tid);
      return true;
    }
    if (act === 'assigndone') { S.assign = null; render(); return true; }
    if (act === 'autoassign') {
      api('POST', { action: 'auto_assign', date: S.date }).then(function (j) { toast(j.message || 'Fertig'); load(); });
      return true;
    }
    if (act === 'editplan') { S.edit = JSON.parse(JSON.stringify(S.data.plan)); S.sel = null; S.assign = null; render(); return true; }
    if (act === 'cancelplan') { S.edit = null; S.sel = null; render(); return true; }
    if (act === 'addtable') {
      var n = 1, ids = S.edit.tables.map(function (x) { return x.id; });
      while (ids.indexOf('t' + n) >= 0) n++;
      var nums = S.edit.tables.map(function (x) { return parseInt(x.name, 10) || 0; });
      var name = String(Math.max.apply(null, nums.concat([0])) + 1);
      S.edit.tables.push({ id: 't' + n, name: name, seats: 4, area: S.area, x: 2, y: 2, w: 12, h: 10, shape: 'rect' });
      S.sel = 't' + n; render(); return true;
    }
    if (act === 'deltable') {
      if (!t.dataset.sure) { t.dataset.sure = '1'; t.textContent = 'Wirklich löschen?'; return true; }
      S.edit.tables = S.edit.tables.filter(function (x) { return x.id !== S.sel; }); S.sel = null; render(); return true;
    }
    if (act === 'saveplan') {
      api('POST', { action: 'plan_save', plan: S.edit }).then(function (j) {
        if (!j.ok) { toast(j.message || 'Speichern fehlgeschlagen'); return; }
        S.edit = null; S.sel = null; toast('Tischplan gespeichert'); load();
      });
      return true;
    }
    return false;
  }

  /* ── Push-Benachrichtigungen ───────────────────────────── */
  var SW = null;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js', { scope: './' }).then(function (reg) { SW = reg; }).catch(function () { /* egal */ });
  }
  function b64uToBytes(s) {
    var pad = '='.repeat((4 - s.length % 4) % 4), b = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
    var out = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) out[i] = b.charCodeAt(i); return out;
  }
  function sha256hex(str) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }
  function deviceLabel() {
    var ua = navigator.userAgent;
    var dev = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android-Handy' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows-PC' : 'Gerät';
    var br = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '';
    return dev + (br ? ' · ' + br : '');
  }
  function isIOS() { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  function isStandalone() { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }

  function openPush() {
    var supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    Promise.all([
      api('GET', null, '?push'),
      supported && SW ? SW.pushManager.getSubscription() : Promise.resolve(null)
    ]).then(function (res) {
      var j = res[0], sub = res[1];
      return (sub ? sha256hex(sub.endpoint) : Promise.resolve('')).then(function (myHash) { show(j, sub, myHash); });
    });

    function show(j, sub, myHash) {
      var here = j.devices.filter(function (d) { return d.endpoint_hash === myHash; })[0];
      var intro = '<p class="hint">Bei jeder <b>neuen Online-Reservierung</b> (und auf Wunsch bei Stornos) klingelt das Handy, auch wenn die App geschlossen ist.</p>';
      var state = '';
      if (!j.available) state = '<p class="alert err">Auf dem Server fehlt die Verschlüsselung (OpenSSL). Bitte melden.</p>';
      else if (isIOS() && !isStandalone()) {
        state = '<div class="alert err"><b>Auf dem iPhone zuerst zum Home-Bildschirm hinzufügen:</b><br>' +
          '1. In Safari unten auf <b>Teilen</b> tippen (Quadrat mit Pfeil).<br>2. <b>„Zum Home-Bildschirm“</b> wählen.<br>' +
          '3. Die App über das neue Symbol öffnen, anmelden und hier „Aktivieren“ tippen.<br><small>Benötigt iOS 16.4 oder neuer.</small></div>';
      } else if (!supported) state = '<p class="alert err">Dieser Browser kann keine Push-Benachrichtigungen. Bitte Chrome (Android) oder die Verknüpfung auf dem iPhone-Home-Bildschirm nutzen.</p>';
      else if (Notification.permission === 'denied') state = '<p class="alert err">Benachrichtigungen sind für diese Seite blockiert. Bitte in den Handy-Einstellungen für diese App bzw. Seite erlauben, dann hier erneut öffnen.</p>';
      else if (here) state = '<p class="alert ok"><b>Dieses Gerät ist aktiviert</b> (' + esc(here.label) + ').</p>';
      else state = '<p class="hint"><b>Dieses Gerät</b> ist noch nicht aktiviert.</p>';

      var prefs = here ? here.prefs : { neu: true, storno: true };
      var prefHtml = '<fieldset><legend>Benachrichtigen bei</legend>' +
        '<label class="check"><input type="checkbox" data-pref="neu"' + (prefs.neu ? ' checked' : '') + '> neuer Online-Reservierung</label>' +
        '<label class="check"><input type="checkbox" data-pref="storno"' + (prefs.storno ? ' checked' : '') + '> Storno durch den Gast</label></fieldset>';
      var list = j.devices.length ? '<fieldset><legend>Deine Geräte</legend>' + j.devices.map(function (d) {
        return '<div class="grid2" style="align-items:center"><span>' + esc(d.label) + (d.endpoint_hash === myHash ? ' <b>(dieses)</b>' : '') +
          '<br><small class="muted">seit ' + esc(new Date(d.created).toLocaleDateString('de-DE')) + (d.last_error ? ' · letzter Versand fehlgeschlagen' : '') + '</small></span>' +
          '<button type="button" class="btn small danger" data-rm="' + esc(d.endpoint_hash) + '">Entfernen</button></div>';
      }).join('') + '</fieldset>' : '';

      var canAct = j.available && supported && !(isIOS() && !isStandalone()) && Notification.permission !== 'denied';
      var foot = (here ? '<button type="button" class="btn ghost" data-test>Test senden</button>' : '') + '<span style="flex:1"></span>' +
        '<button type="button" class="btn ghost" data-close2>Schließen</button>' +
        (canAct ? (here ? '<button type="button" class="btn primary" data-saveprefs>Speichern</button>' : '<button type="button" class="btn primary" data-on>Auf diesem Gerät aktivieren</button>') : '');
      var dlg = dialog('Benachrichtigungen', intro + state + prefHtml + list + '<p class="alert" data-res hidden></p>', foot);
      var res = $('[data-res]', dlg);
      var say = function (t, ok) { res.textContent = t; res.className = 'alert ' + (ok ? 'ok' : 'err'); res.hidden = false; };
      var readPrefs = function () { return { neu: $('[data-pref=neu]', dlg).checked, storno: $('[data-pref=storno]', dlg).checked }; };
      $('[data-close2]', dlg).addEventListener('click', function () { dlg.close(); });

      if ($('[data-on]', dlg)) $('[data-on]', dlg).addEventListener('click', function (e) {
        var b = e.currentTarget; b.disabled = true; b.textContent = 'Wird aktiviert …';
        Notification.requestPermission().then(function (perm) {
          if (perm !== 'granted') throw new Error('Ohne Erlaubnis kann das Handy keine Benachrichtigungen zeigen.');
          return (SW ? Promise.resolve(SW) : navigator.serviceWorker.register('sw.js', { scope: './' })).then(function (reg) {
            SW = reg;
            return navigator.serviceWorker.ready.then(function () {
              return reg.pushManager.getSubscription().then(function (old) {
                return old || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(j.public_key) });
              });
            });
          });
        }).then(function (s2) {
          return api('POST', { action: 'push_subscribe', endpoint: s2.endpoint, label: deviceLabel(), prefs: readPrefs() });
        }).then(function (r) {
          if (!r.ok) throw new Error(r.message || 'Speichern fehlgeschlagen.');
          return api('POST', { action: 'push_test' });
        }).then(function (r) {
          dlg.close(); toast('Aktiviert. ' + (r.ok ? 'Eine Test-Benachrichtigung ist unterwegs.' : ''));
        }).catch(function (err) {
          b.disabled = false; b.textContent = 'Auf diesem Gerät aktivieren';
          say((err && err.message) || 'Aktivieren hat nicht geklappt.', false);
        });
      });
      if ($('[data-saveprefs]', dlg)) $('[data-saveprefs]', dlg).addEventListener('click', function () {
        api('POST', { action: 'push_prefs', endpoint_hash: myHash, prefs: readPrefs() }).then(function (r) { if (r.ok) { dlg.close(); toast('Gespeichert'); } else say('Speichern fehlgeschlagen.', false); });
      });
      if ($('[data-test]', dlg)) $('[data-test]', dlg).addEventListener('click', function () {
        api('POST', { action: 'push_test' }).then(function (r) { say(r.message, r.ok); });
      });
      $$('[data-rm]', dlg).forEach(function (b) {
        b.addEventListener('click', function () {
          var h = b.dataset.rm;
          var after = function () { dlg.close(); toast('Gerät entfernt'); };
          api('POST', { action: 'push_remove', endpoint_hash: h }).then(function () {
            if (h === myHash && sub) sub.unsubscribe().then(after, after); else after();
          });
        });
      });
    }
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
    if (planClick(t, act)) return;
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
    else if (act === 'templates') { render(); openTemplates(); }
    else if (act === 'password') { render(); openPassword(); }
    else if (act === 'push') { render(); openPush(); }
    else if (act === 'logout') document.getElementById('logout').submit();
    else if (act === 'seenall') api('POST', { action: 'seen', ids: S.data.unseen.map(function (u) { return u.id; }) }).then(function () { load(); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.menu) { S.menu = false; render(); } });

  // Alle 60 Sekunden aktualisieren, solange die App sichtbar ist und kein Dialog offen ist
  setInterval(function () { if (!document.hidden && !document.querySelector('dialog[open]') && !S.menu && !S.edit) load(); }, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !document.querySelector('dialog[open]') && !S.edit) load(); });

  load().catch(function () { root.innerHTML = '<p class="loading">Verbindung fehlgeschlagen. Bitte neu laden.</p>'; });
})();
