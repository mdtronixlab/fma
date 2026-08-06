<?php
/**
 * Copy this file to config.php (same folder) and set your own password.
 * config.php is gitignored on purpose — never commit real credentials.
 *
 * To generate a password hash, run this once (on the server via SSH, or
 * locally if you have PHP installed) and paste the output below:
 *
 *   php -r "echo password_hash('YOUR-PASSWORD-HERE', PASSWORD_DEFAULT), PHP_EOL;"
 */

return [
    'password_hash' => '$2y$10$REPLACE.WITH.A.GENERATED.HASH.FROM.THE.COMMAND.ABOVE',
];
