# Reservierungen

Online-Buchung auf der Website und eine Verwaltungs-App für Inhaberin und Theke/Empfang.
Läuft komplett auf dem eigenen Webserver (PHP), ohne Datenbank-Server und ohne fremde Dienste.

## Einrichtung (einmalig, ca. 3 Minuten)

1. In Plesk bei der Domain unter **Git** auf „Pull“ klicken.
2. `https://mesnerhausarmesberg.de/reservierungen/verwaltung/` öffnen.
3. Die Seite „Reservierungen einrichten“ fragt nach dem **Schlüssel aus dem Tageskarten-Link** (`upload_key`)
   und legt zwei Zugänge an:
   - **dein Zugang** (Admin: darf alles, auch Einstellungen)
   - **Theke/Empfang** (darf Reservierungen ansehen, eintragen, ändern)
   Passwörter: mindestens 10 Zeichen.
4. Fertig. Künftig meldest du dich unten auf der Gästeseite `/reservierungen/` im Feld
   **„Anmeldung für das Mesnerhaus-Team“** an und landest direkt in der Verwaltung.
   Auf dem Handy die Verwaltung über „Zum Startbildschirm hinzufügen“ wie eine App ablegen.

## Adressen

| Adresse | Für wen |
|---|---|
| `/reservierungen/` | Gäste: Online-Buchung. Unten das Team-Login. Alle Reservieren-Buttons der Startseite führen hierher. |
| `/reservierungen/verwaltung/` | Team: Verwaltung (ohne Anmeldung geht es zurück zum Login auf der Gästeseite) |
| `/reservierung-stornieren.php?t=…` | Gäste: Storno-Link aus der Bestätigungsmail |

## So funktioniert es

**Gäste (`/reservierungen/`)**
- wählen Personen (1–8), einen Öffnungstag und eine freie Uhrzeit. Volle Zeiten sind durchgestrichen.
- Ist Platz frei, ist die Reservierung **sofort bestätigt**. Der Gast bekommt eine E-Mail mit Storno-Link.
- Ab 9 Personen: Hinweis auf Telefon/WhatsApp.

**Verwaltung (`/reservierungen/verwaltung/`)**
- Tagesansicht mit Kennzahlen, Ablauf nach Uhrzeit und Belegung je halbe Stunde.
- Neue Online-Reservierungen erscheinen oben als Hinweis, bis man sie öffnet oder „Alle gesehen“ tippt.
- **Eintragen** für Telefon, WhatsApp, E-Mail oder Gäste vor Ort. Bei Überbuchung kommt eine Warnung, „Trotzdem eintragen“ ist möglich.
- In jeder Reservierung: Anrufen, fertige WhatsApp-Bestätigung, Tisch, Notiz, Status (Bestätigt, Da, Storniert …).
- „Da“-Knopf, wenn Gäste angekommen sind.
- **Drucken** gibt eine schlichte Tagesliste aus.
- Die App aktualisiert sich jede Minute von selbst.
- Bei jeder Online-Reservierung und jedem Gast-Storno kommt eine E-Mail an die Kontaktadresse (änderbar in den Einstellungen).

**Einstellungen (nur Admin)**
Plätze gesamt / davon online, größte Gruppe online, Dauer pro Reservierung, Raster, Vorlauf,
wie weit im Voraus buchbar, Öffnungstage mit letzter Ankunftszeit, geschlossene Tage (Urlaub, Feiertage),
Online-Buchung pausieren, Passwörter der Zugänge.

Standardwerte: 54 Plätze, 2 Stunden pro Tisch, bis 8 Personen online, sonntags 11–17 Uhr (letzte Ankunft 15:30),
Online-Buchung bis 2 Stunden vorher, 60 Tage im Voraus.

## Platzberechnung

Eine Reservierung belegt ihre Plätze für die eingestellte Dauer. Für eine neue Buchung wird im
15-Minuten-Takt über den ganzen Zeitraum geprüft, ob noch genug Plätze frei sind.
Online zählt „davon online“, beim Eintragen in der App „Plätze gesamt“.

## Daten & Sicherheit

