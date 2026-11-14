# Speisekarte per Telegram-Bot hochladen

Eine PDF an den Bot schicken, und sie ist sofort als „Aktuelle Speisekarte (PDF)“ auf der Website.
Ohne neuen Build und ohne Git: Die Datei liegt nur auf dem Server.

## Wie es funktioniert

```
Telegram  →  https://<domain>/api/telegram-speisekarte.php   (Webhook, PHP)
                  └─ speichert  <repo>/storage/speisekarte.pdf  (außerhalb von out/)
Besucher  →  https://<domain>/speisekarte.php  →  liefert die PDF aus
Website   →  Button erscheint nur, wenn eine PDF vorhanden ist (mit „Stand: …“)
```

Die vorherige Version wird als `storage/speisekarte-vorher.pdf` aufbewahrt.

## Einmalige Einrichtung (ca. 10 Minuten)

1. **Bot anlegen:** In Telegram `@BotFather` öffnen, `/newbot` senden, Namen vergeben, dann den **Token** kopieren.
2. **Config auf dem Server anlegen:** In Plesk im Dateimanager in die Repo-Wurzel wechseln
   (der Ordner, in dem `package.json` und `out/` liegen).
   `server/mesnerhaus-config.example.php` dorthin kopieren und in `mesnerhaus-config.php` umbenennen.
   Dann Token, ein langes zufälliges Secret und `site_url` eintragen.
3. **Webhook registrieren:** Einmal im Browser aufrufen (Token und Secret einsetzen):
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<domain>/api/telegram-speisekarte.php&secret_token=<SECRET>&allowed_updates=["message"]
   ```
   Antwort muss `"ok":true` enthalten.
4. **Freischalten:** Dem Bot `/start` schreiben. Er antwortet mit der **Chat-ID**.
   Diese in `telegram_allowed_chat_ids` eintragen (mehrere Personen möglich).
5. **Testen:** `/start` erneut senden, dann eine PDF schicken. Der Bot bestätigt den Upload.

## Befehle

| Befehl     | Wirkung                                   |
|------------|-------------------------------------------|
| PDF senden | wird zur neuen Speisekarte                |
| `/status`  | zeigt Datum und Größe der aktuellen Karte |
| `/start`   | Begrüßung bzw. eigene Chat-ID             |

## Sicherheit

- Der Webhook akzeptiert nur Anfragen mit dem geheimen `secret_token` (prüft Telegram-Header).
- Nur freigeschaltete Chat-IDs dürfen hochladen. Alle anderen werden ignoriert.
- Es werden nur echte PDFs angenommen (Endung/Typ und `%PDF`-Signatur), max. 20 MB.
- `mesnerhaus-config.php` und `storage/` sind in `.gitignore` und liegen außerhalb des Webroots `out/`.

## Voraussetzung

PHP 8 auf dem Webspace (bei netcup/Plesk Standard) mit `allow_url_fopen = On`.
