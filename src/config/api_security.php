<?php
/**
 * Verifica se a requisição é válida (vem do próprio sistema)
 * Bloqueia acesso direto via URL
 */
function verificarRequisicaoValida() {
    // Verificar header customizado que só o sistema envia
    $hasSystemHeader = isset($_SERVER['HTTP_X_MURIKA_REQUEST']) && 
                       $_SERVER['HTTP_X_MURIKA_REQUEST'] === 'true';
    
    // Verificar se tem referer do mesmo domínio
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $baseUrl = $scheme . '://' . $host;
    
    $refererValido = !empty($referer) && strpos($referer, $baseUrl) === 0;
    
    // Verificar se é requisição AJAX/Fetch
    $isAjax = (
        isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
        strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest'
    ) || (
        isset($_SERVER['HTTP_ACCEPT']) && 
        strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false
    );
    
    // Bloquear acesso direto se NÃO tiver:
    // 1. O header customizado do sistema OU
    // 2. Referer válido (vindo do mesmo domínio) E requisição AJAX/Fetch
    $requisicaoValida = $hasSystemHeader || ($refererValido && $isAjax);
    
    if (!$requisicaoValida) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false, 
            'message' => 'Acesso negado.'
        ]);
        exit;
    }
}

