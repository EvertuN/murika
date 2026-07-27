<?php

require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json; charset=utf-8');
requerAutenticacao(true);

if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
    apiJsonResponse(false, null, 'Método não permitido.', 405, 'METHOD_NOT_ALLOWED');
    exit;
}

$result = changeCurrentUserPassword(
    $_POST['senha_atual'] ?? '',
    $_POST['nova_senha'] ?? '',
    $_POST['confirmacao_senha'] ?? ''
);

$success = !empty($result['success']);
apiJsonResponse(
    $success,
    null,
    $success ? 'Senha alterada com sucesso.' : ($result['message'] ?? 'Não foi possível alterar a senha.'),
    $success ? 200 : 422,
    $success ? null : 'PASSWORD_CHANGE_FAILED'
);
