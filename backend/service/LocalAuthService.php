<?php

require_once __DIR__ . '/ClientIpResolver.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../security/AuthRules.php';

class LocalAuthService {
    private $pdo;
    private $maxAttempts;
    private $lockoutSeconds;

    public function __construct(PDO $pdo, $maxAttempts, $lockoutSeconds) {
        $this->pdo = $pdo;
        $this->maxAttempts = max(1, (int) $maxAttempts);
        $this->lockoutSeconds = max(60, (int) $lockoutSeconds);
    }

    public static function normalizeEmail($email) {
        return strtolower(trim((string) $email));
    }

    public function authenticate($email, $password) {
        $email = self::normalizeEmail($email);
        $ip = ClientIpResolver::resolve();

        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || (string) $password === '') {
            $this->registerFailure($email, $ip, null);
            return $this->invalidCredentials();
        }

        if ($this->isBlocked($email, $ip)) {
            Logger::auth($this->pdo, 'LOGIN_BLOCKED', json_encode([
                'email' => $email,
                'reason' => 'rate_limit',
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), null);

            return [
                'success' => false,
                'message' => 'Muitas tentativas inválidas. Tente novamente mais tarde.',
            ];
        }

        $stmt = $this->pdo->prepare(
            'SELECT id, nome, usuario, senha, tipo, id_funcionario, ativo,
                    precisa_trocar_senha, session_version
             FROM auth_users
             WHERE usuario = :email
             LIMIT 1'
        );
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        $fakeHash = '$2y$12$HDFmDCETBdNiAPob5V6HO.TQfcPzp6EOR2SIMIz21Q5a7gTscIrL2';
        $hash = $user['senha'] ?? $fakeHash;
        $passwordMatches = password_verify((string) $password, $hash);

        if (!$user || (int) $user['ativo'] !== 1 || !$passwordMatches || !isValidAuthRole($user['tipo'])) {
            $this->registerFailure($email, $ip, $user['id'] ?? null);
            return $this->invalidCredentials();
        }

        if (password_needs_rehash($user['senha'], PASSWORD_DEFAULT)) {
            $rehash = $this->pdo->prepare('UPDATE auth_users SET senha = :senha WHERE id = :id');
            $rehash->execute([
                ':senha' => password_hash((string) $password, PASSWORD_DEFAULT),
                ':id' => $user['id'],
            ]);
        }

        $this->clearFailures($email, $ip);
        $this->pdo->prepare('UPDATE auth_users SET last_login_at = NOW() WHERE id = :id')
            ->execute([':id' => $user['id']]);

        Logger::auth($this->pdo, 'LOGIN_SUCCESS', json_encode([
            'email' => $email,
            'role' => $user['tipo'],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $user['id']);

        unset($user['senha']);
        return ['success' => true, 'user' => $user];
    }

    public function changePassword($userId, $currentPassword, $newPassword, $confirmation, $minimumLength) {
        if ((string) $newPassword !== (string) $confirmation) {
            return ['success' => false, 'message' => 'A confirmação da senha não confere.'];
        }

        $policy = validateLocalPassword($newPassword, $minimumLength);
        if (!$policy['valid']) {
            return ['success' => false, 'message' => $policy['message']];
        }

        $stmt = $this->pdo->prepare(
            'SELECT id, senha, ativo, session_version
             FROM auth_users
             WHERE id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || (int) $user['ativo'] !== 1 || !password_verify((string) $currentPassword, $user['senha'])) {
            return ['success' => false, 'message' => 'A senha atual está incorreta.'];
        }

        if (password_verify((string) $newPassword, $user['senha'])) {
            return ['success' => false, 'message' => 'A nova senha deve ser diferente da senha atual.'];
        }

        $newVersion = ((int) $user['session_version']) + 1;
        $update = $this->pdo->prepare(
            'UPDATE auth_users
             SET senha = :senha,
                 precisa_trocar_senha = 0,
                 password_changed_at = NOW(),
                 session_version = :session_version
             WHERE id = :id'
        );
        $update->execute([
            ':senha' => password_hash((string) $newPassword, PASSWORD_DEFAULT),
            ':session_version' => $newVersion,
            ':id' => $userId,
        ]);

        Logger::auth($this->pdo, 'PASSWORD_CHANGED', json_encode([
            'source' => 'self_service',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $userId);

        return ['success' => true, 'sessionVersion' => $newVersion];
    }

    public function getAttemptState($email, $ip = null) {
        $email = self::normalizeEmail($email);
        $ip = $ip ?: ClientIpResolver::resolve();
        $cutoff = date('Y-m-d H:i:s', time() - $this->lockoutSeconds);

        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) AS attempts, MAX(attempt_time) AS last_attempt
             FROM auth_tentativa_login
             WHERE attempt_time >= :cutoff
               AND (username = :email OR ip = :ip)'
        );
        $stmt->execute([
            ':cutoff' => $cutoff,
            ':email' => $email,
            ':ip' => $ip,
        ]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        return [
            'attempts' => (int) ($row['attempts'] ?? 0),
            'lastAttempt' => $row['last_attempt'] ?? null,
            'blocked' => (int) ($row['attempts'] ?? 0) >= $this->maxAttempts,
        ];
    }

    private function isBlocked($email, $ip) {
        return $this->getAttemptState($email, $ip)['blocked'];
    }

    private function registerFailure($email, $ip, $userId) {
        $stmt = $this->pdo->prepare(
            'INSERT INTO auth_tentativa_login (ip, username, attempt_time)
             VALUES (:ip, :username, NOW())'
        );
        $stmt->execute([
            ':ip' => $ip,
            ':username' => substr((string) $email, 0, 255),
        ]);

        Logger::auth($this->pdo, 'LOGIN_FAIL', json_encode([
            'email' => $email,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $userId);
    }

    private function clearFailures($email, $ip) {
        $stmt = $this->pdo->prepare(
            'DELETE FROM auth_tentativa_login
             WHERE username = :email OR ip = :ip'
        );
        $stmt->execute([':email' => $email, ':ip' => $ip]);
    }

    private function invalidCredentials() {
        return [
            'success' => false,
            'message' => 'Email ou senha inválidos.',
        ];
    }
}