- Gespeichert in `resv-*.php` im Speicherordner der Tageskarte (`storage/` oder `out/tageskarte-daten/`).
  Die Dateien beginnen mit einer PHP-Sperre und liefern im Browser nur eine leere 404-Seite.
- Reservierungen werden **60 Tage nach dem Termin automatisch gelöscht**.
- Passwörter nur als sichere Hashes. Nach 8 Fehlversuchen in 15 Minuten ist die Anmeldung gesperrt.
- Online-Buchung: Spamschutz (unsichtbares Feld, Mindestzeit), höchstens 5 Buchungen je Anschluss und Stunde.
- Admin-Seiten: Login-Pflicht, CSRF-Schutz, strenge Content-Security-Policy, nicht in Suchmaschinen.

## Push-Benachrichtigungen aufs Handy

Bei jeder neuen Online-Reservierung (und auf Wunsch bei Gast-Stornos) bekommt das Handy eine Benachrichtigung,
auch wenn die App geschlossen ist. Ohne fremde Dienste: Der Server schickt eine leere Push-Nachricht über den
Push-Dienst des Handys (Apple/Google), das Handy holt den Text dann bei `/reservierungen/verwaltung/push.php` ab.

**Einrichten (je Handy einmal):**

*iPhone (ab iOS 16.4):*
1. In **Safari** `mesnerhausarmesberg.de/reservierungen/verwaltung/` öffnen und anmelden.
2. **Teilen** → **„Zum Home-Bildschirm“**.
3. Die App **über das neue Symbol** öffnen (wichtig, nicht über Safari) und anmelden.
4. Menü (☰) → **Benachrichtigungen** → **„Auf diesem Gerät aktivieren“** → Benachrichtigungen erlauben.
   Es kommt sofort eine Test-Benachrichtigung.

*Android (Chrome):*
1. Verwaltung in Chrome öffnen, anmelden, Menü (⋮) → **„Zum Startbildschirm hinzufügen“** (optional, aber praktisch).
2. Menü (☰) → **Benachrichtigungen** → **„Auf diesem Gerät aktivieren“** → erlauben.

Im selben Dialog: Auswahl „neue Online-Reservierung“ / „Storno durch den Gast“, „Test senden“ und Liste der eigenen
Geräte mit „Entfernen“. Abgemeldete Geräte entfernt der Server automatisch.

Die Anmeldung bleibt auf jedem Gerät **30 Tage** bestehen (Sitzungen im Speicherordner unter `sessions/`).

**Klappt nicht?** iPhone: wirklich über das Home-Bildschirm-Symbol geöffnet? Einstellungen → Mitteilungen →
„Reservierungen“ erlaubt? Android: Chrome-Benachrichtigungen für die Seite erlaubt, Energiesparmodus aus?

## Tischplan

In der Verwaltung oben **„Liste“ | „Tischplan“** umschalten. Die Wahl merkt sich jedes Gerät.

- **Uhrzeit wählen** (Leiste über dem Plan): Jeder Tisch zeigt, ob er zu dieser Zeit frei (weiß), reserviert (grün),
  mit Gästen besetzt (blau, nach „Da“) oder doppelt belegt (rot umrandet) ist.
- **Belegten Tisch antippen** → die Reservierung öffnet sich.
- **Freien Tisch antippen** → eine Reservierung ohne Tisch zuweisen oder „Neue Reservierung hier“.
- **Zuweisen per Liste:** Unter dem Plan stehen alle Reservierungen „Ohne Tisch“. Eine antippen, dann einen oder
  mehrere Tische im Plan antippen (zusammengestellte Tische für Gruppen), „Fertig“.
- **Automatisch zuweisen:** verteilt alle offenen Reservierungen des Tages auf den kleinsten passenden freien Tisch,
  notfalls auf zwei Tische im selben Bereich.
- Im Bearbeiten-Dialog einer Reservierung gibt es ebenfalls die Tischauswahl. Zu dieser Zeit belegte Tische sind grau.
- **Doppelbelegungen** (gleicher Tisch, überlappende Zeit) lehnt der Server ab.

