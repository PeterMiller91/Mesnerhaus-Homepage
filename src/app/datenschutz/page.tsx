import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import CookieSettingsLink from "@/components/CookieSettingsLink";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – Mesnerhaus am Armesberg",
  robots: { index: true, follow: true },
};

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

const toc = [
  ["verantwortlicher", "Verantwortliche Stelle"],
  ["ueberblick", "Datenschutz auf einen Blick"],
  ["hosting", "Hosting"],
  ["logfiles", "Server-Logfiles"],
  ["verschluesselung", "SSL-/TLS-Verschlüsselung"],
  ["cookies", "Cookies und Einwilligungen"],
  ["google-maps", "Google Maps"],
  ["wetter", "Wetterdaten"],
  ["schriften", "Schriftarten"],
  ["kontakt", "Kontakt und Tischanfrage"],
  ["reservierung", "Online-Reservierung"],
  ["whatsapp", "WhatsApp"],
  ["links", "Links zu anderen Anbietern"],
  ["bewertungen", "Gästebewertungen"],
  ["speicherdauer", "Speicherdauer"],
  ["rechte", "Ihre Rechte"],
  ["beschwerde", "Beschwerderecht"],
] as const;

export default function Datenschutz() {
  return (
    <LegalPage title="Datenschutzerklärung" updated="November 2026">
      <nav aria-label="Inhalt" className="box">
        <p><strong>Inhalt</strong></p>
        <ol className="toc list-decimal pl-5">
          {toc.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}
        </ol>
      </nav>

      <h2 id="verantwortlicher">1. Verantwortliche Stelle</h2>
      <p>Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:</p>
      <address>
        Birgit Schultes<br />
        Gaststätte Mesnerhaus Armesberg<br />
        Trevesen 141<br />
        95704 Pullenreuth<br />
        Telefon: <a href="tel:+4992346611">09234 6611</a><br />
        E-Mail: <a href="mailto:datenschutz@mesnerhausarmesberg.de">datenschutz@mesnerhausarmesberg.de</a>
      </address>
      <p>
        Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der
        Verarbeitung von personenbezogenen Daten (z. B. Namen, E-Mail-Adressen o. Ä.) entscheidet.
      </p>

      <h2 id="ueberblick">2. Datenschutz auf einen Blick</h2>
      <p>
        Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Wir halten die Datenverarbeitung auf dieser
        Website bewusst gering:
      </p>
      <ul>
        <li>Wir setzen <strong>keine</strong> Analyse-, Tracking- oder Werbedienste ein und erstellen keine Nutzerprofile.</li>
        <li>Online-Reservierungen speichern wir nur auf unserem eigenen Server und löschen sie 60 Tage nach dem Termin automatisch (siehe „Online-Reservierung“).</li>
        <li>Eine Karte von Google Maps wird nur geladen, wenn Sie ausdrücklich einwilligen.</li>
        <li>Beim Aufruf der Website verarbeitet unser Hoster technisch notwendige Zugriffsdaten (siehe „Server-Logfiles“).</li>
      </ul>

      <h2 id="hosting">3. Hosting</h2>
      <p>
        Diese Website wird bei der netcup GmbH, Daimlerstraße 25, 76185 Karlsruhe, Deutschland, gehostet. Wenn Sie unsere Website besuchen,
        werden die unter „Server-Logfiles“ genannten Daten auf den Servern des Hosters verarbeitet. Die Server stehen in Deutschland.
      </p>
      <p>
        Die Nutzung des Hosters erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt in einer sicheren,
        schnellen und zuverlässigen Bereitstellung unserer Website. Mit dem Hoster besteht ein Vertrag über Auftragsverarbeitung nach Art. 28 DSGVO.
        Weitere Informationen: <a href="https://www.netcup.com/de/kontakt/datenschutzerklaerung" {...ext}>Datenschutzerklärung von netcup</a>.
      </p>

      <h2 id="logfiles">4. Server-Logfiles</h2>
      <p>Bei jedem Aufruf der Website werden automatisch Informationen in sogenannten Server-Logfiles gespeichert, die Ihr Browser übermittelt:</p>
      <ul>
        <li>IP-Adresse des anfragenden Geräts</li>
        <li>Datum und Uhrzeit des Zugriffs</li>
        <li>aufgerufene Seite bzw. Datei und übertragene Datenmenge</li>
        <li>Browsertyp und -version, Betriebssystem</li>
        <li>Referrer-URL (die zuvor besuchte Seite)</li>
      </ul>
      <p>
        Diese Daten werden nicht mit anderen Datenquellen zusammengeführt. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
        Unser berechtigtes Interesse ist der technisch fehlerfreie Betrieb, die Sicherheit und die Abwehr von Angriffen. Die Logfiles werden
        nach Ablauf der vom Hoster vorgesehenen Frist automatisch gelöscht, sofern sie nicht zur Aufklärung eines konkreten Sicherheitsvorfalls
        benötigt werden.
      </p>

      <h2 id="verschluesselung">5. SSL-/TLS-Verschlüsselung</h2>
      <p>
        Diese Seite nutzt aus Sicherheitsgründen eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die
        Adresszeile des Browsers mit „https://“ beginnt und ein Schloss-Symbol angezeigt wird. Wenn die Verschlüsselung aktiv ist, können die
        Daten, die Sie an uns übermitteln, nicht von Dritten mitgelesen werden.
      </p>

      <h2 id="cookies">6. Cookies, lokale Speicherung und Einwilligungen</h2>
      <p>
        Diese Website setzt <strong>keine Cookies</strong>. Um Ihre Entscheidung im Datenschutz-Banner zu speichern, legen wir im lokalen Speicher
        Ihres Browsers (localStorage) einen Eintrag mit dem Namen <code>mh-consent</code> an. Er enthält nur Ihre Auswahl (z. B. „Google Maps:
        ja/nein“), den Zeitpunkt und eine Versionsnummer. Der Eintrag verlässt Ihr Gerät nicht und bleibt gespeichert, bis Sie ihn in Ihrem
        Browser löschen.
      </p>
      <p>
        Wenn Sie den Hinweis-Banner oben auf der Seite schließen, merken wir uns das für die Dauer Ihrer Browser-Sitzung im Sitzungsspeicher
        (sessionStorage, Eintrag <code>mh-hinweis-zu</code>). Der Eintrag enthält nur den Zeitstempel des Hinweises, verlässt Ihr Gerät nicht und
        wird beim Schließen des Browsers automatisch gelöscht. Die Speicherung ist für die von Ihnen gewünschte Funktion unbedingt erforderlich
        (§ 25 Abs. 2 Nr. 2 TDDDG).
      </p>
      <p>
        Die Speicherung ist unbedingt erforderlich, damit wir Ihre Entscheidung beachten können (§ 25 Abs. 2 Nr. 2 TDDDG). Rechtsgrundlage für die
        Verarbeitung ist Art. 6 Abs. 1 lit. c DSGVO in Verbindung mit Art. 7 Abs. 1 DSGVO (Nachweis der Einwilligung).
      </p>
      <div className="box">
        <p className="!mb-2">
          <strong>Einwilligung ändern oder widerrufen:</strong> Sie können Ihre Auswahl jederzeit mit Wirkung für die Zukunft ändern.
        </p>
        <CookieSettingsLink className="inline-flex px-5 py-2.5 rounded-full bg-[var(--color-brand-dark)] text-white font-bold text-sm hover:bg-[var(--color-brand-deeper)] transition-colors" />
      </div>

      <p>
        <strong>Ausnahme Team-Anmeldung:</strong> Nur wenn sich Mitarbeiterinnen und Mitarbeiter des Mesnerhaus unten auf der Reservierungsseite
        anmelden, setzt die Verwaltung ein technisch notwendiges Sitzungs-Cookie (<code>mh_resv</code>, gültig für den Pfad
        <code>/reservierungen/verwaltung/</code>, höchstens 30 Tage). Es dient allein der Anmeldung (§ 25 Abs. 2 Nr. 2 TDDDG). Gäste erhalten
        dieses Cookie nicht.
      </p>

      <h2 id="google-maps">7. Google Maps</h2>
      <p>
        Im Bereich „Anfahrt“ können Sie eine interaktive Karte von Google Maps anzeigen lassen. Anbieter ist die Google Ireland Limited,
        Gordon House, Barrow Street, Dublin 4, Irland („Google“).
      </p>
      <p>
        <strong>Die Karte wird nur geladen, wenn Sie einwilligen</strong>, entweder im Datenschutz-Banner oder über die Schaltfläche „Karte laden“.
        Vorher wird keine Verbindung zu Google aufgebaut. Nach Ihrer Einwilligung werden Daten wie Ihre IP-Adresse, Datum und Uhrzeit, die
        aufgerufene Seite sowie Browser- und Geräteinformationen an Google übertragen. Google kann dabei Cookies oder ähnliche Technologien
        einsetzen und die Daten mit anderen Google-Diensten verknüpfen, insbesondere wenn Sie in einem Google-Konto angemeldet sind.
      </p>
      <p>
        Rechtsgrundlage ist Ihre Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG. Die Einwilligung ist jederzeit über die
        „Cookie-Einstellungen“ widerrufbar.
      </p>
      <p>
        Die Daten können auch an die Google LLC in den USA übertragen werden. Google LLC ist nach dem EU-US Data Privacy Framework zertifiziert.
        Für die USA besteht damit ein Angemessenheitsbeschluss der EU-Kommission (Art. 45 DSGVO). Weitere Informationen:{" "}
        <a href="https://policies.google.com/privacy?hl=de" {...ext}>Datenschutzerklärung von Google</a> und{" "}
        <a href="https://www.dataprivacyframework.gov/list" {...ext}>Data Privacy Framework</a>.
      </p>

      <h2 id="wetter">8. Wetterdaten</h2>
      <p>
        Die Wettervorhersage für den Armesberg stammt von Open-Meteo (<a href="https://open-meteo.com/" {...ext}>open-meteo.com</a>, Lizenz CC BY 4.0).
        Die Daten ruft <strong>unser Server</strong> ab und speichert sie kurz zwischen. Ihr Browser verbindet sich dabei nicht mit Open-Meteo,
        Ihre IP-Adresse wird also nicht an Open-Meteo übermittelt. Es werden keine personenbezogenen Daten an Dritte weitergegeben.
      </p>

      <h2 id="schriften">9. Schriftarten</h2>
      <p>
        Die auf dieser Website verwendeten Schriftarten sind lokal auf unserem Server gespeichert. Beim Aufruf der Seite wird keine Verbindung zu
        Servern von Google oder anderen Anbietern aufgebaut.
      </p>

      <h2 id="kontakt">10. Kontakt und Tischanfrage</h2>
      <p>
        Wenn Sie uns per Telefon, E-Mail oder WhatsApp kontaktieren, verarbeiten wir Ihre Angaben (z. B. Name, Telefonnummer, E-Mail-Adresse,
        Wunschtermin, Personenzahl und Ihre Nachricht), um Ihre Anfrage zu bearbeiten.
      </p>
      <p>
        Ist die Online-Reservierung vorübergehend nicht erreichbar, erscheint stattdessen ein Formular, das <strong>keine Daten auf unserem
        Server speichert</strong>. Es erstellt aus Ihren Eingaben lediglich eine Nachricht und öffnet damit Ihre WhatsApp- oder E-Mail-App.
        Erst wenn Sie die Nachricht dort selbst absenden, erhalten wir sie.
      </p>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, wenn Ihre Anfrage mit einer Reservierung oder einem Vertrag zusammenhängt, im Übrigen
        Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen). Wir löschen Ihre Daten, sobald die Anfrage
        abschließend bearbeitet ist und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
      </p>

      <h2 id="reservierung">11. Online-Reservierung</h2>
      <p>
        Wenn Sie über unsere Website einen Tisch reservieren, verarbeiten wir Name, Telefonnummer, E-Mail-Adresse, Datum, Uhrzeit,
        Personenzahl und Ihren optionalen Wunsch. Die Daten werden ausschließlich auf unserem eigenen Webserver bei netcup gespeichert und
        nur von uns (Inhaberin und berechtigte Mitarbeiter mit eigenem Zugang) in einer passwortgeschützten Verwaltung genutzt, um Ihre
        Reservierung zu planen und Sie bei Rückfragen zu erreichen. Sie erhalten eine Bestätigung per E-Mail mit einem Link, über den Sie die
        Reservierung selbst stornieren können. Die E-Mails versenden wir über unser Postfach bei netcup. Außerdem erhalten wir eine
        Benachrichtigung über die neue Reservierung per E-Mail und als Push-Nachricht auf die Diensthandys. Die Push-Nachricht läuft über den
        Push-Dienst des jeweiligen Handys (Apple bzw. Google), enthält dabei aber keine Daten: Den Text holt das Handy direkt von unserem Server.
      </p>
      <p>
        Name, Telefonnummer und E-Mail-Adresse sind Pflichtangaben: Ohne sie können wir die Reservierung nicht bestätigen und Sie bei
        Rückfragen nicht erreichen. Alternativ können Sie telefonisch reservieren.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Durchführung Ihrer Reservierung). Wir löschen die Daten automatisch
        {" "}<strong>60 Tage nach dem Reservierungstermin</strong>. Zum Schutz vor missbräuchlichen Massenanfragen speichern wir beim Absenden
        einen nicht rückrechenbaren Hashwert Ihrer IP-Adresse für höchstens eine Stunde (Art. 6 Abs. 1 lit. f DSGVO). Eine Weitergabe an
        Dritte findet nicht statt.
      </p>

      <h2 id="whatsapp">12. WhatsApp</h2>
      <p>
        Sie können uns auch über WhatsApp erreichen. Anbieter ist die WhatsApp Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Irland, ein
        Unternehmen der Meta-Gruppe. WhatsApp wird erst geöffnet, wenn Sie selbst einen WhatsApp-Link antippen. Beim bloßen Besuch unserer
        Website werden keine Daten an WhatsApp übertragen.
      </p>
      <p>
        Nachrichten sind Ende-zu-Ende-verschlüsselt. WhatsApp verarbeitet jedoch Metadaten (z. B. Telefonnummer, Zeitpunkt, Gerätedaten) und kann
        Daten an Meta Platforms Inc. in den USA übermitteln. Meta ist nach dem EU-US Data Privacy Framework zertifiziert. Wenn Sie das nicht
        möchten, erreichen Sie uns gerne per Telefon oder E-Mail. Weitere Informationen:{" "}
        <a href="https://www.whatsapp.com/legal/privacy-policy-eea" {...ext}>Datenschutzrichtlinie von WhatsApp</a>.
      </p>

      <h2 id="links">13. Links zu anderen Anbietern</h2>
      <p>
        Unsere Website enthält Links, z. B. zur Routenplanung (Google Maps, Apple Karten), zu Bahnverbindungen (bahn.de) und zu unseren
        Bewertungen auf Google. Diese Angebote werden erst geöffnet, wenn Sie den Link anklicken. Dann gelten die Datenschutzbestimmungen des
        jeweiligen Anbieters. Vor dem Klick werden keine Daten an diese Anbieter übertragen.
      </p>

      <h2 id="bewertungen">14. Gästebewertungen</h2>
      <p>
        Wir zeigen ausgewählte, öffentlich auf Google abgegebene Bewertungen unserer Gäste. Die Namen geben wir nur in gekürzter Form wieder
        (Vorname und Anfangsbuchstabe). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse ist es, Besuchern einen
        Eindruck von unserem Haus zu vermitteln. Wir prüfen nicht, ob die Verfasser tatsächlich bei uns zu Gast waren. Wenn Sie als Verfasser einer Bewertung nicht möchten, dass diese hier erscheint, genügt eine
        kurze Nachricht an uns. Wir entfernen sie dann umgehend.
      </p>

      <h2 id="speicherdauer">15. Speicherdauer</h2>
      <p>
        Soweit in dieser Datenschutzerklärung keine speziellere Speicherdauer genannt ist, verbleiben Ihre personenbezogenen Daten bei uns, bis der
        Zweck für die Verarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen oder eine Einwilligung widerrufen, werden Ihre
        Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung haben (z. B. steuer- oder handelsrechtliche
        Aufbewahrungsfristen). Im letztgenannten Fall erfolgt die Löschung nach Fortfall dieser Gründe.
      </p>

      <h2 id="rechte">16. Ihre Rechte</h2>
      <p>Sie haben im Rahmen der gesetzlichen Bestimmungen jederzeit folgende Rechte:</p>
      <ul>
        <li><strong>Auskunft</strong> über Ihre bei uns gespeicherten Daten (Art. 15 DSGVO)</li>
        <li><strong>Berichtigung</strong> unrichtiger Daten (Art. 16 DSGVO)</li>
        <li><strong>Löschung</strong> Ihrer Daten (Art. 17 DSGVO)</li>
        <li><strong>Einschränkung</strong> der Verarbeitung (Art. 18 DSGVO)</li>
        <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
        <li><strong>Widerruf</strong> einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO). Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt unberührt.</li>
      </ul>
      <p>Für alle Anliegen genügt eine formlose Nachricht an die oben genannte Adresse.</p>

      <h3>Widerspruchsrecht (Art. 21 DSGVO)</h3>
      <p>
        <strong>
          Wenn die Datenverarbeitung auf Grundlage von Art. 6 Abs. 1 lit. e oder f DSGVO erfolgt, haben Sie jederzeit das Recht, aus Gründen, die
          sich aus Ihrer besonderen Situation ergeben, gegen die Verarbeitung Ihrer personenbezogenen Daten Widerspruch einzulegen. Wir verarbeiten
          Ihre Daten dann nicht mehr, es sei denn, wir können zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die Ihre Interessen,
          Rechte und Freiheiten überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.
        </strong>
      </p>
      <p>
        <strong>
          Werden Ihre personenbezogenen Daten verarbeitet, um Direktwerbung zu betreiben, haben Sie das Recht, jederzeit Widerspruch gegen diese
          Verarbeitung einzulegen. Ihre Daten werden dann nicht mehr für Zwecke der Direktwerbung verwendet.
        </strong>
      </p>

      <h2 id="beschwerde">17. Beschwerderecht bei der Aufsichtsbehörde</h2>
      <p>
        Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer Daten gegen die DSGVO verstößt, haben Sie das Recht, sich bei einer
        Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO). Für uns zuständig ist:
      </p>
      <address>
        Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)<br />
        Promenade 18, 91522 Ansbach<br />
        <a href="https://www.lda.bayern.de" {...ext}>www.lda.bayern.de</a>
      </address>

      <h3>Keine Pflicht zur Bereitstellung, keine automatisierten Entscheidungen</h3>
      <p>
        Sie sind nicht verpflichtet, uns personenbezogene Daten bereitzustellen. Ohne Server-Logfiles kann die Website jedoch technisch nicht
        ausgeliefert werden. Eine automatisierte Entscheidungsfindung einschließlich Profiling (Art. 22 DSGVO) findet nicht statt.
      </p>

      <h3>Widerspruch gegen Werbe-E-Mails</h3>
      <p>
        Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten zur Übersendung von nicht ausdrücklich angeforderter Werbung
        und Informationsmaterialien wird hiermit widersprochen. Wir behalten uns ausdrücklich rechtliche Schritte im Falle der unverlangten
        Zusendung von Werbeinformationen, etwa durch Spam-E-Mails, vor.
      </p>
    </LegalPage>
  );
}
