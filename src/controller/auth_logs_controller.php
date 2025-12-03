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

        $limit = 50;
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $offset = ($page - 1) * $limit;

        // Buscar logs
        $sql = $db->prepare("
            SELECT l.*, u.nome as user_name 
            FROM auth_logs l 
            LEFT JOIN auth_users u ON l.user_id = u.id 
            ORDER BY l.created_at DESC 
            LIMIT :limit OFFSET :offset
        ");
        $sql->bindValue(':limit', $limit, PDO::PARAM_INT);
        $sql->bindValue(':offset', $offset, PDO::PARAM_INT);
        $sql->execute();
        $logs = $sql->fetchAll(PDO::FETCH_ASSOC);

        // Contar total para paginação
        $total = $db->query("SELECT COUNT(*) FROM auth_logs")->fetchColumn();
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
        break;

    case 'listar_usuario':
        // Usuário pode ver apenas seus próprios logs de login/logout
        $sql = $db->prepare("
            SELECT * FROM auth_logs 
            WHERE user_id = ? AND action IN ('LOGIN_SUCCESS', 'LOGOUT')
            ORDER BY created_at DESC 
            LIMIT 20
        ");
        $sql->execute([$_SESSION['id']]);
        $logs = $sql->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $logs]);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Ação inválida']);
}