**Plan bearbeiten (nur Admin):** „Bearbeiten“ → Tische ziehen, antippen für Nummer, Plätze, Form (eckig/rund),
Größe und Bereich (Gaststube/Terrasse), „+ Tisch“, „Tisch löschen“, „Plan speichern“. Die Summe der Plätze wird mit
den Einstellungen verglichen. Anfangs ist ein **Beispielplan** (11 Tische, 54 Plätze) hinterlegt.
Gespeichert in `resv-tables.php`.

## E-Mail-Vorlagen

Verwaltung → Menü (☰) → **E-Mail-Vorlagen** (nur Admin). Bearbeitbar sind Betreff und Text von:

- **Bestätigung an den Gast** (nach jeder Buchung, online oder beim Eintragen mit Häkchen „Bestätigung senden“)
- **Storno-Bestätigung an den Gast** (wenn der Gast über den Link storniert, oder beim Stornieren in der App mit Häkchen „Gast per E-Mail informieren“)

Platzhalter: `{name}`, `{datum}`, `{uhrzeit}`, `{personen}`, `{wunsch}`, `{storno_link}`, `{telefon}`, `{adresse}`.
Eine Zeile, deren Platzhalter leer ist (z. B. „Ihr Wunsch: {wunsch}“ ohne Wunsch), wird weggelassen.
Live-Vorschau mit Beispieldaten, „Test senden“ und „Standard wiederherstellen“ sind eingebaut.
Gespeichert in `resv-templates.php` im Speicherordner.

## E-Mails

Zwei Versandwege:

1. **SMTP über das echte Postfach (empfohlen).** In `mesnerhaus-config.php` eintragen (Daten wie im Mailprogramm, „Postausgangsserver“):
   ```php
   'smtp_host'   => 'mail.beispiel.de',
   'smtp_port'   => 587,          // 587 = STARTTLS, 465 = SSL
   'smtp_secure' => 'tls',        // 'tls' bei 587, 'ssl' bei 465
   'smtp_user'   => 'kontakt@mesnerhausarmesberg.de',
   'smtp_pass'   => 'Passwort des Postfachs',
   ```
2. **Ohne SMTP-Angaben:** PHP `mail()` des Webservers. Kommt oft nicht an oder landet im Spam,
   besonders wenn das Postfach nicht auf demselben Server liegt.

**Prüfen:** Verwaltung → Menü → Einstellungen → **E-Mail-Versand** → „Test-E-Mail senden“.
Dort stehen Versandweg, Absender, das Ergebnis mit genauer Fehlermeldung und die letzten 8 Versuche
(Empfänger gekürzt, ohne Inhalt).

Typische Fehlermeldungen:

| Meldung | Bedeutung |
|---|---|
| PHP mail() meldet einen Fehler | Webserver darf/kann nicht selbst versenden → SMTP eintragen |
| SMTP: Keine Verbindung zu … | Servername oder Port falsch, oder der Hoster sperrt ausgehende Verbindungen auf diesem Port (dann 465 statt 587 probieren) |
| SMTP: Anmeldung fehlgeschlagen | Benutzername oder Passwort falsch |
| SMTP: TLS-Verschlüsselung fehlgeschlagen | Port/Verschlüsselung passen nicht zusammen (587 ↔ tls, 465 ↔ ssl) |
| angenommen, aber nichts im Postfach | Spam-Ordner prüfen; bei Versand über den Webserver SPF/DKIM in Plesk aktivieren |

## Dateien

| Datei | Zweck |
|---|---|
| `public/api/reservierung.php` | Schnittstelle für die Website (freie Tage/Zeiten, Buchen) |
| `public/reservierung-stornieren.php` | Storno-Seite für Gäste (Link aus der Bestätigungsmail) |
| `src/app/reservierungen/page.tsx` | Gästeseite mit Buchung und Team-Login (`TeamLogin`) |
| `public/reservierungen/verwaltung/` | Verwaltungs-App (index.php, api.php, app.js, app.css) |
| `public/_tk/resv-lib.php` | Gemeinsame Logik (Speicher, Platzberechnung, Logins, E-Mails) |
| `src/components/OnlineBooking.tsx` | Buchungsformular auf der Website (Rückfall: altes WhatsApp/E-Mail-Formular) |
