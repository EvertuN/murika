<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../security/AuthRules.php';

header('Content-Type: application/json; charset=utf-8');
requerAdmin();

$pdo = getAuthPdo();
$action = $_POST['acao'] ?? $_GET['acao'] ?? 'listar';

try {
    switch ($action) {
        case 'listar':
            listAuthUsers($pdo);
            break;
        case 'salvar':
            saveAuthUser($pdo);
            break;
        case 'alterar_status':
            changeAuthUserStatus($pdo);
            break;
        case 'redefinir_senha':
            resetAuthUserPassword($pdo);
            break;
        case 'forcar_troca':
            forceAuthUserPasswordChange($pdo);
            break;
        case 'desbloquear':
            unlockAuthUser($pdo);
            break;
        default:
            authUserResponse(false, 'Ação inválida.', null, 400);
    }
} catch (InvalidArgumentException $exception) {
    authUserResponse(false, $exception->getMessage(), null, 422, 'VALIDATION_ERROR');
} catch (PDOException $exception) {
    if ($exception->getCode() === '23000') {
        authUserResponse(false, 'Já existe um usuário com esse email.', null, 409, 'EMAIL_ALREADY_EXISTS');
    }
    apiExceptionResponse($exception, 'auth_users_controller::database');
} catch (Throwable $exception) {
    apiExceptionResponse($exception, 'auth_users_controller');
}

function listAuthUsers(PDO $pdo) {
    $cutoff = date('Y-m-d H:i:s', time() - AUTH_LOCKOUT_SECONDS);
    $stmt = $pdo->prepare(
        'SELECT
            u.id,
            u.nome,
            u.usuario AS email,
            u.tipo AS role,
            u.id_funcionario,
            u.ativo,
            u.precisa_trocar_senha,
            u.created_at,
            u.updated_at,
            u.last_login_at,
            COALESCE(a.failed_attempts, 0) AS failed_attempts,
            a.last_attempt
         FROM auth_users u
         LEFT JOIN (
             SELECT username, COUNT(*) AS failed_attempts, MAX(attempt_time) AS last_attempt
             FROM auth_tentativa_login
             WHERE attempt_time >= :cutoff
             GROUP BY username
         ) a ON a.username = u.usuario
         ORDER BY u.nome, u.usuario'
    );
    $stmt->execute([':cutoff' => $cutoff]);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($users as &$user) {
        $user['ativo'] = (int) $user['ativo'] === 1;
        $user['precisa_trocar_senha'] = (int) $user['precisa_trocar_senha'] === 1;
        $user['failed_attempts'] = (int) $user['failed_attempts'];
        $user['bloqueado'] = $user['failed_attempts'] >= getAuthMaxAttempts();
        $user['id_funcionario'] = $user['id_funcionario'] !== null
            ? (int) $user['id_funcionario']
            : null;
    }
    unset($user);

    authUserResponse(true, '', [
        'users' => $users,
        'roles' => AUTH_ROLES,
        'passwordMinimumLength' => getAuthPasswordMinimumLength(),
        'maxAttempts' => getAuthMaxAttempts(),
        'lockoutSeconds' => AUTH_LOCKOUT_SECONDS,
    ]);
}

function saveAuthUser(PDO $pdo) {
    $id = trim((string) ($_POST['id'] ?? ''));
    $name = trim((string) ($_POST['nome'] ?? ''));
    $email = LocalAuthService::normalizeEmail($_POST['email'] ?? '');
    $role = trim((string) ($_POST['role'] ?? 'recepcao'));
    $employeeId = normalizeEmployeeId($_POST['id_funcionario'] ?? null);

    if ($name === '' || strlen($name) > 100) {
        throw new InvalidArgumentException('Informe um nome válido com até 100 caracteres.');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
        throw new InvalidArgumentException('Informe um email válido.');
    }
    if (!isValidAuthRole($role)) {
        throw new InvalidArgumentException('Perfil inválido.');
    }

    if ($id === '') {
        $password = (string) ($_POST['senha'] ?? '');
        $policy = validateLocalPassword($password, getAuthPasswordMinimumLength());
        if (!$policy['valid']) {
            throw new InvalidArgumentException($policy['message']);
        }

        $id = generateLocalUserId();
        $stmt = $pdo->prepare(
            'INSERT INTO auth_users (
                id, nome, usuario, senha, tipo, id_funcionario,
                ativo, precisa_trocar_senha, session_version
             ) VALUES (
                :id, :nome, :email, :senha, :role, :id_funcionario,
                1, 1, 1
             )'
        );
        $stmt->execute([
            ':id' => $id,
            ':nome' => $name,
            ':email' => $email,
            ':senha' => password_hash($password, PASSWORD_DEFAULT),
            ':role' => $role,
            ':id_funcionario' => $employeeId,
        ]);

        Logger::system($pdo, 'ADMIN', 'CREATE', 'auth_users', $id, [
            'nome' => $name,
            'email' => $email,
            'role' => $role,
        ]);
        authUserResponse(true, 'Usuário criado. A troca de senha será exigida no primeiro login.', ['id' => $id]);
    }

    $existing = findAuthUser($pdo, $id);
    if (!$existing) {
        authUserResponse(false, 'Usuário não encontrado.', null, 404);
    }

    if ($id === (string) $_SESSION['id'] && $role !== 'admin') {
        throw new InvalidArgumentException('Você não pode remover o próprio perfil de administrador.');
    }

    $sessionVersionSql = $id === (string) $_SESSION['id']
        ? 'session_version = session_version'
        : 'session_version = session_version + 1';
    $stmt = $pdo->prepare(
        "UPDATE auth_users
         SET nome = :nome,
             usuario = :email,
             tipo = :role,
             id_funcionario = :id_funcionario,
             {$sessionVersionSql}
         WHERE id = :id"
    );
    $stmt->execute([
        ':nome' => $name,
        ':email' => $email,
        ':role' => $role,
        ':id_funcionario' => $employeeId,
        ':id' => $id,
    ]);

    if ($id === (string) $_SESSION['id']) {
        $_SESSION['nome'] = $name;
        $_SESSION['usuario'] = $email;
    }

    Logger::system($pdo, 'ADMIN', 'UPDATE', 'auth_users', $id, [
        'nome' => ['from' => $existing['nome'], 'to' => $name],
        'email' => ['from' => $existing['usuario'], 'to' => $email],
        'role' => ['from' => $existing['tipo'], 'to' => $role],
    ]);
    authUserResponse(true, 'Usuário atualizado.');
}

