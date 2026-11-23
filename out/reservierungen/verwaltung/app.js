/* Reservierungs-App Mesnerhaus – ohne Framework, alle Gästedaten werden escaped. */
(function () {
  'use strict';
  var root = document.getElementById('app');
  var boot = JSON.parse(root.getAttribute('data-boot'));
  var isAdmin = boot.user.role === 'admin';
  var S = { date: boot.day || boot.today, data: null, menu: false, view: 'liste', planTime: null, area: null, assign: null, edit: null, sel: null, filter: 'alle', scope: 'kommend', q: '', list: null, pickMode: false, picked: {} };
  try { var sv = localStorage.getItem('mh-view'); if (sv === 'plan' || sv === 'alle' || (sv === 'web' && isAdmin)) S.view = sv; } catch { /* egal */ }

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
    msg: '<path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.4A8.5 8.5 0 1 1 21 12z"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    down: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>'
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
  // Schreib-Aktionen bekommen die frischen Tagesdaten gleich mit (keine zweite Anfrage nötig)
  var WITH_DAY = { save: 1, status: 1, assign: 1, auto_assign: 1, seen: 1, 'delete': 1, plan_save: 1, settings: 1 };
  function api(method, body, query) {
    if (body && WITH_DAY[body.action] && !body._day) body._day = S.date;
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
    return api('GET', null, '?day=' + encodeURIComponent(S.date)).then(function (j) { S.data = j; render(); if (S.view === 'alle') loadList(); kick(j); });
  }

  // E-Mails/Push aus der Warteschlange verschicken lassen (Hintergrund, niemand wartet darauf)
  function kick(j) {
    if (!j || !j.queue) return;
    try { if (!(navigator.sendBeacon && navigator.sendBeacon('/api/queue.php'))) fetch('/api/queue.php', { method: 'POST', keepalive: true }); } catch { /* egal */ }
  }
  // Antwort einer Schreib-Aktion übernehmen: Tagesdaten liegen meist schon bei
  function after(j, date) {
    kick(j);
    if (j && j.day) {
      S.data = j.day; S.date = j.day.date; render();
      if (S.view === 'alle') loadList();
      return Promise.resolve();
    }
    return load(date);
  }

  /* ── Darstellung ────────────────────────────────────────── */
  var MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  function longDate(d) { var x = new Date(d + 'T12:00:00'); return WD[x.getDay()] + ', ' + x.getDate() + '. ' + MONTHS[x.getMonth()]; }
  function hourOnly(t) { return String(t || '').replace(/:00$/, '').replace(/^0/, ''); }
  function initial(n) { var m = String(n || '').trim().replace(/^(familie|fam\.)\s+/i, ''); return (m.charAt(0) || '?').toUpperCase(); }
  function tableText(r) { return r.table ? (/^tisch/i.test(r.table) ? r.table : 'Tisch ' + r.table) : ''; }
  function hasTable(r) { return (r.tables || []).length > 0 || !!r.table; }
  function nowMin() { var n = new Date(); return n.getHours() * 60 + n.getMinutes(); }
  function filterOf(r, f) {
    if (f === 'erwartet') return r.status === 'bestaetigt';
    if (f === 'da') return r.status === 'erschienen';
    if (f === 'ohne') return isActive(r) && !hasTable(r);
    return true;
  }

  function headerHtml(d) {
    var isToday = d.date === boot.today;
    var eyebrow = (isToday ? 'Heute' : (d.date === addDays(boot.today, 1) ? 'Morgen' : WD[new Date(d.date + 'T12:00:00').getDay()])) + ' · ' +
      (d.open ? 'geöffnet ' + hourOnly(d.open.open) + '–' + hourOnly(d.open.close) + ' Uhr' : 'regulär geschlossen');
    var pct = d.seats ? Math.min(100, Math.round(d.stats.peak / d.seats * 100)) : 0;
    var h = '<header class="top"><div class="top-inner">';
    h += '<div class="top-row"><div class="brand"><span class="logo" aria-hidden="true"></span><span class="brand-name">Mesnerhaus</span></div>' +
      '<nav class="seg-nav" aria-label="Ansicht">' +
        '<button data-view="liste" aria-pressed="' + (S.view === 'liste') + '">Übersicht</button>' +
        '<button data-view="plan" aria-pressed="' + (S.view === 'plan') + '">Tischplan</button>' +
        '<button data-view="alle" aria-pressed="' + (S.view === 'alle') + '">Liste</button>' +
        (isAdmin ? '<button data-view="web" aria-pressed="' + (S.view === 'web') + '">Website</button>' : '') + '</nav>' +
      '<span class="grow"></span>' +
      '<button class="btn new-btn" data-act="new">' + ico('plus') + 'Reservierung</button>' +
      '<button class="avatar" data-act="menu" aria-label="Menü" aria-expanded="' + S.menu + '">' + esc(initial(boot.user.name)) + '</button></div>';
    h += '<div class="hero"><div class="hero-text"><div class="eyebrow">' + esc(eyebrow) + '</div>' +
      '<div class="hero-date"><button class="hd-arrow" data-act="prev" aria-label="Vorheriger Tag">' + ico('left') + '</button>' +
      '<h1>' + esc(longDate(d.date)) + '</h1>' +
      '<button class="hd-arrow" data-act="next" aria-label="Nächster Tag">' + ico('right') + '</button></div>' +
      (d.online_enabled ? '' : '<span class="paused">Online-Buchung pausiert</span>') + '</div>' +
      '<div class="ring m-only" style="--p:' + pct + ';--c:' + (pct >= 85 ? '#E39A55' : '#A8CC5A') + '"><div><b>' + pct + '%</b><span>Spitze</span></div></div>' +
      '<div class="tabs-strip" role="group" aria-label="Nächste Öffnungstage">' + d.next.map(function (n) {
        var x = new Date(n.date + 'T12:00:00');
        return '<button class="daytab' + (n.date === d.date ? ' on' : '') + '" data-day="' + esc(n.date) + '" aria-pressed="' + (n.date === d.date) + '"' +
          ' title="' + esc(n.count ? n.count + ' Reservierungen, ' + n.guests + ' Gäste' : (n.open ? 'noch frei' : 'geschlossen')) + '">' +
          '<small>' + WD[x.getDay()].slice(0, 2) + '</small><b>' + x.getDate() + '.' + (x.getMonth() + 1) + '.</b>' +
          '<i class="fillbar"><i style="width:' + (n.pct || 0) + '%"' + ((n.pct || 0) >= 85 ? ' class="hi"' : '') + '></i></i></button>';
      }).join('') +
      '<button class="daytab cal" data-act="month" title="Monatsübersicht"><span class="sr">Monatsübersicht</span>' + ico('cal') + '<small class="cal-l">Monat</small></button></div>';
    h += '<div class="m-stats m-only">' +
      '<div><small>Gäste</small><b>' + d.stats.guests + '</b></div>' +
      '<div><small>Reserv.</small><b>' + d.stats.count + '</b></div>' +
      '<button class="' + (d.unseen.length ? 'neu' : '') + '" data-act="unseen"><small>Neu</small><b>' + d.unseen.length + '</b></button></div>';
    h += '</div></div></header>';
    return h;
  }

  function menuHtml() {
    if (!S.menu) return '';
    return '<div class="menu-list" role="menu"><div class="who">Angemeldet als <b>' + esc(boot.user.name) + '</b></div>' +
      (isAdmin ? '<button role="menuitem" data-view="web">Website (Banner, Karten, Galerie)</button><button role="menuitem" data-act="settings">Einstellungen</button><button role="menuitem" data-act="users">Benutzer</button><button role="menuitem" data-act="templates">E-Mail-Vorlagen</button>' : '') +
      '<button role="menuitem" data-act="push">Benachrichtigungen</button>' +
      '<button role="menuitem" data-act="print">Tagesliste drucken</button>' +
      '<button role="menuitem" data-act="password">Passwort ändern</button>' +
      '<button role="menuitem" data-act="logout">Abmelden</button></div>';
  }

  function kpiHtml(d) {
    var pct = d.seats ? Math.min(100, Math.round(d.stats.peak / d.seats * 100)) : 0;
    var diff = d.stats.guests - (d.stats.prev_guests || 0);
    var wd = WD[new Date(d.date + 'T12:00:00').getDay()];
    var cmp = d.stats.prev_known ? '<small class="' + (diff > 0 ? 'up' : diff < 0 ? 'down' : '') + '">' + (diff > 0 ? '+' + diff : diff < 0 ? '−' + (-diff) : '±0') + ' gegenüber letztem ' + wd + '</small>' : '';
    return '<section class="kpis" aria-label="Kennzahlen">' +
      '<div class="kpi ringkpi"><div class="ring" style="--p:' + pct + ';--c:' + (pct >= 85 ? '#C46A1E' : '#8DB43A') + '"><div><b>' + pct + '%</b></div></div>' +
        '<div><small>Auslastung zur Spitze</small><p>' + (d.stats.peak ? '<b>' + d.stats.peak + ' von ' + d.seats + '</b> Plätzen um ' + esc(d.stats.peak_time) : 'Noch keine Gäste eingetragen') + '</p></div></div>' +
      '<div class="kpi"><small>Gäste</small><b>' + d.stats.guests + '</b>' + cmp + '</div>' +
      '<div class="kpi"><small>Reservierungen</small><b>' + d.stats.count + '</b><small class="plain">davon ' + d.stats.online + ' online</small></div>' +
      '<button class="kpi neu' + (d.unseen.length ? '' : ' none') + '" data-act="unseen"><small>Neu eingegangen</small><b>' + d.unseen.length + '</b><small>' + (d.unseen.length ? 'ansehen →' : 'alles gesehen') + '</small></button>' +
      '</section>';
  }

  function cardHtml(r) {
    var inactive = !isActive(r), here = r.status === 'erschienen', neu = !r.seen && !inactive, noTbl = isActive(r) && !hasTable(r);
    var meta = [r.persons + (r.persons === 1 ? ' Person' : ' Personen')];
    meta.push(noTbl ? '<em>noch kein Tisch</em>' : esc(tableText(r)));
    if (r.note) meta.push(esc(r.note));
    meta.push(esc(SOURCE[r.source] || r.source));
    var cls = 'card' + (here ? ' here' : '') + (neu ? ' neu' : '') + (noTbl && !here ? ' notbl' : '') + (inactive ? ' inactive' : '');
    var acts = '';
    if (r.status === 'bestaetigt') {
      if (noTbl) acts += '<button class="pill-btn warn" data-pickt="' + r.id + '">Tisch wählen</button>';
      acts += '<button class="pill-btn" data-here="' + r.id + '" aria-label="' + esc(r.name) + ' ist da">' + ico('check') + '<span>Da</span></button>';
    } else if (!here) acts = '<span class="chip ' + esc(r.status) + '">' + esc(STATUS[r.status] || r.status) + '</span>';
    return '<div class="' + cls + '">' +
      '<span class="av" aria-hidden="true">' + esc(initial(r.name)) + '</span>' +
      '<button class="info" data-open="' + r.id + '"><b>' + esc(r.name) + (neu ? ' <span class="badge-neu">NEU</span>' : '') + (here ? ' <span class="badge-here">ist da</span>' : '') + '</b>' +
        '<span>' + meta.filter(Boolean).join(' · ') + '</span></button>' +
      '<span class="pers">' + r.persons + ' P.</span>' +
      (acts ? '<div class="acts">' + acts + '</div>' : '') + '</div>';
  }

  function timelineHtml(d) {
    var f = S.filter || 'alle';
    var counts = { alle: d.items.length, erwartet: 0, da: 0, ohne: 0 };
    d.items.forEach(function (r) { ['erwartet', 'da', 'ohne'].forEach(function (k) { if (filterOf(r, k)) counts[k]++; }); });
    var labels = { alle: 'Alle', erwartet: 'Erwartet', da: 'Da', ohne: 'Ohne Tisch' };
    var h = '<section class="panel timeline"><div class="tl-head"><h2>Tagesablauf</h2><div class="filters" role="group" aria-label="Filter">' +
      Object.keys(labels).map(function (k) {
        if (k !== 'alle' && !counts[k] && f !== k) return '';
        return '<button data-filter="' + k + '" aria-pressed="' + (f === k) + '">' + labels[k] + ' <span>' + counts[k] + '</span></button>';
      }).join('') + '</div></div>' +
      '<p class="print-title">Reservierungen ' + esc(d.label) + ' · ' + d.stats.guests + ' Gäste</p>';
    if (!d.open) h += '<p class="closed-note">An diesem Tag ist regulär geschlossen. Feiern und Gruppen kannst du trotzdem eintragen.</p>';
    var list = d.items.filter(function (r) { return filterOf(r, f); });
    if (!d.items.length) return h + '<p class="empty">Noch keine Reservierungen für diesen Tag.</p></section>';
    if (!list.length) return h + '<p class="empty">Keine Einträge in diesem Filter.</p></section>';
    var groups = [], by = {};
    list.forEach(function (r) { if (!by[r.time]) { by[r.time] = []; groups.push(r.time); } by[r.time].push(r); });
    var isToday = d.date === boot.today, m = nowMin();
    h += '<div class="tl">' + groups.map(function (t) {
      var past = isToday && minutes(t) + d.duration <= m;
      var nowish = isToday && !past && minutes(t) <= m + 60;
      return '<div class="tl-time' + (past ? ' past' : '') + '">' + esc(t) + '</div><div class="tl-group' + (past ? ' past' : '') + (nowish ? ' soon' : '') + '">' +
        by[t].map(cardHtml).join('') + '</div>';
    }).join('') + '</div></section>';
    return h;
  }

  function nextHtml(d) {
    var isToday = d.date === boot.today, m = nowMin();
    var cand = d.items.filter(function (r) { return r.status === 'bestaetigt' && (!isToday || minutes(r.time) >= m - 30); })[0];
    if (!cand) return '<section class="next-card"><div class="eyebrow">Als Nächstes</div><p class="nc-empty">' + (d.items.some(isActive) ? 'Alle erwarteten Gäste sind da.' : 'Keine Reservierungen.') + '</p></section>';
    var label = 'Erste Reservierung';
    if (isToday) { var diff = minutes(cand.time) - m; label = diff > 0 ? 'Als Nächstes · in ' + (diff >= 90 ? Math.floor(diff / 60) + ' Std. ' + (diff % 60 ? diff % 60 + ' Min.' : '') : diff + ' Min.') : (diff === 0 ? 'Als Nächstes · jetzt' : 'Erwartet seit ' + (-diff) + ' Min.'); }
    var msg = 'Grüß Gott ' + cand.name + ', wir freuen uns auf Sie heute um ' + cand.time + ' Uhr. Ihr Mesnerhaus';
    return '<section class="next-card"><div class="eyebrow">' + esc(label) + '</div>' +
      '<button class="nc-name" data-open="' + cand.id + '">' + esc(cand.name) + '</button>' +
      '<div class="nc-meta">' + esc(cand.time) + ' · ' + cand.persons + ' Personen' + (hasTable(cand) ? ' · ' + esc(tableText(cand)) : ' · noch kein Tisch') + '</div>' +
      (cand.note ? '<div class="nc-note">' + esc(cand.note) + '</div>' : '') +
      (cand.phone ? '<div class="nc-acts"><a class="nc-btn primary" href="tel:' + esc(cand.phone.replace(/[^\d+]/g, '')) + '">' + ico('phone') + 'Anrufen</a>' +
        '<a class="nc-btn" target="_blank" rel="noopener" href="https://wa.me/' + esc(phoneIntl(cand.phone)) + '?text=' + encodeURIComponent(msg) + '">' + ico('msg') + 'WhatsApp</a></div>' : '') +
      '</section>';
  }

  function curveHtml(d) {
    if (!d.load.length || !d.stats.peak) return '';
    var W = 340, H = 150, top = 22, base = 128, n = d.load.length;
    var max = Math.max(d.seats, d.stats.peak, 1);
    var x = function (i) { return n === 1 ? W / 2 : Math.round(i / (n - 1) * W * 10) / 10; };
    var y = function (g) { return Math.round((base - g / max * (base - top)) * 10) / 10; };
    var pts = d.load.map(function (l, i) { return x(i) + ' ' + y(l.guests); });
    var pk = 0; d.load.forEach(function (l, i) { if (l.guests > d.load[pk].guests) pk = i; });
    var seatY = y(d.seats);
    var labels = '';
    d.load.forEach(function (l, i) {
      if (l.time.slice(3) !== '00' || (minutes(l.time) - minutes(d.load[0].time)) % 120) return;
      labels += '<text x="' + x(i) + '" y="146" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '">' + hourOnly(l.time) + (i === 0 ? ' Uhr' : '') + '</text>';
    });
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Belegung über den Tag, höchstens ' + d.stats.peak + ' von ' + d.seats + ' Plätzen' + (d.stats.peak_time ? ' um ' + d.stats.peak_time : '')) + '">' +
      '<line x1="0" y1="' + seatY + '" x2="' + W + '" y2="' + seatY + '" class="cap"/>' +
      '<text x="' + W + '" y="' + (seatY - 6) + '" text-anchor="end" class="cap-t">' + d.seats + ' Plätze</text>' +
      '<line x1="0" y1="' + base + '" x2="' + W + '" y2="' + base + '" class="axis"/>' +
      '<path d="M' + pts.join(' L') + ' L' + x(n - 1) + ' ' + base + ' L0 ' + base + ' Z" class="area"/>' +
      '<path d="M' + pts.join(' L') + '" class="line"/>' +
      (d.stats.peak ? '<circle cx="' + x(pk) + '" cy="' + y(d.load[pk].guests) + '" r="5" class="pk"/><text x="' + Math.min(W - 10, Math.max(10, x(pk))) + '" y="' + (y(d.load[pk].guests) - 9) + '" text-anchor="middle" class="pk-t">' + d.load[pk].guests + '</text>' : '') +
      labels + '</svg>';
    return '<section class="panel side"><div class="side-head"><h2>Belegung</h2><span>Gäste am Tisch, je Reservierung ' + d.duration + ' Min.</span></div>' + svg + '</section>';
  }

  function wishesHtml(d) {
    var w = d.items.filter(function (r) { return isActive(r) && r.note; });
    return '<section class="panel side"><h2>Wünsche' + (d.date === boot.today ? ' heute' : '') + '</h2>' +
      (w.length ? '<div class="wishes">' + w.map(function (r) {
        return '<button class="wish" data-open="' + r.id + '"><span class="wi">' + ico('msg') + '</span><span><b>' + esc(r.note) + '</b> · ' + esc(r.name) + ', ' + esc(r.time) + '</span></button>';
      }).join('') + '</div>' : '<p class="hint">Keine besonderen Wünsche eingetragen.</p>') + '</section>';
  }

  function render() {
    var d = S.data;
    var html = headerHtml(d) + menuHtml();
    html += '<main class="app' + (S.view === 'plan' ? ' planview' : '') + '">';
    if (S.view === 'plan') {
      html += planHtml(d);
    } else if (S.view === 'alle') {
      html += listViewHtml();
    } else if (S.view === 'web' && isAdmin) {
      html += webHtml();
    } else {
      html += '<div class="dash"><div class="dash-main">' + kpiHtml(d) + timelineHtml(d) + '</div>' +
        '<aside class="dash-side">' + nextHtml(d) + curveHtml(d) + wishesHtml(d) + '</aside></div>';
    }
    html += '</main>';
    html += '<nav class="bottom-nav" aria-label="Hauptmenü">' +
      '<button data-view="liste" aria-pressed="' + (S.view === 'liste') + '">' + ico('clock') + 'Ablauf</button>' +
      '<button data-view="plan" aria-pressed="' + (S.view === 'plan') + '">' + ico('grid') + 'Tische</button>' +
      '<button class="bn-new" data-act="new" aria-label="Reservierung eintragen">' + ico('plus') + '</button>' +
      '<button data-view="alle" aria-pressed="' + (S.view === 'alle') + '">' + ico('list') + 'Liste</button>' +
      '<button data-act="menu" aria-expanded="' + S.menu + '">' + ico('menu') + 'Mehr</button></nav>';
    root.innerHTML = html;

    if (S.view === 'plan') bindPlan();
    if (S.view === 'web') bindWeb();
    if (S.view === 'alle') {
      var lq = $('#lq'), tm = null;
      lq.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { S.q = lq.value; loadList(); }, 250); });
      if (!S.list) loadList();
    }
  }

  /* ── Liste: kommende und vergangene Reservierungen ─────── */
  var listReq = 0;
  function loadList() {
    var my = ++listReq;
    return api('GET', null, '?list&scope=' + S.scope + '&q=' + encodeURIComponent(S.q)).then(function (j) {
      if (my !== listReq) return;
      S.list = j;
      // Auswahl auf vorhandene Einträge beschränken
      var ids = {}; j.items.forEach(function (r) { ids[r.id] = true; });
      Object.keys(S.picked).forEach(function (k) { if (!ids[k]) delete S.picked[k]; });
      refreshList();
    });
  }
  function refreshList() {
    var b = $('#lbody'); if (b) b.innerHTML = listBody();
    var c = $('#lcount'); if (c) c.textContent = listCount();
    var bar = $('#lbar'); if (bar) bar.outerHTML = pickBar();
  }
  function pickedIds() { return Object.keys(S.picked).map(Number); }
  function pickBar() {
    if (!S.pickMode) return '<div id="lbar" hidden></div>';
    var n = pickedIds().length, all = S.list && S.list.items.length && S.list.items.every(function (r) { return S.picked[r.id]; });
    return '<div id="lbar" class="pickbar" role="status"><b>' + n + ' ausgewählt</b>' +
      '<button class="btn small ghost" data-act="pickall">' + (all ? 'Keine' : 'Alle') + '</button><span class="grow"></span>' +
      '<button class="btn small ghost" data-act="pickcancel">Abbrechen</button>' +
      '<button class="btn small danger-solid" data-act="pickdelete"' + (n ? '' : ' disabled') + '>' + ico('trash') + 'Löschen</button></div>';
  }
  function confirmDelete() {
    var ids = pickedIds(); if (!ids.length) return;
    var rows = S.list.items.filter(function (r) { return S.picked[r.id]; });
    var body = '<p>Diese <b>' + ids.length + (ids.length === 1 ? ' Reservierung' : ' Reservierungen') + '</b> werden endgültig gelöscht:</p>' +
      '<ul class="del-list">' + rows.slice(0, 12).map(function (r) { return '<li>' + esc(shortDate(r.date)) + ' ' + esc(r.time) + ' · ' + esc(r.name) + ' · ' + r.persons + ' P.</li>'; }).join('') +
      (rows.length > 12 ? '<li>… und ' + (rows.length - 12) + ' weitere</li>' : '') + '</ul>' +
      '<p class="hint">Die Gäste werden nicht benachrichtigt. Wer nur absagen will, nutzt besser „Stornieren“ in der Reservierung.</p>' +
      '<p class="alert err" data-step2 hidden><b>Letzte Bestätigung:</b> Das kann nicht rückgängig gemacht werden.</p>';
    var dlg = dialog('Reservierungen löschen?', body, '<button type="button" class="btn ghost" data-close2>Abbrechen</button><button type="button" class="btn danger" data-del>Löschen</button>');
    $('[data-close2]', dlg).addEventListener('click', function () { dlg.close(); });
    $('[data-del]', dlg).addEventListener('click', function (e) {
      var b = e.currentTarget;
      if (!b.dataset.sure) {      // 1. Bestätigung → 2. Stufe
        b.dataset.sure = '1'; b.className = 'btn danger-solid'; b.textContent = 'Endgültig löschen (' + ids.length + ')';
        $('[data-step2]', dlg).hidden = false; return;
      }
      b.disabled = true;
      api('POST', { action: 'delete', ids: ids }).then(function (j) {
        if (!j.ok) { b.disabled = false; showErr(dlg, j.message || 'Löschen fehlgeschlagen.'); return; }
        dlg.close(); toast(j.message); S.picked = {}; S.pickMode = false; after(j);
      });
    });
  }
  function listCount() { return S.list ? S.list.items.length + (S.list.items.length === 1 ? ' Eintrag' : ' Einträge') : ''; }
  function listViewHtml() {
    return '<section class="panel lst"><div class="lst-head"><h2>Alle Reservierungen</h2>' +
      '<div class="seg" role="group" aria-label="Zeitraum"><button data-scope="kommend" aria-pressed="' + (S.scope === 'kommend') + '">Kommend</button>' +
      '<button data-scope="vergangen" aria-pressed="' + (S.scope === 'vergangen') + '">Vergangen</button></div>' +
      (isAdmin ? '<div class="lst-tools"><button class="btn small ghost" data-act="export">' + ico('down') + 'CSV exportieren</button>' +
        '<button class="btn small ghost" data-act="pickmode" aria-pressed="' + S.pickMode + '">' + ico('check') + 'Auswählen</button></div>' : '') + '</div>' +
      '<div class="lst-search"><label class="sr" for="lq">Suchen</label>' + ico('search') +
      '<input id="lq" type="search" placeholder="Name, Telefon, E-Mail oder Notiz" value="' + esc(S.q) + '" autocomplete="off"><span id="lcount">' + listCount() + '</span></div>' +
      (S.scope === 'vergangen' ? '<p class="hint">Vergangene Reservierungen werden ' + 60 + ' Tage nach dem Termin automatisch gelöscht.</p>' : '') +
      pickBar() + '<div id="lbody">' + listBody() + '</div></section>';
  }
  function listBody() {
    if (!S.list || S.list.scope !== S.scope) return '<p class="empty">Wird geladen …</p>';
    var items = S.list.items;
    if (!items.length) return '<p class="empty">' + (S.q ? 'Nichts gefunden.' : (S.scope === 'kommend' ? 'Keine kommenden Reservierungen.' : 'Keine vergangenen Reservierungen.')) + '</p>';
    var days = [], by = {};
    items.forEach(function (r) { if (!by[r.date]) { by[r.date] = []; days.push(r.date); } by[r.date].push(r); });
    return days.map(function (day) {
      var act = by[day].filter(isActive), g = act.reduce(function (n, r) { return n + r.persons; }, 0);
      var x = new Date(day + 'T12:00:00');
      return '<div class="lst-day"><button class="lst-date" data-day="' + esc(day) + '" data-goview="liste"><b>' + WD[x.getDay()].slice(0, 2) + ' ' + x.getDate() + '.' + (x.getMonth() + 1) + '.' + x.getFullYear() + '</b>' +
        '<span>' + act.length + ' Res. · ' + g + ' Gäste</span></button>' +
        by[day].map(function (r) {
          var meta = [r.persons + ' P.'];
          if (r.table) meta.push(tableText(r));
          if (r.phone) meta.push(esc(r.phone));
          if (r.note) meta.push(esc(r.note));
          var on = !!S.picked[r.id];
          return '<button class="lst-row' + (isActive(r) ? '' : ' inactive') + (S.pickMode ? ' picking' : '') + (on ? ' picked' : '') + '" ' +
            (S.pickMode ? 'data-lpick="' + r.id + '" aria-pressed="' + on + '"' : 'data-open="' + r.id + '" data-day="' + esc(r.date) + '"') + '>' +
            (S.pickMode ? '<span class="cb" aria-hidden="true">' + (on ? ico('check') : '') + '</span>' : '') +
            '<span class="t">' + esc(r.time) + '</span><span class="n"><b>' + esc(r.name) + (r.seen ? '' : ' <span class="badge-neu">NEU</span>') + '</b><small>' + meta.join(' · ') + '</small></span>' +
            '<span class="chip ' + esc(r.status) + '">' + esc(STATUS[r.status] || r.status) + '</span></button>';
        }).join('') + '</div>';
    }).join('');
  }

  /* ── Website: Banner, Tageskarte, Sonderkarten, Effekte, Galerie (nur Admin) ── */
  function apiForm(fd) {
    return fetch('api.php', { method: 'POST', body: fd, headers: { 'X-CSRF': boot.csrf }, credentials: 'same-origin' }).then(function (r) {
      if (r.status === 401) { location.reload(); throw new Error('login'); }
      return r.json().catch(function () { return { ok: false, message: r.status === 413 ? 'Die Datei ist zu groß für den Server.' : 'Unerwartete Antwort vom Server (' + r.status + ').' }; });
    });
  }
  // Foto im Browser verkleinern (auch iPhone-HEIC → JPEG), Rückgabe Blob
  function shrinkImage(file, max, quality) {
    if (!/^image\//.test(file.type)) return Promise.resolve(null);
    return createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (bmp) {
      var s = Math.min(1, max / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas');
      c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
      var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(bmp, 0, 0, c.width, c.height);
      return new Promise(function (res) { c.toBlob(res, 'image/jpeg', quality || 0.84); });
    });
  }
  function mdToDe(md) { return md ? md.slice(3, 5) + '.' + md.slice(0, 2) + '.' : ''; }
  function deToMd(v) {
    var m = String(v || '').trim().match(/^(\d{1,2})\.(\d{1,2})\.?$/);
    return m ? ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2) : null;
  }
  function galThumb(g) { return g.kind === 'static' ? '/images/' + g.base + '-' + (g.base === 'panorama' ? 480 : 360) + '.webp' : '/site.php?f=' + encodeURIComponent(g.id + '-s.jpg'); }

  function loadSite() {
    return api('POST', { action: 'site' }).then(function (j) { if (j.ok) { S.site = j; if (S.view === 'web') render(); } });
  }
  function webMsg(id, text, ok) { var e = $('[data-wmsg="' + id + '"]'); if (!e) { toast(text); return; } e.textContent = text; e.className = 'alert ' + (ok ? 'ok' : 'err'); e.hidden = false; }

  function webHtml() {
    var w = S.site;
    if (!w) { loadSite(); return '<section class="panel"><p class="empty">Wird geladen …</p></section>'; }
    var h = '<div class="web">';
    h += '<p class="web-intro">Alles, was Gäste auf <b>mesnerhausarmesberg.de</b> sehen. Änderungen sind sofort online. ' +
      '<a href="/" target="_blank" rel="noopener">Website öffnen</a></p>';

    // 1. Hinweis-Banner
    var n = w.notice || { text: '', link: '', url: '', label: '', until: '' };
    h += '<section class="panel wcard" id="w-notice"><div class="wc-head"><h2>Hinweis-Banner</h2>' +
      (w.notice ? '<span class="wstate on">sichtbar' + (n.until ? ' bis ' + esc(shortDate(n.until)) : '') + '</span>' : '<span class="wstate">aus</span>') + '</div>' +
      '<p class="hint">Schmale Leiste ganz oben auf der Website, z. B. „Am 24.12. geschlossen“ oder „Neu: Weihnachtsmenü“.</p>' +
      '<div class="form"><label>Text (max. 160 Zeichen) <span class="muted" data-ncount>' + n.text.length + '/160</span><textarea data-ntext maxlength="160" rows="2">' + esc(n.text) + '</textarea></label>' +
      '<div class="grid2"><label>Link<select data-nlink>' + Object.keys(w.notice_links).map(function (k) { return '<option value="' + esc(k) + '"' + (k === (n.link || '') ? ' selected' : '') + '>' + esc(w.notice_links[k]) + '</option>'; }).join('') + '</select></label>' +
      '<label>Anzeigen bis (leer = dauerhaft)<input type="date" data-nuntil value="' + esc(n.until || '') + '"></label></div>' +
      '<div class="grid2" data-ncustom' + (n.link === 'custom' ? '' : ' hidden') + '><label>Link-Adresse<input data-nurl value="' + esc(n.url || '') + '" placeholder="https://… oder /reservierungen/"></label>' +
      '<label>Link-Text<input data-nlabel maxlength="40" value="' + esc(n.label || '') + '" placeholder="Mehr erfahren"></label></div>' +
      '<div class="wc-acts"><button type="button" class="btn primary" data-wact="notice_save">Speichern</button>' +
      (w.notice ? '<button type="button" class="btn ghost danger" data-wact="notice_delete">Entfernen</button>' : '') + '</div>' +
      '<p class="alert" data-wmsg="notice" hidden></p></div></section>';

    // 2. Tageskarte
    var tk = w.tk;
    h += '<section class="panel wcard" id="w-tk"><div class="wc-head"><h2>Tageskarte</h2>' +
      (tk ? '<span class="wstate on">online seit ' + esc(new Date(tk.updated * 1000).toLocaleDateString('de-DE')) + '</span>' : '<span class="wstate">keine</span>') + '</div>' +
      '<div class="tk-row">' + (tk ? '<a class="tk-prev" href="/tageskarte.php?v=' + tk.updated + '" target="_blank" rel="noopener">' +
        (tk.image ? '<img src="/tageskarte.php?bild&v=' + tk.updated + '" alt="Aktuelle Tageskarte">' : '<span>PDF öffnen</span>') + '</a>' : '') +
      '<div class="form tk-form"><p class="hint">Foto der Karte (Handykamera genügt) oder PDF. Fotos werden automatisch verkleinert und als PDF bereitgestellt.</p>' +
      '<label class="filebtn">' + ico('plus') + '<span data-tkname>Foto oder PDF wählen</span><input type="file" data-tkfile accept="image/*,application/pdf"></label>' +
      '<label>Überschrift (optional)<input data-tkcap maxlength="120" placeholder="z. B. Sonntag, 30. November" value="' + esc(tk ? tk.caption : '') + '"></label>' +
      '<div class="wc-acts"><button type="button" class="btn primary" data-wact="tk_upload">Hochladen</button>' +
      (tk ? '<button type="button" class="btn ghost danger" data-wact="tk_delete">Entfernen</button>' : '') + '</div>' +
      '<p class="alert" data-wmsg="tk" hidden></p></div></div></section>';

    // 3. Sonderkarten
    h += '<section class="panel wcard" id="w-sp"><div class="wc-head"><h2>Sonderkarten</h2><span class="wstate' + (w.specials.length ? ' on' : '') + '">' + w.specials.length + '</span></div>' +
      '<p class="hint">Z. B. Weihnachtsmenü, Ostern, Muttertag, Wildwochen. Erscheinen auf der Website bei der Tageskarte, nur im eingestellten Zeitraum.</p>';
    h += w.specials.map(function (s) {
      return '<div class="sp-item" data-sp="' + esc(s.id) + '">' +
        '<a class="sp-thumb" href="/site.php?f=' + encodeURIComponent(s.file) + '" target="_blank" rel="noopener">' + (s.image ? '<img src="/site.php?f=' + encodeURIComponent(s.image) + '" alt="">' : '<span>PDF</span>') + '</a>' +
        '<div class="form sp-form"><div class="grid2"><label>Titel<input data-f="title" maxlength="60" value="' + esc(s.title) + '"></label>' +
        '<label class="check sp-on"><input type="checkbox" data-f="on"' + (s.on ? ' checked' : '') + '> auf der Website zeigen</label></div>' +
        '<label>Kurzer Text (optional)<input data-f="text" maxlength="200" value="' + esc(s.text) + '"></label>' +
        '<div class="grid2"><label>Zeigen ab<input type="date" data-f="from" value="' + esc(s.from) + '"></label><label>Zeigen bis<input type="date" data-f="to" value="' + esc(s.to) + '"></label></div>' +
        '<div class="wc-acts"><button type="button" class="btn small primary" data-spsave="' + esc(s.id) + '">Speichern</button>' +
        '<button type="button" class="btn small ghost danger" data-spdel="' + esc(s.id) + '">Löschen</button></div></div></div>';
    }).join('');
    h += '<details class="sp-new"' + (w.specials.length ? '' : ' open') + '><summary>' + ico('plus') + 'Neue Sonderkarte</summary><div class="form">' +
      '<label>Titel<input data-spn="title" maxlength="60" placeholder="z. B. Weihnachtsmenü 2026"></label>' +
      '<label>Kurzer Text (optional)<input data-spn="text" maxlength="200" placeholder="z. B. Am 25. und 26. Dezember, bitte reservieren"></label>' +
      '<div class="grid2"><label>Zeigen ab<input type="date" data-spn="from"></label><label>Zeigen bis<input type="date" data-spn="to"></label></div>' +
      '<label class="filebtn">' + ico('plus') + '<span data-spname>Foto oder PDF der Karte wählen</span><input type="file" data-spfile accept="image/*,application/pdf"></label>' +
      '<div class="wc-acts"><button type="button" class="btn primary" data-wact="special_add">Anlegen</button></div></div></details>' +
      '<p class="alert" data-wmsg="sp" hidden></p></section>';

    // 4. Saison-Effekte
    h += '<section class="panel wcard" id="w-fx"><div class="wc-head"><h2>Saison-Effekte</h2>' +
      (w.active_effect ? '<span class="wstate on">heute: ' + esc(w.effect_types[w.active_effect.type]) + '</span>' : '<span class="wstate">heute keiner</span>') + '</div>' +
      '<p class="hint">Leichter Schnee im Advent, fallendes Laub im Herbst oder Blüten im Frühling über der Startseite. Gilt jedes Jahr im Zeitraum. ' +
      'Wer am Gerät „Bewegung reduzieren“ eingestellt hat, sieht keinen Effekt.</p>' +
      '<div class="fx-list">' + w.effects.map(function (e, i) {
        return '<div class="fx-row" data-fx="' + i + '"><label class="check"><input type="checkbox" data-fxf="on"' + (e.on ? ' checked' : '') + '> an</label>' +
          '<select data-fxf="type" aria-label="Effekt">' + Object.keys(w.effect_types).map(function (k) { return '<option value="' + k + '"' + (k === e.type ? ' selected' : '') + '>' + esc(w.effect_types[k]) + '</option>'; }).join('') + '</select>' +
          '<span class="fx-range"><input data-fxf="from" value="' + mdToDe(e.from) + '" placeholder="TT.MM." aria-label="von" inputmode="decimal"> – ' +
          '<input data-fxf="to" value="' + mdToDe(e.to) + '" placeholder="TT.MM." aria-label="bis" inputmode="decimal"></span>' +
          '<select data-fxf="intensity" aria-label="Stärke">' + ['leicht', 'mittel', 'stark'].map(function (k) { return '<option' + (k === e.intensity ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select>' +
          '<a class="btn small ghost" href="/?effekt=' + e.type + '&staerke=' + e.intensity + '" target="_blank" rel="noopener">Vorschau</a>' +
          '<button type="button" class="icon-btn" data-fxdel="' + i + '" aria-label="Effekt entfernen">' + ico('close') + '</button></div>';
      }).join('') + '</div>' +
      '<div class="wc-acts"><button type="button" class="btn ghost" data-wact="fx_add">' + ico('plus') + 'Effekt</button>' +
      '<button type="button" class="btn primary" data-wact="effects_save">Speichern</button></div><p class="alert" data-wmsg="fx" hidden></p></section>';

    // 5. Galerie
    h += '<section class="panel wcard" id="w-gal"><div class="wc-head"><h2>Galerie</h2><span class="wstate on">' + w.gallery.length + ' Bilder</span></div>' +
      '<p class="hint">Bereich „Einblicke“ auf der Startseite. Neue Fotos stehen vorne. Pfeile ändern die Reihenfolge, „breit“ zeigt ein Bild über zwei Spalten.</p>' +
      '<label class="filebtn">' + ico('plus') + '<span data-galname>Fotos hinzufügen</span><input type="file" data-galfile accept="image/*" multiple></label>' +
      '<p class="alert" data-wmsg="gal" hidden></p>' +
      '<div class="gal-grid">' + w.gallery.map(function (g, i) {
        return '<div class="gal-item" data-gal="' + esc(g.id) + '"><div class="gal-img"><img src="' + esc(galThumb(g)) + '" alt="" loading="lazy">' +
          '<div class="gal-tools"><button type="button" data-galmove="-1" aria-label="nach vorne"' + (i === 0 ? ' disabled' : '') + '>' + ico('left') + '</button>' +
          '<button type="button" data-galmove="1" aria-label="nach hinten"' + (i === w.gallery.length - 1 ? ' disabled' : '') + '>' + ico('right') + '</button>' +
          '<button type="button" data-galdel aria-label="Bild entfernen">' + ico('close') + '</button></div></div>' +
          '<input data-gf="caption" maxlength="80" value="' + esc(g.caption) + '" placeholder="Bildunterschrift" aria-label="Bildunterschrift">' +
          '<input data-gf="alt" maxlength="120" value="' + esc(g.alt) + '" placeholder="Beschreibung (für Blinde/Google)" aria-label="Bildbeschreibung">' +
          '<label class="check"><input type="checkbox" data-gf="wide"' + (g.wide ? ' checked' : '') + '> breit</label></div>';
      }).join('') + '</div>' +
      '<div class="wc-acts"><button type="button" class="btn primary" data-wact="gallery_save">Reihenfolge &amp; Texte speichern</button>' +
      (w.gallery_custom ? '<button type="button" class="btn ghost" data-wact="gallery_reset">Original wiederherstellen</button>' : '') + '</div></section>';
    return h + '</div>';
  }

  function readGallery() {
    return $$('[data-gal]').map(function (el) {
      return { id: el.dataset.gal, caption: $('[data-gf=caption]', el).value, alt: $('[data-gf=alt]', el).value, wide: $('[data-gf=wide]', el).checked };
    });
  }
  function readEffects() {
    return $$('[data-fx]').map(function (el) {
      return { id: (S.site.effects[+el.dataset.fx] || {}).id, type: $('[data-fxf=type]', el).value, from: deToMd($('[data-fxf=from]', el).value), to: deToMd($('[data-fxf=to]', el).value),
        intensity: $('[data-fxf=intensity]', el).value, on: $('[data-fxf=on]', el).checked };
    });
  }

  function bindWeb() {
    if (!S.site) return;
    var nt = $('[data-ntext]'); if (nt) nt.addEventListener('input', function () { $('[data-ncount]').textContent = nt.value.length + '/160'; });
    var nl = $('[data-nlink]'); if (nl) nl.addEventListener('change', function () { $('[data-ncustom]').hidden = nl.value !== 'custom'; });
    [['[data-tkfile]', '[data-tkname]'], ['[data-spfile]', '[data-spname]']].forEach(function (p) {
      var f = $(p[0]); if (f) f.addEventListener('change', function () { if (f.files[0]) $(p[1]).textContent = f.files[0].name; });
    });
    var gf = $('[data-galfile]');
    if (gf) gf.addEventListener('change', function () {
      var files = Array.prototype.slice.call(gf.files); if (!files.length) return;
      var label = $('[data-galname]'), done = 0;
      var next = function (i) {
        if (i >= files.length) { label.textContent = 'Fotos hinzufügen'; render(); webMsg('gal', done + (done === 1 ? ' Bild hinzugefügt.' : ' Bilder hinzugefügt.') + ' Es ist schon online. Bildunterschrift eintragen und speichern.', true); return; }
        label.textContent = 'Lade Bild ' + (i + 1) + ' von ' + files.length + ' …';
        Promise.all([shrinkImage(files[i], 1600, 0.84), shrinkImage(files[i], 480, 0.8)]).then(function (b) {
          if (!b[0] || !b[1]) throw new Error('Dieses Bild kann der Browser nicht lesen.');
          var fd = new FormData(); fd.append('action', 'gallery_add'); fd.append('large', b[0], 'l.jpg'); fd.append('small', b[1], 's.jpg');
          fd.append('caption', ''); fd.append('alt', files[i].name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
          return apiForm(fd);
        }).then(function (j) {
          if (!j.ok) throw new Error(j.message || 'Hochladen fehlgeschlagen.');
          S.site.gallery = j.gallery; S.site.gallery_custom = true; done++; next(i + 1);
        }).catch(function (err) { label.textContent = 'Fotos hinzufügen'; webMsg('gal', err.message, false); if (done) render(); });
      };
      next(0);
    });
  }

  function webClick(t) {
    var w = S.site; if (!w) return false;
    var act = t.dataset.wact;
    if (t.dataset.galmove || t.dataset.galdel !== undefined) {
      var items = readGallery(), el = t.closest('[data-gal]'), id = el.dataset.gal, i = items.map(function (x) { return x.id; }).indexOf(id);
      // Texte aus den Feldern übernehmen, dann verschieben/entfernen
      var byId = {}; w.gallery.forEach(function (g) { byId[g.id] = g; });
      items.forEach(function (x) { Object.assign(byId[x.id], { caption: x.caption, alt: x.alt, wide: x.wide }); });
      var list = items.map(function (x) { return byId[x.id]; });
      if (t.dataset.galmove) { var j = i + (+t.dataset.galmove); if (j < 0 || j >= list.length) return true; var tmp = list[i]; list[i] = list[j]; list[j] = tmp; }
      else {
        if (!t.dataset.sure) { t.dataset.sure = '1'; t.classList.add('sure'); t.setAttribute('aria-label', 'Wirklich entfernen? Nochmal tippen'); return true; }
        list.splice(i, 1);
      }
      w.gallery = list; w._galDirty = true; render();
      webMsg('gal', 'Noch nicht gespeichert: unten auf „Reihenfolge & Texte speichern“ tippen.', false);
      return true;
    }
    if (t.dataset.spsave || t.dataset.spdel) {
      var sid = t.dataset.spsave || t.dataset.spdel, box = t.closest('[data-sp]');
      if (t.dataset.spdel && !t.dataset.sure) { t.dataset.sure = '1'; t.textContent = 'Wirklich löschen?'; return true; }
      var body = t.dataset.spdel ? { action: 'special_delete', id: sid } : { action: 'special_update', id: sid, title: $('[data-f=title]', box).value, text: $('[data-f=text]', box).value,
        from: $('[data-f=from]', box).value, to: $('[data-f=to]', box).value, on: $('[data-f=on]', box).checked };
      api('POST', body).then(function (j) { if (j.ok) { w.specials = j.specials; render(); } webMsg('sp', j.message || 'Fehler', j.ok); });
      return true;
    }
    if (t.dataset.fxdel !== undefined) { w.effects = readEffects(); w.effects.splice(+t.dataset.fxdel, 1); render(); webMsg('fx', 'Noch nicht gespeichert.', false); return true; }
    if (!act) return false;
    if (act === 'fx_add') { w.effects = readEffects(); w.effects.push({ type: 'schnee', from: '12-01', to: '12-26', intensity: 'leicht', on: true }); render(); return true; }
    if (act === 'effects_save') {
      var fx = readEffects();
      if (fx.some(function (e) { return !e.from || !e.to; })) { webMsg('fx', 'Bitte Zeiträume als TT.MM. eingeben, z. B. 01.12. – 06.01.', false); return true; }
      api('POST', { action: 'effects_save', effects: fx }).then(function (j) { if (j.ok) { loadSite().then(function () { webMsg('fx', j.message, true); }); } else webMsg('fx', j.message || 'Fehler', false); });
      return true;
    }
    if (act === 'notice_save') {
      api('POST', { action: 'notice_save', text: $('[data-ntext]').value, link: $('[data-nlink]').value, until: $('[data-nuntil]').value, url: $('[data-nurl]').value, label: $('[data-nlabel]').value })
        .then(function (j) { if (j.ok) loadSite().then(function () { webMsg('notice', j.message, true); }); else webMsg('notice', j.message || 'Fehler', false); });
      return true;
    }
    if (act === 'notice_delete' || act === 'tk_delete' || act === 'gallery_reset') {
      if (!t.dataset.sure) { t.dataset.sure = '1'; t.textContent = 'Wirklich? Nochmal tippen'; return true; }
      api('POST', { action: act }).then(function (j) { var k = act === 'tk_delete' ? 'tk' : act === 'notice_delete' ? 'notice' : 'gal'; loadSite().then(function () { webMsg(k, j.message || 'Fehler', j.ok); }); });
      return true;
    }
    if (act === 'gallery_save') {
      api('POST', { action: 'gallery_save', items: readGallery() }).then(function (j) {
        if (j.ok) { w.gallery = j.gallery; w.gallery_custom = true; render(); }
        webMsg('gal', j.message || 'Fehler', j.ok);
      });
      return true;
    }
    if (act === 'tk_upload' || act === 'special_add') {
      var isTk = act === 'tk_upload', file = $(isTk ? '[data-tkfile]' : '[data-spfile]').files[0], key = isTk ? 'tk' : 'sp';
      if (!isTk && $('[data-spn=title]').value.trim().length < 2) { webMsg(key, 'Bitte einen Titel eingeben.', false); return true; }
      if (!file) { webMsg(key, 'Bitte zuerst ein Foto oder eine PDF wählen.', false); return true; }
      t.disabled = true; var label = t.textContent; t.textContent = 'Wird hochgeladen …';
      (/^image\//.test(file.type) ? shrinkImage(file, 2200, 0.86) : Promise.resolve(file)).then(function (blob) {
        var fd = new FormData(); fd.append('action', act); fd.append('file', blob || file, blob ? 'karte.jpg' : file.name);
        if (isTk) fd.append('caption', $('[data-tkcap]').value);
        else ['title', 'text', 'from', 'to'].forEach(function (k) { fd.append(k, $('[data-spn=' + k + ']').value); });
        return apiForm(fd);
      }).then(function (j) {
        t.disabled = false; t.textContent = label;
        if (j.ok) loadSite().then(function () { webMsg(key, j.message, true); }); else webMsg(key, j.message || 'Fehler', false);
      }).catch(function () { t.disabled = false; t.textContent = label; webMsg(key, 'Hochladen fehlgeschlagen. Bitte nochmal versuchen.', false); });
      return true;
    }
    return false;
  }

  /* ── Monatsübersicht ────────────────────────────────────── */
  var MON_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  function shiftMonth(ym, n) {
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n;
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    return y + '-' + ('0' + (m + 1)).slice(-2);
  }
  function openMonth(ym) {
    var dlg = dialog('Monatsübersicht', '<div data-month><p class="empty">Wird geladen …</p></div>',
      '<label class="mo-date-l">Datum<input type="date" class="mo-date" data-modate value="' + esc(S.date) + '"></label><span style="flex:1"></span><button type="button" class="btn primary" data-close2>Schließen</button>');
    dlg.classList.add('month-dlg');
    $('[data-close2]', dlg).addEventListener('click', function () { dlg.close(); });
    $('[data-modate]', dlg).addEventListener('change', function (e) { if (e.target.value) { dlg.close(); load(e.target.value); } });
    var box = $('[data-month]', dlg);
    var show = function (ym2) {
      api('GET', null, '?month=' + ym2).then(function (j) {
        var y = +j.month.slice(0, 4), m = +j.month.slice(5, 7) - 1;
        var first = (new Date(y, m, 1).getDay() + 6) % 7;   // Montag = 0
        var cells = '';
        for (var i = 0; i < first; i++) cells += '<span class="mo-cell pad"></span>';
        j.days.forEach(function (x) {
          var num = +x.date.slice(8);
          var cls = 'mo-cell' + (x.open ? ' open' : ' shut') + (x.count ? ' has' : '') + (x.date === j.today ? ' today' : '') +
            (x.date === S.date ? ' cur' : '') + (x.date < j.today ? ' past' : '');
          var label = shortDate(x.date) + (x.count ? ' ' + x.count + ' Reservierungen, ' + x.guests + ' Gäste' :
            (x.closed ? ' geschlossen (Urlaub/Feiertag)' : (x.open ? ' geöffnet, noch frei' : ' Ruhetag')));
          cells += '<button type="button" class="' + cls + '" data-mday="' + esc(x.date) + '" aria-label="' + esc(label) + '"><b>' + num + '</b>' +
            (x.count ? '<span class="g">' + x.guests + '<i> Gäste</i></span><span class="bar"><i style="width:' + Math.max(8, x.pct) + '%"' + (x.pct >= 85 ? ' class="hi"' : '') + '></i></span>'
              : (x.closed ? '<span class="z">zu</span>' : '')) + '</button>';
        });
        box.innerHTML = '<div class="mo-head"><button type="button" class="icon-btn" data-mnav="-1" aria-label="Vorheriger Monat">' + ico('left') + '</button>' +
          '<h3>' + MONTHS[m] + ' ' + y + '</h3><button type="button" class="icon-btn" data-mnav="1" aria-label="Nächster Monat">' + ico('right') + '</button></div>' +
          '<p class="mo-sum">' + j.count + (j.count === 1 ? ' Reservierung' : ' Reservierungen') + ' · ' + j.guests + ' Gäste</p>' +
          '<div class="mo-grid">' + MON_SHORT.map(function (w) { return '<span class="mo-wd">' + w + '</span>'; }).join('') + cells + '</div>' +
          '<div class="mo-legend"><span><i class="lg-open"></i>geöffnet</span><span><i class="lg-shut"></i>Ruhetag / zu</span><span><i class="lg-bar"></i>Auslastung</span></div>';
        $$('[data-mnav]', box).forEach(function (b) { b.addEventListener('click', function () { show(shiftMonth(j.month, +b.dataset.mnav)); }); });
        $$('[data-mday]', box).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); load(b.dataset.mday); }); });
      });
    };
    show(ym);
  }

  function openUnseen() {
    var u = S.data.unseen;
    var body = u.length ? '<div class="unseen-list">' + u.map(function (x) {
      return '<button type="button" class="card' + (x.status === 'storniert' ? ' inactive' : ' neu') + '" data-uopen="' + x.id + '" data-udate="' + esc(x.date) + '">' +
        '<span class="av" aria-hidden="true">' + esc(initial(x.name)) + '</span><span class="info"><b>' + esc(x.name) + '</b><span>' + esc(shortDate(x.date)) + ' · ' + esc(x.time) + ' Uhr' + (x.status === 'storniert' ? ' · storniert' : '') + '</span></span>' +
        '<span class="pers">' + x.persons + ' P.</span></button>';
    }).join('') + '</div>' : '<p class="hint">Keine neuen Online-Reservierungen. Alles gesehen.</p>';
    var dlg = dialog('Neu eingegangen', body, (u.length ? '<button type="button" class="btn ghost" data-seenall>Alle gesehen</button>' : '') + '<span style="flex:1"></span><button type="button" class="btn primary" data-close2>Schließen</button>');
    $('[data-close2]', dlg).addEventListener('click', function () { dlg.close(); });
    if ($('[data-seenall]', dlg)) $('[data-seenall]', dlg).addEventListener('click', function () {
      api('POST', { action: 'seen', ids: u.map(function (x) { return x.id; }) }).then(function (j) { dlg.close(); after(j); });
    });
    $$('[data-uopen]', dlg).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = +b.dataset.uopen, day = b.dataset.udate;
        dlg.close();
        (day !== S.date ? load(day) : Promise.resolve()).then(function () { openEdit(id); });
      });
    });
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
      api('POST', { action: 'status', id: r.id, status: 'storniert', notify: notify }).then(function (j) { dlg.close(); toast(j.mailed ? 'Storniert, E-Mail an den Gast wird gesendet' : 'Storniert'); after(j); });
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
        data.force = force; data._day = data.date;
        api('POST', data).then(function (j) {
          if (j.ok) { dlg.close(); toast(r ? 'Gespeichert' : (j.mailed ? 'Eingetragen, Bestätigung wird per E-Mail gesendet' : 'Eingetragen')); after(j, data.date); return; }
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
        '<fieldset><legend>Zugänge</legend><p class="hint">Benutzer anlegen, Rollen und Passwörter: Menü → <b>Benutzer</b>.</p>' +
        '<button type="button" class="btn small ghost" data-openusers>Benutzer verwalten</button></fieldset>' +
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
      $('[data-openusers]', dlg).addEventListener('click', function () { dlg.close(); openUsers(); });
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
        api('POST', { action: 'settings', settings: n }).then(function (r) { if (r.ok) { dlg.close(); toast('Einstellungen gespeichert'); after(r); } else showErr(dlg, r.message || 'Fehler'); });
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

  /* ── Benutzer verwalten (Admin) ─────────────────────────── */
  var ROLE = { admin: 'Admin', team: 'Team' };
  function openUsers() {
    var dlg = dialog('Benutzer', '<div data-ulist><p class="empty">Wird geladen …</p></div>' +
      '<fieldset style="margin-top:14px"><legend>Neuen Benutzer anlegen</legend>' +
      '<div class="grid2"><label>Name (Anmeldename)<input data-nname maxlength="40" autocomplete="off"></label>' +
      '<label>Rolle<select data-nrole><option value="team">Team</option><option value="admin">Admin</option></select></label></div>' +
      '<label>Passwort (mind. 10 Zeichen)<input type="password" data-npass minlength="10" autocomplete="new-password"></label>' +
      '<p class="roles"><b>Team:</b> Reservierungen ansehen, eintragen, ändern, stornieren, Tische zuweisen, Liste ansehen.<br>' +
      '<b>Admin:</b> zusätzlich Einstellungen, Benutzer, E-Mail-Vorlagen, Tischplan bearbeiten, CSV-Export und Löschen.</p>' +
      '<button type="button" class="btn primary" data-uadd>' + ico('plus') + 'Benutzer anlegen</button></fieldset>' +
      '<p class="alert" data-ures hidden></p>',
      '<span style="flex:1"></span><button type="button" class="btn ghost" data-close2>Schließen</button>');
    var res = $('[data-ures]', dlg), meId = boot.user.id;
    var say = function (t, ok) { res.textContent = t; res.className = 'alert ' + (ok ? 'ok' : 'err'); res.hidden = false; };
    $('[data-close2]', dlg).addEventListener('click', function () { dlg.close(); });
    var draw = function (users) {
      var admins = users.filter(function (u) { return u.role === 'admin'; }).length;
      $('[data-ulist]', dlg).innerHTML = '<div class="ulist">' + users.map(function (u) {
        var self = u.id === meId, lastAdmin = u.role === 'admin' && admins <= 1;
        return '<div class="urow"><div class="urow-top"><span class="av' + (u.role === 'admin' ? ' admin' : '') + '" aria-hidden="true">' + esc(initial(u.name)) + '</span>' +
          '<span class="nm"><b>' + esc(u.name) + (self ? ' (du)' : '') + '</b><small>' + ROLE[u.role] + '</small></span>' +
          '<span class="urow-acts"><select data-role="' + esc(u.id) + '" aria-label="Rolle von ' + esc(u.name) + '"' + (self || lastAdmin ? ' disabled title="' + (self ? 'Die eigene Rolle kann nur ein anderer Admin ändern' : 'Mindestens ein Admin muss bleiben') + '"' : '') + '>' +
            '<option value="team"' + (u.role === 'team' ? ' selected' : '') + '>Team</option><option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>Admin</option></select>' +
            (self || lastAdmin ? '' : '<button type="button" class="btn small danger" data-udel="' + esc(u.id) + '">Löschen</button>') + '</span></div>' +
          '<div class="urow-pw"><input type="password" minlength="10" placeholder="Neues Passwort setzen" data-upw="' + esc(u.id) + '" autocomplete="new-password" aria-label="Neues Passwort für ' + esc(u.name) + '">' +
          '<button type="button" class="btn small ghost" data-usetpw="' + esc(u.id) + '">Setzen</button></div></div>';
      }).join('') + '</div>';
      $$('[data-role]', dlg).forEach(function (sel) {
        sel.addEventListener('change', function () {
          api('POST', { action: 'user_role', id: sel.dataset.role, role: sel.value }).then(function (j) {
            say(j.message || 'Fehler', j.ok); if (j.users) draw(j.users); else reload();
          });
        });
      });
      $$('[data-udel]', dlg).forEach(function (b) {
        b.addEventListener('click', function () {
          if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Wirklich löschen?'; return; }
          api('POST', { action: 'user_delete', id: b.dataset.udel }).then(function (j) { say(j.message || 'Fehler', j.ok); if (j.users) draw(j.users); });
        });
      });
      $$('[data-usetpw]', dlg).forEach(function (b) {
        b.addEventListener('click', function () {
          var inp = $('[data-upw="' + b.dataset.usetpw + '"]', dlg);
          api('POST', { action: 'user_password', id: b.dataset.usetpw, new: inp.value }).then(function (j) { if (j.ok) inp.value = ''; say(j.message || 'Fehler', j.ok); });
        });
      });
    };
    var reload = function () { api('POST', { action: 'users' }).then(function (j) { if (j.ok) draw(j.users); else say(j.message || 'Fehler', false); }); };
    reload();
    $('[data-uadd]', dlg).addEventListener('click', function () {
      var nm = $('[data-nname]', dlg), pw = $('[data-npass]', dlg);
      api('POST', { action: 'user_add', name: nm.value, role: $('[data-nrole]', dlg).value, password: pw.value }).then(function (j) {
        say(j.message || 'Fehler', j.ok);
        if (j.ok) { nm.value = ''; pw.value = ''; draw(j.users); }
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
      // Handy: Tische zusätzlich als Liste (der Plan ist dort klein)
      h += '<div class="tbl-list">' + plan.tables.filter(function (t) { return t.area === S.area; }).map(function (t) {
        var r = occ[t.id], mine = assigning && (assigning.tables || []).indexOf(t.id) >= 0;
        var st = mine ? 'mine' : r ? (r.status === 'erschienen' ? 'here' : 'busy') : 'free';
        return '<button class="tl-item ' + st + (clash[t.id] ? ' clash' : '') + '" data-tbl="' + esc(t.id) + '"><b>' + esc(t.name) + '</b>' +
          '<span>' + (r && !mine ? esc(r.name) + ' · ' + r.persons + ' P. · ' + esc(r.time) : (mine ? 'gewählt' : 'frei')) + '</span><small>' + t.seats + ' Pl.</small></button>';
      }).join('') + '</div>';
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
          dlg.close(); toast('Tisch ' + t.name + ': ' + r.name); after(j);
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
      after(j);
    });
  }

  function planClick(t, act) {
    if (t.dataset.view) {
      S.view = t.dataset.view; S.assign = null; if (S.view === 'alle') S.list = null;
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
      api('POST', { action: 'auto_assign', date: S.date }).then(function (j) { toast(j.message || 'Fertig'); after(j); });
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
        S.edit = null; S.sel = null; toast('Tischplan gespeichert'); after(j);
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
    if (t.dataset.goview) { S.view = t.dataset.goview; load(t.dataset.day); return; }
    if (t.dataset.view && S.menu) S.menu = false;
    if (S.view === 'web' && !t.dataset.view && webClick(t)) return;
    if (planClick(t, act)) return;
    if (t.dataset.lpick) { var pid = t.dataset.lpick; if (S.picked[pid]) delete S.picked[pid]; else S.picked[pid] = true; refreshList(); return; }
    if (act === 'pickmode') { S.pickMode = !S.pickMode; S.picked = {}; render(); return; }
    if (act === 'pickcancel') { S.pickMode = false; S.picked = {}; render(); return; }
    if (act === 'pickall') {
      var allOn = S.list.items.every(function (r) { return S.picked[r.id]; });
      S.picked = {}; if (!allOn) S.list.items.forEach(function (r) { S.picked[r.id] = true; });
      refreshList(); return;
    }
    if (act === 'pickdelete') { confirmDelete(); return; }
    if (t.dataset.scope) { S.scope = t.dataset.scope; S.list = null; S.picked = {}; render(); return; }
    if (act === 'export') {
      var a = document.createElement('a');
      a.href = 'api.php?export&scope=' + S.scope + '&q=' + encodeURIComponent(S.q) + '&t=' + encodeURIComponent(boot.csrf);
      a.download = ''; document.body.appendChild(a); a.click(); a.remove(); return;
    }
    if (t.dataset.filter) { S.filter = t.dataset.filter; render(); return; }
    if (t.dataset.pickt) {
      var pr = S.data.items.filter(function (x) { return x.id === +t.dataset.pickt; })[0];
      if (!pr) return;
      var pts = planTimes(S.data), best = pts[0];
      pts.forEach(function (x) { if (minutes(x) <= minutes(pr.time)) best = x; });
      S.view = 'plan'; S.assign = pr.id; S.planTime = best || null;
      render(); window.scrollTo(0, 0); return;
    }
    if (t.dataset.here) {
      var hid = parseInt(t.dataset.here, 10), hr = S.data.items.filter(function (x) { return x.id === hid; })[0];
      if (hr) { hr.status = 'erschienen'; render(); }
      api('POST', { action: 'status', id: hid, status: 'erschienen' }).then(function (j) { after(j); }).catch(function () { load(); });
      return;
    }
    if (t.dataset.day && !act) { load(t.dataset.day); return; }
    if (act !== 'menu' && S.menu) S.menu = false;
    if (act === 'prev') load(addDays(S.date, -1));
    else if (act === 'next') load(addDays(S.date, 1));
    else if (act === 'month') { render(); openMonth(S.date.slice(0, 7)); }
    else if (act === 'new') { render(); openEdit(0); }
    else if (act === 'print') { render(); setTimeout(function () { window.print(); }, 50); }
    else if (act === 'menu') { S.menu = !S.menu; render(); }
    else if (act === 'settings') { render(); openSettings(); }
    else if (act === 'templates') { render(); openTemplates(); }
    else if (act === 'users') { render(); openUsers(); }
    else if (act === 'password') { render(); openPassword(); }
    else if (act === 'push') { render(); openPush(); }
    else if (act === 'logout') document.getElementById('logout').submit();
    else if (act === 'unseen') { render(); openUnseen(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.menu) { S.menu = false; render(); } });

  // Alle 60 Sekunden aktualisieren, solange die App sichtbar ist und kein Dialog offen ist
  setInterval(function () { if (!document.hidden && S.view !== 'web' && !document.querySelector('dialog[open]') && !S.menu && !S.edit && !(document.activeElement && document.activeElement.id === 'lq')) load(); }, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && S.view !== 'web' && !document.querySelector('dialog[open]') && !S.edit) load(); });

  load().catch(function () { root.innerHTML = '<p class="loading">Verbindung fehlgeschlagen. Bitte neu laden.</p>'; });
})();
