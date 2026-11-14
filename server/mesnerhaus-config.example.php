<?php
/* Kopie als mesnerhaus-config.php in die Repo-Wurzel auf dem Server legen
   (neben package.json, NICHT in out/). Diese Datei wird nicht committet. */
return [
    // Token von @BotFather
    'telegram_bot_token'        => '123456789:ABC...',
    // Beliebige lange Zufallszeichenkette (A-Z, a-z, 0-9, _ und -)
    'telegram_webhook_secret'   => 'hier-eine-lange-zufaellige-zeichenkette',
    // Wer darf hochladen? Chat-IDs (der Bot nennt sie bei /start)
    'telegram_allowed_chat_ids' => [ /* 123456789 */ ],
    // Wo die PDF gespeichert wird (außerhalb von out/)
    // 'storage_dir'            => __DIR__ . '/storage',
    'site_url'                  => 'https://www.mesnerhausarmesberg.de',
];
