<?php
/**
 * Sistema de Autenticação Integrado
 * Adaptado do sistema em src/auth para usar o banco de dados do projeto
 */

require_once __DIR__ . '/database.php';

// Iniciar sessão se ainda não foi iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Verifica se o usuário está autenticado
 */
function isAuthenticated() {
    return isset($_SESSION['id']) && isset($_SESSION['ultimo_uso']);
}

/**
 * Verifica se o usuário é admin
 */
function isAdmin() {
    return isAuthenticated() && isset($_SESSION['tipo']) && $_SESSION['tipo'] === 'admin';
}

/**
 * Verifica timeout da sessão
 */
function checkSessionTimeout() {
    if (isAuthenticated()) {
        $timeout = 7200; // 2 Horas
        if (time() - $_SESSION['ultimo_uso'] > $timeout) {
            logout();
            return false;
        }
        $_SESSION['ultimo_uso'] = time();
        return true;
    }
    return false;
}

/**
 * Requer autenticação - redireciona se não estiver autenticado
 */
function requerAutenticacao() {
    if (!isAuthenticated() || !checkSessionTimeout()) {
        header('Location: /login');
        exit;
    }
}

/**
 * Requer permissão de admin
 */
function requerAdmin() {
    requerAutenticacao();
    if (!isAdmin()) {
        header('Location: /');
        exit;
    }
}

/**
 * Autentica o usuário
 */
function autenticar($usuario, $senha) {
    $db = new Database();
    $pdo = $db->connect();
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM auth_users WHERE usuario = ? AND ativo = 1 LIMIT 1");
        $stmt->execute([$usuario]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($senha, $user['senha'])) {
            session_regenerate_id(true);
            
            $_SESSION['id'] = $user['id'];
            $_SESSION['nome'] = $user['nome'];
            $_SESSION['usuario'] = $user['usuario'];
            $_SESSION['tipo'] = $user['tipo'];
            $_SESSION['ultimo_uso'] = time();
            
            // Log de sucesso (passando DB connection explicitamente se necessário, mas Logger usa estático com session se não passar connection, aqui temos $pdo)
            require_once __DIR__ . '/../core/Logger.php';
            Logger::log($pdo, 'LOGIN_SUCCESS', "Login realizado com sucesso", $user['id']);
            
            return true;
        }
        
        // Log de falha
        require_once __DIR__ . '/../core/Logger.php';
        Logger::log($pdo, 'LOGIN_FAIL', "Tentativa falha para usuário: $usuario", null); // Loga tentativa sem ID
        
        return false;
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Desautentica o usuário
 */
function logout() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Log logout
    if (isset($_SESSION['id'])) {
        $db = new Database();
        $pdo = $db->connect();
        require_once __DIR__ . '/../core/Logger.php';
        Logger::log($pdo, 'LOGOUT', "Logout realizado pelo usuário", $_SESSION['id']);
    }

    $_SESSION = array();
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time() - 3600, '/');
    }
    session_destroy();
}

/**
 * Obtém dados do usuário logado
 */
function getUserData() {
    if (isAuthenticated()) {
        return [
            'id' => $_SESSION['id'],
            'nome' => $_SESSION['nome'] ?? '',
            'usuario' => $_SESSION['usuario'] ?? '',
            'tipo' => $_SESSION['tipo'] ?? 'usuario'
        ];
    }
    return null;
}

