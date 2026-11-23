<?php
/* Website-Inhalte, die in der Verwaltung („Website“) gepflegt werden:
   Saison-Effekte, Sonderkarten und Galerie. Hinweis-Banner und Tageskarte liegen in tageskarte-lib.php.
   Konfiguration: site-config.php (JSON hinter PHP-Sperre) im Speicherordner, Dateien im Unterordner site/. */
declare(strict_types=1);

require_once __DIR__ . '/resv-lib.php';

const SITE_EFFECTS = ['schnee' => 'Schnee', 'laub' => 'Herbstlaub', 'blueten' => 'Frühlingsblüten'];
const SITE_INTENSITY = ['leicht', 'mittel', 'stark'];

function site_dir(): string {
    $d = tk_dir() . '/site';
    if (!@is_dir($d)) @mkdir($d, 0755, true);
    return $d;
}
function site_today(): string { return (new DateTime('now', new DateTimeZone('Europe/Berlin')))->format('Y-m-d'); }
function site_id(): string { return substr(bin2hex(random_bytes(6)), 0, 10); }

/* Galerie wie bisher fest eingebaut (Bilder unter /images/<base>-<breite>.webp) */
function site_default_gallery(): array {
    $g = [
        ['panorama', 'Landschaft rund um den Armesberg', 'Die Landschaft rund um den Armesberg', true, ''],
        ['gaststube-ecke', 'Gemütliche Ecke in der Gaststube mit Kerze und Blumen', 'Gemütlich in der Gaststube', false, ''],
        ['krustenbraten', 'Schweinebraten mit knuspriger Kruste', 'Schweinebraten mit Kruste', false, ''],
        ['braten-knoedel', 'Braten mit Soße, Kartoffelknödeln und Blaukraut', 'Braten mit Knödeln und Blaukraut', false, ''],
        ['terrasse', 'Terrasse des Mesnerhaus mit Blick ins Land', 'Die Terrasse, zum Teil überdacht', false, ''],
        ['salat', 'Bunter Salatteller mit Ei, Karotten und Radieschen', 'Frischer Salatteller', false, ''],
        ['kuechle', 'Selbstgebackene Küchle', 'Selbstgebackene Küchle', false, ''],
        ['eisbecher', 'Eisbecher mit Karamell und Waffel', 'Eisbecher mit Karamell', false, 'center 35%'],
        ['abend', 'Abendstimmung am Armesberg', 'Abendstimmung am Armesberg', false, 'center 40%'],
        ['essen1', 'Gericht mit Bratkartoffeln und Salat', 'Aus unserer Küche', false, ''],
        ['essen2', 'Braten mit Bratkartoffeln', 'Braten mit Bratkartoffeln', false, ''],
    ];
    return array_map(function ($x) {
        return ['id' => 's-' . $x[0], 'kind' => 'static', 'base' => $x[0], 'alt' => $x[1], 'caption' => $x[2], 'wide' => $x[3], 'pos' => $x[4]];
    }, $g);
}

function site_config(): array {
    $c = rv_read_json('site-config', []);
    return [
        'effects'  => is_array($c['effects'] ?? null) ? $c['effects'] : [
            ['id' => 'e-schnee', 'type' => 'schnee', 'from' => '12-01', 'to' => '01-06', 'intensity' => 'mittel', 'on' => false],
            ['id' => 'e-laub', 'type' => 'laub', 'from' => '10-01', 'to' => '11-15', 'intensity' => 'leicht', 'on' => false],
            ['id' => 'e-blueten', 'type' => 'blueten', 'from' => '04-01', 'to' => '05-15', 'intensity' => 'leicht', 'on' => false],
        ],
        'specials' => is_array($c['specials'] ?? null) ? $c['specials'] : [],
        'gallery'  => is_array($c['gallery'] ?? null) ? $c['gallery'] : null,
    ];
}
function site_save(array $c): bool { return rv_write_json('site-config', $c); }

/* Zeitraum „MM-TT“ bis „MM-TT“, jedes Jahr, auch über Silvester */
function site_md_in(string $md, string $from, string $to): bool {
    return $from <= $to ? ($md >= $from && $md <= $to) : ($md >= $from || $md <= $to);
}
function site_effect_active(array $c): ?array {
    $md = substr(site_today(), 5);
    foreach ($c['effects'] as $e) {
        if (!empty($e['on']) && isset(SITE_EFFECTS[$e['type'] ?? '']) && site_md_in($md, (string)$e['from'], (string)$e['to'])) {
            return ['type' => $e['type'], 'intensity' => in_array($e['intensity'] ?? '', SITE_INTENSITY, true) ? $e['intensity'] : 'mittel'];
        }
    }
    return null;
}
function site_special_active(array $s): bool {
    $t = site_today();
    return !empty($s['on']) && (($s['from'] ?? '') === '' || $s['from'] <= $t) && (($s['to'] ?? '') === '' || $s['to'] >= $t);
}

