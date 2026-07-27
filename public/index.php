<?php
require_once "../backend/config/app.php";
require_once "../backend/config/auth.php";
applySecurityHeaders();

$url = isset($_GET['url']) ? $_GET['url'] : '';
$url = trim($url, '/');

if (preg_match('/[^a-zA-Z0-9\-_\/]/', $url) || strpos($url, '..') !== false) {
    header('Location: /');
    exit;
}

$urlParts = explode('/', $url);
$primeiraParte = $urlParts[0] ?? '';

if ($primeiraParte === 'api') {
    $apiEndpoint = $urlParts[1] ?? '';

    if ($apiEndpoint === 'auth_csrf') {
        require_once "../backend/config/api_security.php";
        verificarRequisicaoValida();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => true,
            'data' => ['csrfToken' => getCsrfToken()],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($apiEndpoint === 'auth_login') {
        require_once '../backend/config/api_security.php';
        verificarRequisicaoValida();
        enforceCsrfProtection();

        if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
            apiJsonResponse(false, null, 'Método não permitido.', 405, 'METHOD_NOT_ALLOWED');
            exit;
        }

        $resultadoLogin = autenticar(
            trim((string) ($_POST['email'] ?? ($_POST['usuario'] ?? ''))),
            (string) ($_POST['senha'] ?? '')
        );

        if (!empty($resultadoLogin['success'])) {
            apiJsonResponse(
                true,
                ['requiresPasswordChange' => !empty($resultadoLogin['requiresPasswordChange'])],
                'Login realizado com sucesso.'
            );
            exit;
        }

        $mensagemLogin = (string) ($resultadoLogin['message'] ?? 'Email ou senha inválidos.');
        $limiteExcedido = str_starts_with($mensagemLogin, 'Muitas tentativas');
        apiJsonResponse(
            false,
            null,
            $mensagemLogin,
            $limiteExcedido ? 429 : 401,
            $limiteExcedido ? 'LOGIN_RATE_LIMITED' : 'INVALID_CREDENTIALS'
        );
        exit;
    }

    if ($apiEndpoint === 'auth_session') {
        require_once "../backend/config/api_security.php";
        verificarRequisicaoValida();

        if (!isAuthenticated() || !checkSessionTimeout()) {
            apiJsonResponse(
                false,
                null,
                'Sessão expirada. Faça login novamente.',
                401,
                'SESSION_EXPIRED'
            );
            exit;
        }

        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'data' => getAuthBootstrapData()
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($apiEndpoint === 'auth_password') {
        requerAutenticacao(true);
        require_once "../backend/config/api_security.php";
        verificarRequisicaoValida();
        enforceCsrfProtection();
        require_once "../backend/controller/auth_password_controller.php";
        exit;
    }

    requerAutenticacao();

    if ($apiEndpoint !== 'relatorio') {
        require_once "../backend/config/api_security.php";
        verificarRequisicaoValida();
    }

    $apisPermitidas = ['item', 'categoria', 'movimentacao', 'sistema_logs', 'relatorio', 'funcionarios', 'cargo', 'financeiro', 'cliente', 'empresa', 'hospedagem_reserva', 'hospedagem_cadastros', 'auth_users', 'app_config'];

    if (!in_array($apiEndpoint, $apisPermitidas)) {
        apiJsonResponse(false, null, 'Endpoint da API não encontrado.', 404, 'ENDPOINT_NOT_FOUND');
        exit;
    }

    $apiAction = $_POST['acao'] ?? $_GET['acao'] ?? '';
    authorizeApiEndpoint($apiEndpoint, $apiAction, $_SERVER['REQUEST_METHOD'] ?? 'GET');
    $isDefaultReadOnlyEndpoint = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET'
        && in_array($apiEndpoint, ['financeiro', 'relatorio'], true);
    enforceCsrfProtection(!$isDefaultReadOnlyEndpoint && !isReadOnlyApiAction($apiAction, $_SERVER['REQUEST_METHOD'] ?? 'GET'));

    $root = dirname(__DIR__);
    $controllerPath = $root . '/backend/controller/';

    switch ($apiEndpoint) {
        case 'item':
            require_once $controllerPath . 'estoque_item_controller.php';
            break;
        case 'movimentacao':
            require_once $controllerPath . 'estoque_movimentacao_controller.php';
            break;
        case 'sistema_logs':
            require_once $controllerPath . 'auth_logs_controller.php';
            break;
        case 'auth_users':
            require_once $controllerPath . 'auth_users_controller.php';
            break;
        case 'app_config':
            require_once $controllerPath . 'app_config_controller.php';
            break;
        case 'hospedagem_cadastros':
            require_once $controllerPath . 'hospedagem_cadastros_controller.php';
            break;
        case 'relatorio':
            require_once $controllerPath . 'estoque_relatorio_controller.php';
            break;
        case 'cliente':
            require_once $controllerPath . 'hospedagem_cliente_controller.php';
            require_once "../backend/config/database.php";
            $database = new Database();
            $db = $database->connect();
            require_once __DIR__ . '/../backend/core/CoreFactory.php';
            $config = CoreFactory::getConfig('cliente');
            $controller = new ClienteController($db, $config);
            $controller->handleRequest();
            break;
        case 'empresa':
            require_once $controllerPath . 'hospedagem_empresa_controller.php';
            require_once "../backend/config/database.php";
            $database = new Database();
            $db = $database->connect();
            require_once __DIR__ . '/../backend/core/CoreFactory.php';
            $config = CoreFactory::getConfig('empresa');
            $controller = new EmpresaController($db, $config);
            $controller->handleRequest();
            break;
        case 'hospedagem_reserva':
            require_once $controllerPath . 'hospedagem_reserva_controller.php';
            break;
        case 'financeiro':
            require_once $controllerPath . 'financeiro_controller.php';
            break;
        default:
            require_once $root . '/backend/core/CoreFactory.php';
            if (CoreFactory::hasEntity($apiEndpoint)) {
                require_once "../backend/config/database.php";
                $database = new Database();
                $db = $database->connect();
                $controller = CoreFactory::create($db, $apiEndpoint);
                $controller->handleRequest();
            } else {
                apiJsonResponse(false, null, 'Endpoint inválido ou não configurado.', 404, 'ENDPOINT_NOT_FOUND');
            }
            break;
    }
    exit;
}

$rotasPublicas = ['login', 'logout'];

$erro = null;
if ($url === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isValidCsrfToken($_POST['csrf_token'] ?? '')) {
        header('Location: /login?erro=' . urlencode('A sessão de segurança expirou. Atualize a página.'));
        exit;
    }

    $email = trim($_POST['email'] ?? ($_POST['usuario'] ?? ''));
    $senha = $_POST['senha'] ?? '';

    $resultadoLogin = autenticar($email, $senha);
    if (!empty($resultadoLogin['success'])) {
        header('Location: ' . (!empty($resultadoLogin['requiresPasswordChange']) ? '/nova-senha' : '/'));
        exit;
    }

    $erro = $resultadoLogin['message'] ?? 'Email ou senha inválidos.';
    header('Location: /login?erro=' . urlencode($erro));
    exit;
}

if ($url === 'logout') {
    logout();
    header('Location: /login?msg=logout');
    exit;
}

if (!in_array($url, $rotasPublicas)) {
    requerAutenticacao($url === 'nova-senha');
}

switch ($url) {
    case '':
        $authBootstrap = getAuthBootstrapData();
        require_once "../backend/config/database.php";
        require_once "../backend/config/auth.php";
        require_once "../backend/core/home.php";
        break;
    case 'login':
        if (isAuthenticated()) {
            logout();
            header('Location: /login?msg=logout');
            exit;
        }
        require_once "../backend/service/auth_login.php";
        break;
    case 'nova-senha':
        $authBootstrap = getAuthBootstrapData();
        $pageMode = 'password-change';
        require_once "../backend/core/home.php";
        break;
    default:
        header('Location: /');
        exit;
}
