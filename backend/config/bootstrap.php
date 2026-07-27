<?php

require_once __DIR__ . '/Env.php';

$projectRoot = dirname(__DIR__, 2);
loadEnvFile($projectRoot . '/.env');

if (!defined('APP_TIMEZONE')) {
    define('APP_TIMEZONE', env('APP_TIMEZONE', 'America/Porto_Velho'));
}

if (!defined('APP_ENV')) {
    define('APP_ENV', env('APP_ENV', 'production'));
}

if (!defined('AUTH_SESSION_TIMEOUT')) {
    define('AUTH_SESSION_TIMEOUT', max(300, (int) env('AUTH_SESSION_TIMEOUT', 43200)));
}

if (!defined('AUTH_MAX_ATTEMPTS')) {
    define('AUTH_MAX_ATTEMPTS', max(1, (int) env('AUTH_MAX_ATTEMPTS', 5)));
}

if (!defined('AUTH_LOCKOUT_SECONDS')) {
    define('AUTH_LOCKOUT_SECONDS', max(60, (int) env('AUTH_LOCKOUT_SECONDS', 900)));
}

if (!defined('AUTH_PASSWORD_MIN_LENGTH')) {
    define('AUTH_PASSWORD_MIN_LENGTH', max(8, (int) env('AUTH_PASSWORD_MIN_LENGTH', 8)));
}
