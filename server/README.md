# Tageskarte per Telegram-Bot hochladen

Die Tageskarte fotografieren und das Foto an den Bot schicken. Sie ist sofort auf der Website:
als Vorschaubild im Bereich „Unsere Tageskarte“ und als PDF zum Herunterladen.
Der Server macht aus dem Foto automatisch eine DIN-A4-PDF. Eine fertige PDF geht auch.
Ohne neuen Build und ohne Git: Die Dateien liegen nur auf dem Server.

## Wie es funktioniert

```
Telegram  →  https://landing.mesnerhausarmesberg.de/api/telegram-tageskarte.php   (Webhook, PHP)
                  └─ speichert in <repo>/storage/ (außerhalb von out/):
                       tageskarte.pdf   (aus dem Foto erzeugt oder direkt hochgeladen)
                       tageskarte.jpg   (Vorschaubild, nur bei Fotos)
                       tageskarte.json  (Bildunterschrift, z. B. „Sonntag 15.11.“)
Besucher  →  https://landing.mesnerhausarmesberg.de/tageskarte.php        → PDF
             https://landing.mesnerhausarmesberg.de/tageskarte.php?bild   → Vorschaubild
             https://landing.mesnerhausarmesberg.de/tageskarte.php?info   → Datum + Bildunterschrift (für die Website)
```

Die vorherige Version wird als `storage/tageskarte-vorher.pdf` aufbewahrt.
Ist die Karte älter als 7 Tage, steht auf der Website „Letzte Tageskarte“ mit Hinweis zum Anrufen.
Ohne Karte zeigt die Website „Die nächste Tageskarte folgt in Kürze“.

## Einmalige Einrichtung (ca. 10 Minuten)

1. **Bot anlegen:** In Telegram `@BotFather` öffnen, `/newbot` senden, Namen vergeben, dann den **Token** kopieren.
2. **Config auf dem Server anlegen:** In Plesk im Dateimanager in die Repo-Wurzel wechseln
   (der Ordner, in dem `package.json` und `out/` liegen).
   `server/mesnerhaus-config.example.php` dorthin kopieren und in `mesnerhaus-config.php` umbenennen.
   Dann Token, ein langes zufälliges Secret und `site_url` eintragen.
3. **Webhook registrieren:** Einmal im Browser aufrufen (Token und Secret einsetzen):
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://landing.mesnerhausarmesberg.de/api/telegram-tageskarte.php&secret_token=<SECRET>&allowed_updates=["message"]
   ```
   Antwort muss `"ok":true` enthalten.
4. **Freischalten:** Dem Bot `/start` schreiben. Er antwortet mit der **Chat-ID**.
   Diese in `telegram_allowed_chat_ids` eintragen (mehrere Personen möglich).
5. **Testen:** `/start` erneut senden, dann ein Foto der Tageskarte schicken. Der Bot bestätigt den Upload.

## Befehle

| Befehl     | Wirkung                                   |
|------------|-------------------------------------------|
| Foto senden | wird zur neuen Tageskarte (Bildunterschrift wird als Überschrift angezeigt) |
| PDF senden  | wird direkt als Tageskarte übernommen (ohne Vorschaubild)                   |
| `/status`   | zeigt, seit wann die aktuelle Karte online ist                              |
| `/loeschen` | nimmt die Tageskarte von der Website                                        |
| `/start`    | Hilfe bzw. eigene Chat-ID                                                   |

**Tipps fürs Foto:** Karte flach hinlegen, von oben fotografieren, gutes Licht.
Wer die volle Auflösung will, schickt das Bild über Büroklammer → Datei statt als normales Foto.

## Sicherheit

- Der Webhook akzeptiert nur Anfragen mit dem geheimen `secret_token` (prüft Telegram-Header).
- Nur freigeschaltete Chat-IDs dürfen hochladen. Alle anderen werden ignoriert.
- Angenommen werden nur JPEG-Fotos, PDFs (`%PDF`-Signatur) und, falls GD installiert ist, PNG/WebP. Max. 20 MB.
- `mesnerhaus-config.php` und `storage/` sind in `.gitignore` und liegen außerhalb des Webroots `out/`.

## Voraussetzung

PHP 8 auf dem Webspace (bei netcup/Plesk Standard) mit `allow_url_fopen = On`.

## Fehlersuche

| Symptom | Ursache / Lösung |
|---|---|
| `/api/telegram-tageskarte.php` liefert **503** | `mesnerhaus-config.php` fehlt, heißt noch `.example.php` oder liegt nicht direkt über `out/`. Oder `open_basedir` erlaubt nur `{DOCROOT}`: auf `{WEBSPACEROOT}{/}{:}{TMP}{/}` stellen. |
| Liefert **403** beim Test im Browser | Normal, nur Telegram mit dem Secret darf dort senden. |
| Bot antwortet gar nicht | `getWebhookInfo` aufrufen und `url` sowie `last_error_message` prüfen. Webhook ggf. neu setzen. |
| Bot antwortet, aber nichts auf der Seite | Chat-ID fehlt in `telegram_allowed_chat_ids`. Oder der Ordner `storage/` ist nicht beschreibbar. |

Prüfen: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