/* Öffentliche Sicht für die Startseite */
function site_public(): array {
    $c = site_config();
    $specials = [];
    foreach ($c['specials'] as $s) if (site_special_active($s)) {
        $specials[] = ['id' => $s['id'], 'title' => $s['title'], 'text' => $s['text'], 'from' => $s['from'], 'to' => $s['to'],
            'pdf' => '/site.php?f=' . rawurlencode($s['file']), 'image' => $s['image'] !== '' ? '/site.php?f=' . rawurlencode($s['image']) : ''];
    }
    $gallery = null;
    if (is_array($c['gallery'])) {
        $gallery = array_map(function ($g) {
            if (($g['kind'] ?? '') === 'static') {
                $large = $g['base'] === 'panorama' ? 900 : ($g['base'] === 'gaststube-ecke' ? 387 : 800);
                $small = $g['base'] === 'panorama' ? 480 : 360;
                return ['id' => $g['id'], 'alt' => $g['alt'], 'caption' => $g['caption'], 'wide' => !empty($g['wide']), 'pos' => (string)($g['pos'] ?? ''),
                    'small' => '/images/' . $g['base'] . '-' . $small . '.webp', 'large' => '/images/' . $g['base'] . '-' . $large . '.webp'];
            }
            return ['id' => $g['id'], 'alt' => $g['alt'], 'caption' => $g['caption'], 'wide' => !empty($g['wide']), 'pos' => (string)($g['pos'] ?? ''),
                'small' => '/site.php?f=' . rawurlencode($g['id'] . '-s.jpg'), 'large' => '/site.php?f=' . rawurlencode($g['id'] . '-l.jpg')];
        }, $c['gallery']);
    }
    return ['ok' => true, 'effect' => site_effect_active($c), 'specials' => $specials, 'gallery' => $gallery];
}

/* Hochgeladene Datei lesen (multipart) */
function site_upload(string $field, int $maxBytes): array {
    $f = $_FILES[$field] ?? null;
    if (!$f || !is_array($f)) return [null, 'Keine Datei erhalten.'];
    if (($f['error'] ?? 0) === UPLOAD_ERR_INI_SIZE || ($f['error'] ?? 0) === UPLOAD_ERR_FORM_SIZE) return [null, 'Die Datei ist zu groß für den Server (Grenze: ' . ini_get('upload_max_filesize') . '). Bitte als Foto hochladen oder die PDF verkleinern.'];
    if (($f['error'] ?? 0) !== UPLOAD_ERR_OK || !is_uploaded_file((string)$f['tmp_name'])) return [null, 'Hochladen fehlgeschlagen.'];
    if ((int)$f['size'] > $maxBytes) return [null, 'Die Datei ist zu groß (höchstens ' . round($maxBytes / 1048576) . ' MB).'];
    return [(string)file_get_contents((string)$f['tmp_name']), null];
}
function site_is_jpeg(string $d): ?array {
    if (strncmp($d, "\xFF\xD8", 2) !== 0) return null;
    $i = @getimagesizefromstring($d);
    return $i && ($i[2] ?? 0) === IMAGETYPE_JPEG ? $i : null;
}
function site_put(string $name, string $data): bool { return tk_save_atomic(site_dir() . '/' . $name, $data); }
function site_rm(string $name): void { if ($name !== '' && preg_match('/^[a-z0-9-]+\.(jpg|pdf)$/', $name)) @unlink(site_dir() . '/' . $name); }

function site_date_or_empty(string $d): string { return rv_valid_date($d) ? $d : ''; }
function site_md(string $v): ?string {
    if (!preg_match('/^(\d{2})-(\d{2})$/', $v, $m)) return null;
    return checkdate((int)$m[1], (int)$m[2], 2024) ? $v : null;
}

