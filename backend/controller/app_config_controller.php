<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../service/AppConfigService.php';

header('Content-Type: application/json; charset=utf-8');
requerPerfil(['admin']);

$pdo = (new Database())->connect();
$acao = $_POST['acao'] ?? $_GET['acao'] ?? 'listar';

try {
    if ($acao === 'listar') {
        echo json_encode(['success' => true, 'data' => AppConfigService::list($pdo)], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($acao !== 'atualizar') {
        throw new InvalidArgumentException('Ação inválida.');
    }

    $raw = $_POST['configuracoes'] ?? '';
    $values = is_array($raw) ? $raw : json_decode((string) $raw, true);
    if (!is_array($values)) {
        throw new InvalidArgumentException('Configurações inválidas.');
    }

    $pdo->beginTransaction();
    $updated = AppConfigService::update($pdo, $values, $_SESSION['id'] ?? null);
    Logger::system($pdo, 'ADMIN', 'UPDATE_CONFIG', 'app_config', null, ['keys' => array_keys($updated)]);
    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Configurações atualizadas.', 'data' => AppConfigService::list($pdo)], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    apiExceptionResponse($e, 'app_config_controller', 'Não foi possível atualizar as configurações.');
}
