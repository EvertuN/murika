<?php

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/../security/AuthRules.php';
require_once __DIR__ . '/../service/LocalAuthService.php';
require_once __DIR__ . '/../service/AppConfigService.php';

function isHttpsRequest() {
    $trustProxy = filter_var(env('TRUST_PROXY', 'false'), FILTER_VALIDATE_BOOLEAN);
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($trustProxy && isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
}

if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Lax');

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => isHttpsRequest(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function applySecurityHeaders() {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: same-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    header("Content-Security-Policy: frame-ancestors 'self'; base-uri 'self'; form-action 'self'");
}

function getAuthPdo() {
    $database = new Database();
    $pdo = $database->connect();
    if (!$pdo instanceof PDO) {
        throw new RuntimeException('Não foi possível acessar o banco de dados.');
    }
    return $pdo;
}

function getAuthConfigInt($key, $fallback) {
    static $configPdo = null;
    try {
        if (!$configPdo instanceof PDO) $configPdo = getAuthPdo();
        return AppConfigService::getInt($configPdo, (string) $key, (int) $fallback);
    } catch (Throwable $exception) {
        return (int) $fallback;
    }
}

function getAuthSessionTimeoutSeconds() {
    return max(300, getAuthConfigInt('session_timeout_minutes', (int) ceil(AUTH_SESSION_TIMEOUT / 60)) * 60);
}

function getAuthMaxAttempts() {
    return max(1, getAuthConfigInt('login_max_attempts', AUTH_MAX_ATTEMPTS));
}

function getAuthLockoutSeconds() {
    return max(60, getAuthConfigInt('login_lockout_minutes', (int) ceil(AUTH_LOCKOUT_SECONDS / 60)) * 60);
}

function getAuthPasswordMinimumLength() {
    return max(8, getAuthConfigInt('password_min_length', AUTH_PASSWORD_MIN_LENGTH));
}

function getCsrfToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function isValidCsrfToken($token) {
    return is_string($token)
        && $token !== ''
        && isset($_SESSION['csrf_token'])
        && hash_equals($_SESSION['csrf_token'], $token);
}

function enforceCsrfProtection($force = false) {
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if (!$force && in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
        return;
    }

    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf_token'] ?? '');
    if (!isValidCsrfToken($token)) {
        http_response_code(419);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'message' => 'A sessão de segurança expirou. Atualize a página e tente novamente.',
            'code' => 'CSRF_INVALID',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

function expectsJsonAuthResponse() {
    return (
        (
            isset($_SERVER['HTTP_X_REQUESTED_WITH'])
            && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest'
        )
        || (
            isset($_SERVER['HTTP_ACCEPT'])
            && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false
        )
    );
}

function authFailureResponse($status, $message, $code) {
    http_response_code((int) $status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => $message,
        'code' => $code,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function createAuthenticatedSession($user) {
    session_regenerate_id(true);

    $_SESSION['id'] = (string) $user['id'];
    $_SESSION['nome'] = (string) $user['nome'];
    $_SESSION['usuario'] = (string) $user['usuario'];
    $_SESSION['tipo'] = (string) $user['tipo'];
    $_SESSION['id_funcionario'] = $user['id_funcionario'] ?? null;
    $_SESSION['precisa_trocar_senha'] = (int) ($user['precisa_trocar_senha'] ?? 0);
    $_SESSION['session_version'] = (int) ($user['session_version'] ?? 1);
    $_SESSION['ultimo_uso'] = time();
    getCsrfToken();
}

function isAuthenticated() {
    return isset($_SESSION['id'], $_SESSION['ultimo_uso'], $_SESSION['tipo']);
}

function currentUserRole() {
    return isAuthenticated() ? (string) $_SESSION['tipo'] : 'guest';
}

function hasRole($roles) {
    $roles = is_array($roles) ? $roles : [$roles];
    return isAuthenticated() && in_array(currentUserRole(), $roles, true);
}

function isAdmin() {
    return hasRole('admin');
}

function isRecepcao() {
    return hasRole('recepcao');
}

function isFinanceiro() {
    return hasRole('financeiro');
}

function checkSessionTimeout() {
    if (!isAuthenticated()) {
        return false;
    }

    if ((time() - (int) $_SESSION['ultimo_uso']) > getAuthSessionTimeoutSeconds()) {
        logout(false);
        return false;
    }

    try {
        $pdo = getAuthPdo();
        $stmt = $pdo->prepare(
            'SELECT nome, usuario, tipo, id_funcionario, ativo,
                    precisa_trocar_senha, session_version
             FROM auth_users
             WHERE id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $_SESSION['id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (
            !$user
            || (int) $user['ativo'] !== 1
            || !isValidAuthRole($user['tipo'])
            || (int) $user['session_version'] !== (int) ($_SESSION['session_version'] ?? 0)
        ) {
            logout(false);
            return false;
        }

        $_SESSION['nome'] = $user['nome'];
        $_SESSION['usuario'] = $user['usuario'];
        $_SESSION['tipo'] = $user['tipo'];
        $_SESSION['id_funcionario'] = $user['id_funcionario'];
        $_SESSION['precisa_trocar_senha'] = (int) $user['precisa_trocar_senha'];
        $_SESSION['ultimo_uso'] = time();
        return true;
    } catch (Throwable $exception) {
        error_log('Session validation error: ' . $exception->getMessage());
        logout(false);
        return false;
    }
}

function requiresPasswordChange() {
    return isAuthenticated() && (int) ($_SESSION['precisa_trocar_senha'] ?? 0) === 1;
}

function requerAutenticacao($allowPasswordChange = false) {
    if (!isAuthenticated() || !checkSessionTimeout()) {
        if (expectsJsonAuthResponse()) {
            authFailureResponse(401, 'Sessão expirada. Faça login novamente.', 'SESSION_EXPIRED');
        }
        header('Location: /login?msg=expirou');
        exit;
    }

    if (!$allowPasswordChange && requiresPasswordChange()) {
        if (expectsJsonAuthResponse()) {
            authFailureResponse(
                403,
                'Você precisa cadastrar uma nova senha antes de continuar.',
                'PASSWORD_CHANGE_REQUIRED'
            );
        }
        header('Location: /nova-senha');
        exit;
    }
}

function requerPerfil($roles) {
    requerAutenticacao();
    if (!hasRole($roles)) {
        if (expectsJsonAuthResponse()) {
            authFailureResponse(403, 'Você não possui permissão para esta operação.', 'FORBIDDEN');
        }
        header('Location: /');
        exit;
    }
}

function requerAdmin() {
    requerPerfil('admin');
}

function authorizeApiEndpoint($endpoint, $action = '', $method = null) {
    $method = $method ?: ($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if (!roleCanAccessApi(currentUserRole(), $endpoint, $action, $method)) {
        authFailureResponse(403, 'Você não possui permissão para esta operação.', 'FORBIDDEN');
    }
}

function autenticar($email, $senha) {
    try {
        $service = new LocalAuthService(getAuthPdo(), getAuthMaxAttempts(), getAuthLockoutSeconds());
        $result = $service->authenticate($email, $senha);
        if (empty($result['success'])) {
            return $result;
        }

        createAuthenticatedSession($result['user']);
        return [
            'success' => true,
            'requiresPasswordChange' => requiresPasswordChange(),
        ];
    } catch (Throwable $exception) {
        error_log('Local auth error: ' . $exception->getMessage());
        return [
            'success' => false,
            'message' => 'Não foi possível autenticar no momento. Tente novamente.',
        ];
    }
}

function changeCurrentUserPassword($currentPassword, $newPassword, $confirmation) {
    try {
        $service = new LocalAuthService(getAuthPdo(), getAuthMaxAttempts(), getAuthLockoutSeconds());
        $result = $service->changePassword(
            $_SESSION['id'],
            $currentPassword,
            $newPassword,
            $confirmation,
            getAuthPasswordMinimumLength()
        );

        if (!empty($result['success'])) {
            $_SESSION['precisa_trocar_senha'] = 0;
            $_SESSION['session_version'] = (int) $result['sessionVersion'];
            $_SESSION['ultimo_uso'] = time();
            session_regenerate_id(true);
            getCsrfToken();
        }

        return $result;
    } catch (Throwable $exception) {
        error_log('Password change error: ' . $exception->getMessage());
        return [
            'success' => false,
            'message' => 'Não foi possível alterar a senha no momento.',
        ];
    }
}

function logout($audit = true) {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if ($audit && isset($_SESSION['id'])) {
        try {
            require_once __DIR__ . '/../core/Logger.php';
            Logger::auth(getAuthPdo(), 'LOGOUT', json_encode([
                'message' => 'Logout realizado pelo usuário.',
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $_SESSION['id']);
        } catch (Throwable $exception) {
            error_log('Logout audit error: ' . $exception->getMessage());
        }
    }

    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'],
            'domain' => $params['domain'],
            'secure' => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => $params['samesite'] ?? 'Lax',
        ]);
    }

    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

function getUserData() {
    if (!isAuthenticated()) {
        return null;
    }

    return [
        'id' => (string) $_SESSION['id'],
        'nome' => (string) ($_SESSION['nome'] ?? ''),
        'email' => (string) ($_SESSION['usuario'] ?? ''),
        'role' => currentUserRole(),
        'idFuncionario' => $_SESSION['id_funcionario'] ?? null,
        'requiresPasswordChange' => requiresPasswordChange(),
    ];
}

function getAuthBootstrapData() {
    $role = currentUserRole();
    return [
        'status' => isAuthenticated() ? 'authenticated' : 'anonymous',
        'serverTimeNow' => time(),
        'sessionTimeoutSeconds' => getAuthSessionTimeoutSeconds(),
        'csrfToken' => getCsrfToken(),
        'isAdmin' => $role === 'admin',
        'permissions' => [
            'manageUsers' => $role === 'admin',
            'manageEmployees' => $role === 'admin',
            'viewFinancial' => in_array($role, ['admin', 'financeiro'], true),
            'viewReports' => in_array($role, ['admin', 'financeiro'], true),
            'operationalWrite' => in_array($role, ['admin', 'recepcao'], true),
        ],
        'user' => getUserData(),
    ];
}