/* Admin-Aktionen. Rückgabe [Statuscode, Antwort] oder null, wenn die Aktion nicht hierher gehört. */
function site_admin_action(string $act, array $in): ?array {
    switch ($act) {
        case 'site':
            $c = site_config();
            $gal = $c['gallery'] ?? site_default_gallery();
            return [200, ['ok' => true, 'notice' => tk_notice_get(), 'notice_links' => TK_NOTICE_LINKS, 'tk' => tk_current(),
                'effects' => $c['effects'], 'effect_types' => SITE_EFFECTS, 'specials' => $c['specials'],
                'gallery' => $gal, 'gallery_custom' => is_array($c['gallery']), 'active_effect' => site_effect_active($c),
                'max_upload' => ini_get('upload_max_filesize')]];

        case 'notice_save':
            $e = tk_notice_save((string)($in['text'] ?? ''), (string)($in['link'] ?? ''), (string)($in['until'] ?? ''), (string)($in['url'] ?? ''), (string)($in['label'] ?? ''));
            return $e ? [400, ['ok' => false, 'message' => $e]] : [200, ['ok' => true, 'message' => 'Hinweis gespeichert. Er erscheint sofort auf der Website.']];
        case 'notice_delete':
            tk_notice_delete();
            return [200, ['ok' => true, 'message' => 'Hinweis entfernt.']];

        case 'tk_upload':
            [$raw, $err] = site_upload('file', 8 * 1048576);
            if ($err) return [400, ['ok' => false, 'message' => $err]];
            $e = tk_store((string)$raw, (string)($in['caption'] ?? ''));
            return $e ? [400, ['ok' => false, 'message' => $e]] : [200, ['ok' => true, 'message' => 'Neue Tageskarte ist online.']];
        case 'tk_delete':
            tk_delete();
            return [200, ['ok' => true, 'message' => 'Tageskarte entfernt.']];

        case 'effects_save':
            $out = [];
            foreach ((array)($in['effects'] ?? []) as $e) {
                $type = (string)($e['type'] ?? '');
                $from = site_md((string)($e['from'] ?? '')); $to = site_md((string)($e['to'] ?? ''));
                if (!isset(SITE_EFFECTS[$type])) continue;
                if (!$from || !$to) return [400, ['ok' => false, 'message' => 'Bitte für jeden Effekt einen gültigen Zeitraum angeben.']];
                $out[] = ['id' => preg_match('/^[a-z0-9-]{1,20}$/', (string)($e['id'] ?? '')) ? $e['id'] : 'e-' . site_id(), 'type' => $type,
                    'from' => $from, 'to' => $to, 'intensity' => in_array($e['intensity'] ?? '', SITE_INTENSITY, true) ? $e['intensity'] : 'mittel',
                    'on' => !empty($e['on'])];
            }
            $c = site_config(); $c['effects'] = $out;
            if (!site_save($c)) return [500, ['ok' => false, 'message' => 'Speichern fehlgeschlagen.']];
            $a = site_effect_active($c);
            return [200, ['ok' => true, 'message' => $a ? 'Gespeichert. Heute aktiv: ' . SITE_EFFECTS[$a['type']] . '.' : 'Gespeichert. Heute ist kein Effekt aktiv.', 'active_effect' => $a]];

        case 'special_add':
            $title = rv_clean((string)($in['title'] ?? ''), 60);
            if ((function_exists('mb_strlen') ? mb_strlen($title) : strlen($title)) < 2) return [400, ['ok' => false, 'message' => 'Bitte einen Titel eingeben, z. B. „Weihnachtsmenü“.']];
            [$raw, $err] = site_upload('file', 8 * 1048576);
            if ($err) return [400, ['ok' => false, 'message' => $err]];
            $id = 'sp-' . site_id(); $image = '';
            if (strncmp((string)$raw, '%PDF', 4) === 0) $pdf = $raw;
            elseif ($info = site_is_jpeg((string)$raw)) {
                $pdf = tk_jpeg_to_pdf((string)$raw, (int)$info[0], (int)$info[1], (int)($info['channels'] ?? 3));
                $image = $id . '.jpg';
                if (!site_put($image, (string)$raw)) return [500, ['ok' => false, 'message' => 'Speichern fehlgeschlagen.']];
            } else return [400, ['ok' => false, 'message' => 'Bitte ein Foto oder eine PDF hochladen.']];
            if (!site_put($id . '.pdf', (string)$pdf)) return [500, ['ok' => false, 'message' => 'Speichern fehlgeschlagen.']];
            $c = site_config();
            $c['specials'][] = ['id' => $id, 'title' => $title, 'text' => rv_clean((string)($in['text'] ?? ''), 200),
                'from' => site_date_or_empty((string)($in['from'] ?? '')), 'to' => site_date_or_empty((string)($in['to'] ?? '')),
                'on' => true, 'file' => $id . '.pdf', 'image' => $image, 'created' => date('c')];
            if (!site_save($c)) return [500, ['ok' => false, 'message' => 'Speichern fehlgeschlagen.']];
            return [200, ['ok' => true, 'message' => '„' . $title . '“ angelegt.', 'specials' => $c['specials']]];
        case 'special_update':
            $c = site_config(); $found = false;
            foreach ($c['specials'] as $i => $s) if ($s['id'] === (string)($in['id'] ?? '')) {
                $title = rv_clean((string)($in['title'] ?? $s['title']), 60);
                if ((function_exists('mb_strlen') ? mb_strlen($title) : strlen($title)) < 2) return [400, ['ok' => false, 'message' => 'Bitte einen Titel eingeben.']];
                $c['specials'][$i] = array_merge($s, ['title' => $title, 'text' => rv_clean((string)($in['text'] ?? $s['text']), 200),
                    'from' => site_date_or_empty((string)($in['from'] ?? '')), 'to' => site_date_or_empty((string)($in['to'] ?? '')), 'on' => !empty($in['on'])]);
                $found = true;
            }
            if (!$found) return [404, ['ok' => false, 'message' => 'Nicht gefunden.']];
            if (!site_save($c)) return [500, ['ok' => false, 'message' => 'Speichern fehlgeschlagen.']];
            return [200, ['ok' => true, 'message' => 'Gespeichert.', 'specials' => $c['specials']]];
        case 'special_delete':
            $c = site_config(); $keep = [];
            foreach ($c['specials'] as $s) {
                if ($s['id'] === (string)($in['id'] ?? '')) { site_rm($s['file']); site_rm($s['image']); } else $keep[] = $s;
            }
            $c['specials'] = $keep;
            if (!site_save($c)) return [500, ['ok' => false, 'message' => 'Speichern fehlgeschlagen.']];
            return [200, ['ok' => true, 'message' => 'Sonderkarte gelöscht.', 'specials' => $keep]];

        case 'gallery_add':
            [$large, $err] = site_upload('large', 4 * 1048576);
            if ($err) return [400, ['ok' => false, 'message' => $err]];
            [$small, $err] = site_upload('small', 2 * 1048576);
            if ($err) return [400, ['ok' => false, 'message' => $err]];
            if (!site_is_jpeg((string)$large) || !site_is_jpeg((string)$small)) return [400, ['ok' => false, 'message' => 'Das Bild konnte nicht gelesen werden.']];
            $alt = rv_clean((string)($in['alt'] ?? ''), 120); $cap = rv_clean((string)($in['caption'] ?? ''), 80);
            if ($alt === '') $alt = $cap !== '' ? $cap : 'Foto aus dem Mesnerhaus';
            $id = 'g-' . site_id();
            if (!site_put($id . '-l.jpg', (string)$large) || !site_put($id . '-s.jpg', (string)$small)) return [500, ['ok' => false, 'message' => 'Speichern fehlgeschlagen.']];
            $c = site_config();
            $g = $c['gallery'] ?? site_default_gallery();
            array_unshift($g, ['id' => $id, 'kind' => 'upload', 'alt' => $alt, 'caption' => $cap, 'wide' => false, 'pos' => '']);
            $c['gallery'] = $g;
            if (!site_save($c)) return [500, ['ok' => false, 'message' => 'Speichern fehlgeschlagen.']];
            return [200, ['ok' => true, 'message' => 'Bild hinzugefügt. Es steht jetzt vorne in der Galerie.', 'gallery' => $g, 'gallery_custom' => true]];
        case 'gallery_save':
            $c = site_config();
            $old = [];
            foreach ($c['gallery'] ?? site_default_gallery() as $g) $old[$g['id']] = $g;
            $new = [];
            foreach ((array)($in['items'] ?? []) as $it) {
                $id = (string)($it['id'] ?? '');
                if (!isset($old[$id])) continue;
                $new[] = array_merge($old[$id], ['alt' => rv_clean((string)($it['alt'] ?? $old[$id]['alt']), 120) ?: $old[$id]['alt'],
                    'caption' => rv_clean((string)($it['caption'] ?? ''), 80), 'wide' => !empty($it['wide'])]);
                unset($old[$id]);
            }
            foreach ($old as $g) if (($g['kind'] ?? '') === 'upload') { site_rm($g['id'] . '-l.jpg'); site_rm($g['id'] . '-s.jpg'); }
            $c['gallery'] = $new;
            if (!site_save($c)) return [500, ['ok' => false, 'message' => 'Speichern fehlgeschlagen.']];
            return [200, ['ok' => true, 'message' => 'Galerie gespeichert.', 'gallery' => $new, 'gallery_custom' => true]];
        case 'gallery_reset':
            $c = site_config();
            foreach ($c['gallery'] ?? [] as $g) if (($g['kind'] ?? '') === 'upload') { site_rm($g['id'] . '-l.jpg'); site_rm($g['id'] . '-s.jpg'); }
            $c['gallery'] = null;
            if (!site_save($c)) return [500, ['ok' => false, 'message' => 'Speichern fehlgeschlagen.']];
            return [200, ['ok' => true, 'message' => 'Galerie auf die ursprünglichen Bilder zurückgesetzt.', 'gallery' => site_default_gallery(), 'gallery_custom' => false]];
    }
    return null;
}
