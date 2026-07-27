<?php

/**
 * Rejeita navegação direta e requisições explicitamente cross-site.
 * Autenticação, autorização e CSRF continuam sendo as barreiras de segurança.
 */
function verificarRequisicaoValida(): void
{
    $referer = (string) ($_SERVER['HTTP_REFERER'] ?? '');
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $baseUrl = $scheme . '://' . $host;
    $fetchSite = strtolower((string) ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? ''));

    $sameOrigin = ($referer !== '' && strpos($referer, $baseUrl) === 0)
        || ($origin !== '' && hash_equals($baseUrl, rtrim($origin, '/')))
        || in_array($fetchSite, ['', 'same-origin', 'same-site', 'none'], true);

    $isAjax = (
        isset($_SERVER['HTTP_X_REQUESTED_WITH'])
        && strtolower((string) $_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest'
    ) || (
        isset($_SERVER['HTTP_ACCEPT'])
        && strpos((string) $_SERVER['HTTP_ACCEPT'], 'application/json') !== false
    );

    if ($sameOrigin && $isAjax) {
        return;
    }

    error_log('API request rejected: invalid request context.');
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Acesso não autorizado.',
        'code' => 'INVALID_REQUEST_CONTEXT',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
