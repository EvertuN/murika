<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json');

// Verificar autenticação
requerAutenticacao();

$acao = $_GET['acao'] ?? 'listar';
$database = new Database();
$db = $database->connect();

switch($acao) {
    case 'listar_admin':
        // Apenas admin pode ver todos os logs
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'message' => 'Acesso negado']);
            exit;
        }

        try {
            $limit = 10;
            $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
            $offset = ($page - 1) * $limit;

            // Buscar logs
            $type = $_GET['type'] ?? 'access'; // Default mudou para 'access' ser mais seguro se 'all' for complexo
            $whereClause = "";
            $table = "system_logs"; // Padrão
            $params = []; // Initialize params, though new logic doesn't use it directly for WHERE
            
            // Definição da Query baseada no tipo
            if ($type === 'access') {
                $table = "auth_logs";
                $whereClause = "WHERE 1=1";
                $sqlCount = "SELECT COUNT(*) FROM auth_logs";
                
                $sql = "
                    SELECT l.*, u.nome as user_name, 'access' as log_source 
                    FROM auth_logs l 
                    LEFT JOIN auth_users u ON l.user_id = u.id 
                    ORDER BY l.created_at DESC 
                    LIMIT :limit OFFSET :offset
                ";
                
            } elseif ($type === 'system') {
                $table = "system_logs";
                $whereClause = "WHERE category != 'REPORT'";
                $sqlCount = "SELECT COUNT(*) FROM system_logs WHERE category != 'REPORT'";
                
                $sql = "
                    SELECT l.*, u.nome as user_name, 'system' as log_source 
                    FROM system_logs l 
                    LEFT JOIN auth_users u ON l.user_id = u.id 
                    WHERE category != 'REPORT'
                    ORDER BY l.created_at DESC 
                    LIMIT :limit OFFSET :offset
                ";
                
            } elseif ($type === 'reports') {
                $table = "system_logs";
                $whereClause = "WHERE category = 'REPORT'";
                $sqlCount = "SELECT COUNT(*) FROM system_logs WHERE category = 'REPORT'";
                
                $sql = "
                    SELECT l.*, u.nome as user_name, 'system' as log_source 
                    FROM system_logs l 
                    LEFT JOIN auth_users u ON l.user_id = u.id 
                    WHERE category = 'REPORT'
                    ORDER BY l.created_at DESC 
                    LIMIT :limit OFFSET :offset
                ";
                
            } else {
                // ALL: Union of Access + System (excluding reports)
                $sqlCount = "
                    SELECT (
                        (SELECT COUNT(*) FROM auth_logs) + 
                        (SELECT COUNT(*) FROM system_logs WHERE category != 'REPORT')
                    ) as total
                ";
                
                $sql = "
                    SELECT * FROM (
                        SELECT 
                            l.id, l.user_id, l.action, 'ACCESS' as category, l.ip, l.created_at, 
                            u.nome as user_name, l.details
                        FROM auth_logs l
                        LEFT JOIN auth_users u ON l.user_id = u.id
                        
                        UNION ALL
                        
                        SELECT 
                            l.id, l.user_id, l.action, l.category, l.ip, l.created_at,
                            u.nome as user_name, l.details
                        FROM system_logs l
                        LEFT JOIN auth_users u ON l.user_id = u.id
                        WHERE l.category != 'REPORT'
                    ) as combined_logs
                    ORDER BY created_at DESC
                    LIMIT :limit OFFSET :offset
                ";
            }
            
            // Execute Count
            $stmtCount = $db->prepare($sqlCount);
            $stmtCount->execute();
            $total = $stmtCount->fetchColumn();

            // Execute Query
            $stmt = $db->prepare($sql);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $pages = ceil($total / $limit);

            echo json_encode([
                'success' => true, 
                'data' => $logs,
                'pagination' => [
                    'current_page' => $page,
                    'total_pages' => $pages,
                    'total_records' => $total
                ]
            ]);
        } catch (Throwable $e) {
            apiExceptionResponse($e, 'auth_logs_controller::listar_admin', 'Não foi possível carregar os logs administrativos.');
        }
        break;

    case 'listar_usuario':
        // Usuário pode ver apenas seus próprios logs de login/logout
        try {
            $sql = $db->prepare("
                SELECT * FROM auth_logs 
                WHERE user_id = ? AND action IN ('LOGIN_SUCCESS', 'LOGOUT')
                ORDER BY created_at DESC 
                LIMIT 20
            ");
            $sql->execute([$_SESSION['id']]);
            $logs = $sql->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'data' => $logs]);
        } catch (Throwable $e) {
            apiExceptionResponse($e, 'auth_logs_controller::listar_usuario', 'Não foi possível carregar os logs do usuário.');
        }
        break;

    default:
        apiJsonResponse(false, null, 'Ação inválida.', 400, 'INVALID_ACTION');
}
