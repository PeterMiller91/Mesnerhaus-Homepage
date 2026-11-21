<?php
/* Kopie als mesnerhaus-config.php in die Repo-Wurzel auf dem Server legen
   (neben package.json, NICHT in out/). Diese Datei wird nicht committet. */
return [
    // ── Upload per Link (empfohlen) ──────────────────────────────────
    // Geheimer Schlüssel, mindestens 24 Zeichen, nur A-Z, a-z, 0-9.
    // Upload-Link: https://mesnerhausarmesberg.de/tageskarte-upload.php?k=<upload_key>
    'upload_key'                => 'hier-mindestens-24-zufaellige-zeichen',

    // ── E-Mail-Versand der Reservierungen ──────────────────────────
    // Ohne SMTP-Angaben verschickt der Webserver selbst (PHP mail()).
    // Zuverlässiger: über das echte Postfach per SMTP (Daten wie im Mailprogramm):
    // 'smtp_host'   => 'mail.beispiel.de',      // Postausgangsserver
    // 'smtp_port'   => 587,                     // 587 = STARTTLS, 465 = SSL
    // 'smtp_secure' => 'tls',                   // 'tls' (587) oder 'ssl' (465)
    // 'smtp_user'   => 'kontakt@mesnerhausarmesberg.de',
    // 'smtp_pass'   => 'Passwort des Postfachs',
    // 'mail_from'   => 'kontakt@mesnerhausarmesberg.de', // Absender (Standard: smtp_user)

    'site_url'                  => 'https://mesnerhausarmesberg.de',

    // Wo die Tageskarte gespeichert wird (außerhalb von out/)
    // 'storage_dir'            => __DIR__ . '/storage',

    // ── Optional: Upload per Telegram-Bot ────────────────────────────
    // 'telegram_bot_token'        => '123456789:ABC...',
    // 'telegram_webhook_secret'   => 'lange-zufaellige-zeichenkette',
    // 'telegram_allowed_chat_ids' => [ 123456789 ],
];
