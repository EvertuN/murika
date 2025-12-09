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
            $limit = 50;
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
                $whereClause = "WHERE 1=1"; // Mostrar tudo de auth_logs
            } elseif ($type === 'system') {
                $table = "system_logs";
                $whereClause = "WHERE category != 'REPORT'"; // Mostrar tudo menos relatórios
            } elseif ($type === 'reports') {
                $table = "system_logs";
                $whereClause = "WHERE category = 'REPORT'";
            } else {
                // 'all' -> Vamos focar em system_logs por enquanto ou fazer UNION? 
                // Para simplificar e evitar erros de coluna, 'all' mostra system_logs (auditoria geral).
                // Acessos ficam separados.
                $type = 'system';
                $table = "system_logs"; 
                $whereClause = "WHERE category != 'REPORT'";
            }
            
            // Contar total para paginação com filtro
            $sqlCount = "SELECT COUNT(*) FROM $table l $whereClause";
            $stmtCount = $db->prepare($sqlCount);
            if (!empty($params)) {
                $stmtCount->execute($params);
            } else {
                $stmtCount->execute();
            }
            $total = $stmtCount->fetchColumn();

            // Buscar logs
            $sql = "
                SELECT l.*, u.nome as user_name 
                FROM $table l 
                LEFT JOIN auth_users u ON l.user_id = u.id 
                $whereClause
                ORDER BY l.created_at DESC 
                LIMIT :limit OFFSET :offset
            ";
            
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
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false, 
                'message' => 'Erro interno ao buscar logs: ' . $e->getMessage()
            ]);
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
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Erro ao buscar logs: ' . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Ação inválida']);
}