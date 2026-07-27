<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/api_response.php';

date_default_timezone_set(APP_TIMEZONE);
initializeApiRequest();

if (PHP_SAPI !== 'cli') {
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
}

set_exception_handler(static function (Throwable $exception): void {
    $uri = (string) ($_SERVER['REQUEST_URI'] ?? '');
    $accept = (string) ($_SERVER['HTTP_ACCEPT'] ?? '');
    $expectsJson = strpos($uri, '/api/') === 0 || strpos($accept, 'application/json') !== false;

    if ($expectsJson) {
        apiExceptionResponse($exception, 'unhandled_request_exception');
        return;
    }

    $resolved = resolveApiException(
        $exception,
        'unhandled_page_exception',
        'Não foi possível carregar a página.'
    );
    http_response_code($resolved['status']);
    header('Content-Type: text/plain; charset=utf-8');
    echo $resolved['message'];
});

$scheme = 'http';
$trustProxy = filter_var(env('TRUST_PROXY', 'false'), FILTER_VALIDATE_BOOLEAN);
if (
    (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
    ($trustProxy && isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
) {
    $scheme = 'https';
}

$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$basePath = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/'), '/\\');

if (!defined('BASE_URL')) {
    define('BASE_URL', $scheme . '://' . $host . ($basePath ? $basePath . '/' : '/'));
}

function base_url($path = '') {
    return BASE_URL . ltrim($path, '/');
}

function asset($path) {
    return base_url($path);
}