function changeAuthUserStatus(PDO $pdo) {
    $id = trim((string) ($_POST['id'] ?? ''));
    $active = filter_var($_POST['ativo'] ?? false, FILTER_VALIDATE_BOOLEAN);

    if ($id === (string) $_SESSION['id'] && !$active) {
        throw new InvalidArgumentException('Você não pode desativar o próprio usuário.');
    }
    if (!findAuthUser($pdo, $id)) {
        authUserResponse(false, 'Usuário não encontrado.', null, 404);
    }

    $stmt = $pdo->prepare(
        'UPDATE auth_users
         SET ativo = :ativo, session_version = session_version + 1
         WHERE id = :id'
    );
    $stmt->execute([':ativo' => $active ? 1 : 0, ':id' => $id]);

    Logger::system($pdo, 'ADMIN', $active ? 'ACTIVATE' : 'DEACTIVATE', 'auth_users', $id);
    authUserResponse(true, $active ? 'Usuário ativado.' : 'Usuário desativado.');
}

function resetAuthUserPassword(PDO $pdo) {
    $id = trim((string) ($_POST['id'] ?? ''));
    $password = (string) ($_POST['senha'] ?? '');
    $policy = validateLocalPassword($password, getAuthPasswordMinimumLength());
    if (!$policy['valid']) {
        throw new InvalidArgumentException($policy['message']);
    }
    if (!findAuthUser($pdo, $id)) {
        authUserResponse(false, 'Usuário não encontrado.', null, 404);
    }

    $stmt = $pdo->prepare(
        'UPDATE auth_users
         SET senha = :senha,
             precisa_trocar_senha = 1,
             password_changed_at = NOW(),
             session_version = session_version + 1
         WHERE id = :id'
    );
    $stmt->execute([
        ':senha' => password_hash($password, PASSWORD_DEFAULT),
        ':id' => $id,
    ]);

    Logger::system($pdo, 'ADMIN', 'PASSWORD_RESET', 'auth_users', $id);
    authUserResponse(true, 'Senha temporária definida e troca obrigatória ativada.');
}

function forceAuthUserPasswordChange(PDO $pdo) {
    $id = trim((string) ($_POST['id'] ?? ''));
    $force = filter_var($_POST['forcar'] ?? true, FILTER_VALIDATE_BOOLEAN);
    if (!findAuthUser($pdo, $id)) {
        authUserResponse(false, 'Usuário não encontrado.', null, 404);
    }

    $stmt = $pdo->prepare(
        'UPDATE auth_users
         SET precisa_trocar_senha = :force,
             session_version = session_version + 1
         WHERE id = :id'
    );
    $stmt->execute([':force' => $force ? 1 : 0, ':id' => $id]);

    Logger::system($pdo, 'ADMIN', 'FORCE_PASSWORD_CHANGE', 'auth_users', $id, [
        'enabled' => $force,
    ]);
    authUserResponse(true, $force ? 'Troca de senha obrigatória ativada.' : 'Troca de senha obrigatória removida.');
}

function unlockAuthUser(PDO $pdo) {
    $id = trim((string) ($_POST['id'] ?? ''));
    $user = findAuthUser($pdo, $id);
    if (!$user) {
        authUserResponse(false, 'Usuário não encontrado.', null, 404);
    }

    $ipStmt = $pdo->prepare('SELECT DISTINCT ip FROM auth_tentativa_login WHERE username = :email');
    $ipStmt->execute([':email' => $user['usuario']]);
    $ips = array_values(array_filter($ipStmt->fetchAll(PDO::FETCH_COLUMN)));

    $where = 'username = :email';
    $params = [':email' => $user['usuario']];
    foreach ($ips as $index => $ip) {
        $placeholder = ':ip_' . $index;
        $where .= " OR ip = {$placeholder}";
        $params[$placeholder] = $ip;
    }

    $stmt = $pdo->prepare("DELETE FROM auth_tentativa_login WHERE {$where}");
    $stmt->execute($params);

    Logger::system($pdo, 'ADMIN', 'UNLOCK', 'auth_users', $id);
    authUserResponse(true, 'Bloqueio do usuário removido.');
}

function findAuthUser(PDO $pdo, $id) {
    $stmt = $pdo->prepare(
        'SELECT id, nome, usuario, tipo, ativo
         FROM auth_users
         WHERE id = :id
         LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

function normalizeEmployeeId($value) {
    if ($value === null || $value === '') {
        return null;
    }
    $id = filter_var($value, FILTER_VALIDATE_INT);
    return $id && $id > 0 ? $id : null;
}

function generateLocalUserId() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function authUserResponse($success, $message = '', $data = null, $status = 200, $code = null) {
    apiJsonResponse((bool) $success, $data, $message, (int) $status, $code);
    exit;
}
