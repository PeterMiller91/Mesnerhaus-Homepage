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

## E-Mails

Versand über PHPs `mail()` des Servers mit Absender `kontakt@mesnerhausarmesberg.de`.
Anderer Absender: in `mesnerhaus-config.php` `'mail_from' => 'reservierung@…'` eintragen.
Kommen E-Mails nicht an oder landen im Spam: in Plesk unter „Mail“ prüfen, dass die Domain Mails versenden darf
(SPF/DKIM aktiv).

## Dateien

| Datei | Zweck |
|---|---|
| `public/api/reservierung.php` | Schnittstelle für die Website (freie Tage/Zeiten, Buchen) |
| `public/reservierung-stornieren.php` | Storno-Seite für Gäste (Link aus der Bestätigungsmail) |
| `src/app/reservierungen/page.tsx` | Gästeseite mit Buchung und Team-Login (`TeamLogin`) |
| `public/reservierungen/verwaltung/` | Verwaltungs-App (index.php, api.php, app.js, app.css) |
| `public/_tk/resv-lib.php` | Gemeinsame Logik (Speicher, Platzberechnung, Logins, E-Mails) |
| `src/components/OnlineBooking.tsx` | Buchungsformular auf der Website (Rückfall: altes WhatsApp/E-Mail-Formular) |
