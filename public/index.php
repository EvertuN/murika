<?php
require_once "../env.php";
$url = isset($_GET['url']) ? $_GET['url'] : '';
$url = trim($url, '/');

// Bloqueio de caracteres suspeitos
if (preg_match('/[^a-zA-Z0-9\-_\/]/', $url) || strpos($url, '..') !== false) {
    header('Location: /');
    exit;
}

// Separar a URL em partes
$urlParts = explode('/', $url);
$primeiraParte = $urlParts[0] ?? '';

// Rotas da API
if ($primeiraParte === 'api') {
    // Carregar verificação de segurança
    require_once "../src/config/api_security.php";
    
    // Verificar se a requisição é válida (vem do próprio sistema)
    verificarRequisicaoValida();
    
    $apiEndpoint = $urlParts[1] ?? '';
    
    // Validar endpoint da API
    $apisPermitidas = ['item', 'categoria', 'movimentacao'];
    
    if (!in_array($apiEndpoint, $apisPermitidas)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Endpoint da API não encontrado']);
        exit;
    }
    
    // Carregar o controller correspondente
    // O DOCUMENT_ROOT aponta para a pasta public, então precisamos subir um nível
    $root = dirname(__DIR__);
    $controllerPath = $root . '/src/controller/';
    
    switch ($apiEndpoint) {
        case 'item':
            require_once $controllerPath . 'item_controller.php';
            break;
        case 'categoria':
            require_once $controllerPath . 'categoria_controller.php';
            break;
        case 'movimentacao':
            require_once $controllerPath . 'movimentacao_controller.php';
            break;
    }
    exit;
}

// Lista de rotas permitidas (não-API)
$rotasPermitidas = ['', 'login', 'relatorio'];

if (!in_array($url, $rotasPermitidas)) {
    header('Location: /');
    exit;
}

// Roteamento
switch ($url) {
    case '':
    case 'home':
        require_once "../src/config/database.php";
        require_once "../src/view/home/home.php";
        break;
    case 'login':
        require_once "../src/view/login/login.php";
        break;   
    case 'relatorio':
        require_once "../public/modelo/modelogpt.php";
        break;
}