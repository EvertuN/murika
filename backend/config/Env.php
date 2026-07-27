<?php

function loadEnvFile($path) {
    static $loaded = [];

    if (isset($loaded[$path]) || !is_file($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || strpos($trimmed, '#') === 0) {
            continue;
        }

        $separatorPos = strpos($trimmed, '=');
        if ($separatorPos === false) {
            continue;
        }

        $key = trim(substr($trimmed, 0, $separatorPos));
        $value = trim(substr($trimmed, $separatorPos + 1));

        if ($key === '') {
            continue;
        }

        if (
            (substr($value, 0, 1) === '"' && substr($value, -1) === '"') ||
            (substr($value, 0, 1) === "'" && substr($value, -1) === "'")
        ) {
            $value = substr($value, 1, -1);
        }

        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
        putenv($key . '=' . $value);
    }

    $loaded[$path] = true;
}

function env($key, $default = null) {
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
    if ($value === false || $value === null || $value === '') {
        return $default;
    }

    return $value;
}
