<?php
/* Kopie als mesnerhaus-config.php in die Repo-Wurzel auf dem Server legen
   (neben package.json, NICHT in out/). Diese Datei wird nicht committet. */
return [
    // ── Upload per Link (empfohlen) ──────────────────────────────────
    // Geheimer Schlüssel, mindestens 24 Zeichen, nur A-Z, a-z, 0-9.
    // Upload-Link: https://mesnerhausarmesberg.de/tageskarte-upload.php?k=<upload_key>
    'upload_key'                => 'hier-mindestens-24-zufaellige-zeichen',

    // Absender für Reservierungs-E-Mails (optional)
    // 'mail_from'              => 'kontakt@mesnerhausarmesberg.de',

    'site_url'                  => 'https://mesnerhausarmesberg.de',

    // Wo die Tageskarte gespeichert wird (außerhalb von out/)
    // 'storage_dir'            => __DIR__ . '/storage',

    // ── Optional: Upload per Telegram-Bot ────────────────────────────
    // 'telegram_bot_token'        => '123456789:ABC...',
    // 'telegram_webhook_secret'   => 'lange-zufaellige-zeichenkette',
    // 'telegram_allowed_chat_ids' => [ 123456789 ],
];
