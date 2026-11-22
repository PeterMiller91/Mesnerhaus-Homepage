# Tageskarte hochladen

Die Tageskarte fotografieren und über einen **geheimen Link** hochladen. Sie ist sofort auf der Website:
als Vorschaubild im Bereich „Unsere Tageskarte“ und als PDF zum Herunterladen.
Der Server macht aus dem Foto automatisch eine DIN-A4-PDF. Eine fertige PDF geht auch.
Ohne neuen Build und ohne Git: Die Dateien liegen nur auf dem Server.

## Einmalige Einrichtung (ca. 5 Minuten)

1. **Schlüssel ausdenken:** mindestens 24 zufällige Zeichen, nur Buchstaben und Ziffern,
   z. B. aus einem Passwort-Manager (Sonderzeichen ausschalten).
2. **Config auf dem Server anlegen:** In Plesk im Dateimanager den Repo-Ordner der Subdomain
   `landing.mesnerhausarmesberg.de` öffnen (dort liegen `package.json`, `out/` und `server/`).
   `server/mesnerhaus-config.example.php` in diesen Ordner kopieren und in `mesnerhaus-config.php` umbenennen.
   Bei `upload_key` den Schlüssel eintragen. Gibt es die Datei schon (vom Telegram-Versuch), dort einfach die Zeile
   `'upload_key' => '...',` ergänzen.
3. **Link aufrufen:**
   ```
   https://mesnerhausarmesberg.de/tageskarte-upload.php?k=DEIN-SCHLÜSSEL
   ```
   Als Lesezeichen oder auf dem Handy-Startbildschirm speichern („Zum Startbildschirm hinzufügen“).

## Benutzung

1. Link öffnen → „Foto aufnehmen oder auswählen“ antippen → Karte fotografieren.
2. Optional eine Überschrift eintragen, z. B. „Sonntag, 22. November“.
3. „Hochladen“ tippen. Fertig.

Unter „Gerade online“ sieht man die aktuelle Karte und kann sie mit „Von der Website entfernen“ wieder abnehmen.
Fotos werden schon im Handy auf eine sinnvolle Größe verkleinert (auch iPhone-Fotos), damit der Upload schnell geht.

**Tipps fürs Foto:** Karte flach hinlegen, von oben fotografieren, gutes Licht.

## Hinweis-Banner

Auf derselben Seite gibt es unten den Bereich **„Hinweis-Banner“**. Der Text erscheint als grüne Leiste ganz oben
auf der Website, z. B. „Am 24. und 25. Dezember geschlossen“.

- **Text:** höchstens 160 Zeichen.
- **Link (optional):** Zur Tageskarte, Tisch anfragen, Anfahrt, Anrufen oder **Eigener Link** (beliebige Adresse wie `https://…` oder `/datenschutz/`, mit eigenem Link-Text bis 40 Zeichen; externe Links öffnen in einem neuen Tab).
- **Anzeigen bis (optional):** Nach diesem Tag verschwindet der Banner automatisch. Ohne Datum bleibt er, bis man ihn entfernt.
- Besucher können den Banner wegklicken. Er bleibt dann bis zum Schließen des Browsers ausgeblendet, bei einem neuen Text erscheint er wieder.

Gespeichert wird in `hinweis.json` im selben Speicherordner wie die Tageskarte, ausgeliefert über `/hinweis.php`.

## Was die Website zeigt

- Karte vorhanden: Vorschaubild, Überschrift, Button „Als PDF herunterladen“.
- Karte älter als 7 Tage: „Letzte Tageskarte“ mit Hinweis zum Anrufen.
- Keine Karte: „Die nächste Tageskarte folgt in Kürze“ mit Telefon und WhatsApp.

## Technik

```
Upload-Seite  →  /tageskarte-upload.php?k=…      (nur mit richtigem Schlüssel, sonst 404)
                  └─ speichert in <repo>/storage/ (außerhalb von out/):
                       tageskarte.pdf  · tageskarte.jpg (Vorschau) · tageskarte.json (Überschrift)
Besucher      →  /tageskarte.php        → PDF
                 /tageskarte.php?bild   → Vorschaubild
                 /tageskarte.php?info   → Datum + Überschrift (für die Website)
Gemeinsame Logik: out/_tk/tageskarte-lib.php (Quelle: public/_tk/)
```

Die vorherige Version wird als `storage/tageskarte-vorher.pdf` aufbewahrt.

## Sicherheit

- Ohne den richtigen Schlüssel antwortet die Upload-Seite mit „Nicht gefunden“ (404) und bremst Rateversuche.
- Die Seite ist für Suchmaschinen gesperrt (`noindex`).
- Angenommen werden JPEG-Fotos, PDFs und, falls GD installiert ist, PNG/WebP. Max. 20 MB.
- `mesnerhaus-config.php` und der Speicherordner sind in `.gitignore`. Bevorzugt liegen sie neben `out/`. Darf PHP dort nicht lesen (`open_basedir`), funktioniert auch `out/mesnerhaus-config.php`, gespeichert wird dann in `out/tageskarte-daten/`.
- Wurde der Link weitergegeben: einfach einen neuen `upload_key` eintragen, der alte Link ist dann ungültig.

## Fehlersuche

| Symptom | Ursache / Lösung |
|---|---|
| „Upload ist noch nicht eingerichtet“ | Die Seite zeigt, wo sie gesucht hat. Liegt die Datei neben `out/` und wird trotzdem nicht gefunden, darf PHP dort nicht lesen: Datei einfach in den Ordner `out/` verschieben. |
| „Nicht gefunden“ | Schlüssel im Link stimmt nicht genau mit `upload_key` überein (Groß-/Kleinschreibung, Leerzeichen). |
| „Serverfehler: Speicherordner …“ | PHP darf im Repo-Ordner keinen Ordner `storage` anlegen. In Plesk den Ordner `storage` von Hand anlegen. |
| „Datei zu groß für den Server“ | Nur bei großen PDFs. In Plesk unter PHP-Einstellungen `upload_max_filesize` und `post_max_size` auf 20M stellen. |

## Optional: Upload per Telegram-Bot

Der Webhook `/api/telegram-tageskarte.php` funktioniert weiterhin, wenn `telegram_bot_token`,
`telegram_webhook_secret` und `telegram_allowed_chat_ids` in der Config stehen. Webhook setzen:
```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://landing.mesnerhausarmesberg.de/api/telegram-tageskarte.php&secret_token=<SECRET>&allowed_updates=["message"]
```
Befehle: Foto/PDF senden, `/status`, `/loeschen`, `/start` (zeigt die Chat-ID).

## Browser-Cache und Komprimierung

`public/.htaccess` (landet beim Build in `out/.htaccess`) setzt die Cache-Zeiten für Apache:
Next.js-Dateien unter `/_next/static/` 1 Jahr (`immutable`, Dateinamen enthalten einen Hash),
Bilder/Schriften 30 Tage, HTML-Seiten `no-cache`; dazu gzip für Text-Dateien.
Falls nach einem Pull die Seite einen 500-Fehler zeigt, erlaubt der Server diese Anweisungen nicht:
dann `out/.htaccess` löschen und Bescheid geben.
