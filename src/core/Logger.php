<?php
/**
 * Logger - Sistema de Logs Centralizado
 * 
 * Responsável por registrar ações dos usuários no sistema.
 */

class Logger {
    /**
     * Log Genérico (Legado/Auth) - Mantido para compatibilidade
     * Grava em auth_logs
     */
    public static function log($db, $action, $details, $userId = null) {
        self::auth($db, $action, $details, $userId);
    }

    /**
     * Log de Autenticação/Segurança (auth_logs)
     */
    public static function auth($db, $action, $details, $userId = null) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $userId = $userId ?? $_SESSION['id'] ?? null;
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        
        if (!$userId && $action !== 'LOGIN_FAIL') return; 

        // Garantir JSON no details (para auth_logs antigo que agora exige JSON)
        $detailsToSave = $details;
        $decoded = json_decode($details);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded) && !is_object($decoded)) {
            $detailsToSave = json_encode(['msg' => $details]);
        }

        try {
            $stmt = $db->prepare("INSERT INTO auth_logs (user_id, action, details, ip) VALUES (?, ?, ?, ?)");
            $stmt->execute([$userId, $action, $detailsToSave, $ip]);
        } catch (Exception $e) {
            file_put_contents(__DIR__ . '/../../logger_err.txt', date('Y-m-d H:i:s') . " - Auth Error: " . $e->getMessage() . "\n", FILE_APPEND);
            error_log("Logger Auth Error: " . $e->getMessage());
        }
    }

    /**
     * Log de Sistema/Negócio (system_logs)
     * 
     * @param PDO $db
     * @param string $category SYSTEM, INVENTORY, REPORT, ADMIN
     * @param string $action CREATE, UPDATE, DELETE, etc
     * @param string $entity Nome da tabela ou entidade
     * @param string|int|null $targetId ID do registro afetado
     * @param array $details Array de dados (diff, snapshot)
     * @param string|null $userId
     */
    public static function system($db, $category, $action, $entity, $targetId, array $details = [], $userId = null) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $userId = $userId ?? $_SESSION['id'] ?? null;
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;

        // Se detalhes vazio, virar array vazio
        $jsonDetails = json_encode($details, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        try {
            // Verifica se tabela existe (opcional, pode causar overhead, melhor garantir na migration)
            $stmt = $db->prepare("
                INSERT INTO system_logs 
                (user_id, category, action, target_entity, target_id, details, ip) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $userId, 
                $category, 
                $action, 
                $entity, 
                $targetId, 
                $jsonDetails, 
                $ip
            ]);
        } catch (Exception $e) {
            file_put_contents(__DIR__ . '/../../logger_err.txt', date('Y-m-d H:i:s') . " - System Error: " . $e->getMessage() . "\n", FILE_APPEND);
            error_log("Logger System Error: " . $e->getMessage());
        }
    }

    /**
     * Helper para CRUD automático (system_logs)
     */
    public static function logCrud($db, $entity, $action, $id, $name = '', $diff = []) {
        $category = 'SYSTEM';
        if (in_array($entity, ['itens', 'movimentacoes', 'categorias'])) $category = 'INVENTORY';
        if (in_array($entity, ['funcionarios', 'cargos', 'usuarios'])) $category = 'ADMIN';

        $details = ['diff' => $diff];
        if ($name) $details['name'] = $name;

        self::system($db, $category, $action, $entity, $id, $details);
    }
}
