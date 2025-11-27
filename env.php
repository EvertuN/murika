<?php
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$basePath = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/'), '/\\');
define('BASE_URL', $scheme . '://' . $host . ($basePath ? $basePath . '/' : '/'));

function base_url($path = '') {
    return BASE_URL . ltrim($path, '/');
}

function asset($path) {
    return base_url($path);
}