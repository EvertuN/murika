<?php
require_once "../env.php";
require_once "../src/config/auth.php";

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

// Rotas da API - REQUEREM AUTENTICAÇÃO
if ($primeiraParte === 'api') {
    // Verificar autenticação
    requerAutenticacao();
    
    $apiEndpoint = $urlParts[1] ?? '';
    
    // Carregar verificação de segurança (exceto para relatório que precisa abrir em nova janela)
    if ($apiEndpoint !== 'relatorio') {
        require_once "../src/config/api_security.php";
        // Verificar se a requisição é válida (vem do próprio sistema)
        verificarRequisicaoValida();
    }
    
    // Validar endpoint da API
    $apisPermitidas = ['item', 'categoria', 'movimentacao', 'usuario', 'logs', 'relatorio'];
    
    if (!in_array($apiEndpoint, $apisPermitidas)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Endpoint da API não encontrado']);
        exit;
    }
    
    // Carregar o controller correspondente
    $root = dirname(__DIR__);
    $controllerPath = $root . '/src/controller/';
    
    switch ($apiEndpoint) {
        case 'item':
            require_once $controllerPath . 'estoque_item_controller.php';
            break;
        case 'categoria':
            require_once $controllerPath . 'estoque_categoria_controller.php';
            break;
        case 'movimentacao':
            require_once $controllerPath . 'estoque_movimentacao_controller.php';
            break;
        case 'usuario':
            require_once $controllerPath . 'auth_usuario_controller.php';
            break;
        case 'logs':
            require_once $controllerPath . 'auth_logs_controller.php';
            break;
        case 'relatorio':
            require_once $controllerPath . 'estoque_relatorio_controller.php';
            break;
    }
    exit;
}

// Rotas públicas (não requerem autenticação)
$rotasPublicas = ['login', 'logout'];

// Processar login
$erro = null;
if ($url === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $usuario = $_POST['usuario'] ?? '';
    $senha = $_POST['senha'] ?? '';
    
    if (autenticar($usuario, $senha)) {
        header('Location: /');
        exit;
    } else {
        $erro = "Usuário ou senha inválidos.";
    }
}

// Processar logout
if ($url === 'logout') {
    logout();
    header('Location: /login?msg=logout');
    exit;
}

// Proteger rotas que requerem autenticação
if (!in_array($url, $rotasPublicas)) {
    requerAutenticacao();
}

// Roteamento
switch ($url) {
    case '':
    case 'home':
        require_once "../src/config/database.php";
        require_once "../src/config/auth.php";
        require_once "../src/view/home/home.php";
        break;
    case 'login':
        // Se já estiver autenticado, redirecionar para home
        if (isAuthenticated()) {
            header('Location: /');
            exit;
        }
        // Passar variável de erro para a view
        require_once "../src/view/login/auth_login.php";
        break;   
    case 'relatorio':
        require_once "../public/modelo/modelo.php";
        break;
    default:
        header('Location: /');
        exit;
}