<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../model/auth_usuario_model.php';

// Função de log simplificada para usar com Database
function log_event_usuario($action, $details = [], $userId = null) {
    try {
        $database = new Database();
        $db = $database->connect();
        
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
        $detailsJson = json_encode($details, JSON_UNESCAPED_UNICODE);

        // Se userId não for passado, tenta pegar da sessão
        if ($userId === null && isset($_SESSION['id'])) {
            $userId = $_SESSION['id'];
        }

        $stmt = $db->prepare("INSERT INTO auth_logs (user_id, action, details, ip) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, $action, $detailsJson, $ip]);
    } catch (Exception $e) {
        // Silently fail logging to not disrupt application flow
        error_log("Failed to log event: " . $e->getMessage());
    }
}

header('Content-Type: application/json');

// Verificar autenticação
requerAutenticacao();

// Verificar se é admin para operações de CRUD
$acao = $_POST['acao'] ?? $_GET['acao'] ?? '';

// Ações que requerem admin
$acoesAdmin = ['cadastrar', 'editar', 'deletar', 'listar'];
if (in_array($acao, $acoesAdmin) && !isAdmin()) {
    echo json_encode(['success' => false, 'message' => 'Acesso negado. Apenas administradores podem realizar esta operação.']);
    exit;
}

$database = new Database();
$db = $database->connect();
$usuarioModel = new UsuarioModel($db);

switch($acao) {
    case 'cadastrar':
        $nome = trim($_POST['nome'] ?? '');
        $usuario = trim($_POST['usuario'] ?? '');
        $senha = $_POST['senha'] ?? '';
        $tipo = $_POST['tipo'] ?? 'usuario';
        $id_cargo = !empty($_POST['id_cargo']) ? $_POST['id_cargo'] : null;
        
        if(empty($nome) || empty($usuario) || empty($senha)) {
            echo json_encode(['success' => false, 'message' => 'Todos os campos são obrigatórios']);
            break;
        }

        if($usuarioModel->existe($usuario)) {
            echo json_encode(['success' => false, 'message' => 'Usuário já existe']);
            break;
        }

        if (!in_array($tipo, ['usuario', 'admin'])) {
            echo json_encode(['success' => false, 'message' => 'Tipo de usuário inválido']);
            break;
        }

        $resultado = $usuarioModel->cadastrar($nome, $usuario, $senha, $tipo, $id_cargo);
        if($resultado['success']) {
            log_event_usuario('CREATE_USER', ['new_user_id' => $resultado['id'], 'new_username' => $usuario, 'role' => $tipo]);
            echo json_encode(['success' => true, 'message' => 'Usuário cadastrado com sucesso!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erro ao cadastrar usuário: ' . ($resultado['message'] ?? '')]);
        }
        break;

    case 'listar':
        $usuarios = $usuarioModel->listar();
        echo json_encode(['success' => true, 'data' => $usuarios]);
        break;

    case 'deletar':
        $id = $_POST['id'] ?? '';
        
        // Não permitir deletar a si mesmo
        if ($id === $_SESSION['id']) {
            echo json_encode(['success' => false, 'message' => 'Você não pode deletar seu próprio usuário']);
            break;
        }
        
        if($usuarioModel->deletar($id)) {
            log_event_usuario('DELETE_USER', ['target_user_id' => $id]);
            echo json_encode(['success' => true, 'message' => 'Usuário deletado com sucesso!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erro ao deletar usuário']);
        }
        break;

    case 'editar':
        $id = $_POST['id'] ?? '';
        $nome = trim($_POST['nome'] ?? '');
        $usuario = trim($_POST['usuario'] ?? '');
        $tipo = $_POST['tipo'] ?? 'usuario';
        $ativo = isset($_POST['ativo']) ? 1 : 0;
        $senha = !empty($_POST['senha']) ? $_POST['senha'] : null;
        $id_cargo = !empty($_POST['id_cargo']) ? $_POST['id_cargo'] : null;
        
        if(empty($nome) || empty($usuario)) {
            echo json_encode(['success' => false, 'message' => 'Nome e usuário são obrigatórios']);
            break;
        }

        if($usuarioModel->existe($usuario, $id)) {
            echo json_encode(['success' => false, 'message' => 'Usuário já existe']);
            break;
        }

        if (!in_array($tipo, ['usuario', 'admin'])) {
            echo json_encode(['success' => false, 'message' => 'Tipo de usuário inválido']);
            break;
        }

        if($usuarioModel->editar($id, $nome, $usuario, $tipo, $ativo, $senha, $id_cargo)) {
            log_event_usuario('UPDATE_USER', ['target_user_id' => $id, 'changes' => ['nome' => $nome, 'usuario' => $usuario, 'tipo' => $tipo, 'ativo' => $ativo]]);
            echo json_encode(['success' => true, 'message' => 'Usuário atualizado com sucesso!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erro ao editar usuário']);
        }
        break;

    case 'alterar_senha':
        // Permite qualquer usuário autenticado alterar sua própria senha
        $senhaAtual = $_POST['senha_atual'] ?? '';
        $novaSenha = $_POST['nova_senha'] ?? '';
        $confirmarSenha = $_POST['confirmar_senha'] ?? '';
        $userId = $_SESSION['id'];
        
        if(empty($senhaAtual) || empty($novaSenha) || empty($confirmarSenha)) {
            echo json_encode(['success' => false, 'message' => 'Todos os campos são obrigatórios']);
            break;
        }

        if($novaSenha !== $confirmarSenha) {
            echo json_encode(['success' => false, 'message' => 'A nova senha e a confirmação não correspondem']);
            break;
        }

        $resultado = $usuarioModel->alterarSenha($userId, $senhaAtual, $novaSenha);
        if($resultado['success']) {
            log_event_usuario('CHANGE_PASSWORD');
            echo json_encode(['success' => true, 'message' => $resultado['message']]);
        } else {
            echo json_encode(['success' => false, 'message' => $resultado['message']]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Ação inválida']);
}

