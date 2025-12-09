<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->connect();

$acao = $_POST['acao'] ?? $_GET['acao'] ?? '';

switch($acao) {
    case 'cadastrar':
        cadastrarCargo($db);
        break;
    case 'listar':
        listarCargos($db);
        break;
    case 'editar':
        editarCargo($db);
        break;
    case 'deletar':
        deletarCargo($db);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Ação inválida']);
}

function cadastrarCargo($db) {
    $cargo = trim($_POST['cargo'] ?? '');
    
    if (empty($cargo)) {
        echo json_encode(['success' => false, 'message' => 'Nome do cargo é obrigatório']);
        return;
    }
    
    try {
        $stmt = $db->prepare("INSERT INTO hotel_cargo (cargo) VALUES (:cargo)");
        $stmt->execute([':cargo' => $cargo]);
        echo json_encode(['success' => true, 'message' => 'Cargo cadastrado com sucesso!']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Erro ao cadastrar cargo']);
    }
}

function listarCargos($db) {
    try {
        $sql = "SELECT id_cargo, cargo FROM hotel_cargo ORDER BY cargo";
        $stmt = $db->query($sql);
        $cargos = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
        echo json_encode(['success' => true, 'data' => $cargos]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Erro ao listar cargos']);
    }
}

function editarCargo($db) {
    requerAutenticacao();
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Acesso negado. Apenas administradores podem editar cargos.']);
        return;
    }
    
    $id = intval($_POST['id'] ?? 0);
    $cargo = trim($_POST['cargo'] ?? '');
    
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID inválido']);
        return;
    }
    
    if (empty($cargo)) {
        echo json_encode(['success' => false, 'message' => 'Nome do cargo é obrigatório']);
        return;
    }
    
    try {
        $stmt = $db->prepare("UPDATE hotel_cargo SET cargo = :cargo WHERE id_cargo = :id");
        $stmt->execute([':cargo' => $cargo, ':id' => $id]);
        echo json_encode(['success' => true, 'message' => 'Cargo atualizado com sucesso!']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Erro ao atualizar cargo']);
    }
}

function deletarCargo($db) {
    requerAutenticacao();
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Acesso negado. Apenas administradores podem deletar cargos.']);
        return;
    }
    
    $id = intval($_POST['id'] ?? 0);
    
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID inválido']);
        return;
    }
    
    try {
        $stmt = $db->prepare("DELETE FROM hotel_cargo WHERE id_cargo = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(['success' => true, 'message' => 'Cargo deletado com sucesso!']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Erro ao deletar cargo']);
    }
}
