<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->connect();

$acao = $_POST['acao'] ?? $_GET['acao'] ?? '';

switch($acao) {
    case 'cadastrar':
        cadastrarFuncionario($db);
        break;
    case 'listar':
        listarFuncionarios($db);
        break;
    case 'editar':
        editarFuncionario($db);
        break;
    case 'deletar':
        deletarFuncionario($db);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Ação inválida']);
}

function cadastrarFuncionario($db) {
    $nome = trim($_POST['nome'] ?? '');
    $id_cargo = intval($_POST['id_cargo'] ?? 0);
    
    if (empty($nome)) {
        echo json_encode(['success' => false, 'message' => 'Nome do funcionário é obrigatório']);
        return;
    }
    
    if ($id_cargo <= 0) {
        echo json_encode(['success' => false, 'message' => 'Selecione um cargo válido']);
        return;
    }
    
    try {
        $stmt = $db->prepare("INSERT INTO hotel_funcionarios (nome, id_cargo) VALUES (:nome, :cargo)");
        $stmt->execute([':nome' => $nome, ':cargo' => $id_cargo]);
        echo json_encode(['success' => true, 'message' => 'Funcionário cadastrado com sucesso!']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Erro ao cadastrar funcionário']);
    }
}

function listarFuncionarios($db) {
    try {
        $sql = "SELECT f.id_funcionario, f.nome, f.id_cargo, c.cargo 
                FROM hotel_funcionarios f 
                LEFT JOIN hotel_cargo c ON f.id_cargo = c.id_cargo 
                ORDER BY f.nome";
        $stmt = $db->query($sql);
        $funcionarios = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
        echo json_encode(['success' => true, 'data' => $funcionarios]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Erro ao listar funcionários']);
    }
}

function editarFuncionario($db) {
    requerAutenticacao();
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Acesso negado. Apenas administradores podem editar funcionários.']);
        return;
    }
    
    $id = intval($_POST['id'] ?? 0);
    $nome = trim($_POST['nome'] ?? '');
    $id_cargo = intval($_POST['id_cargo'] ?? 0);
    
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID inválido']);
        return;
    }
    
    if (empty($nome)) {
        echo json_encode(['success' => false, 'message' => 'Nome do funcionário é obrigatório']);
        return;
    }
    
    if ($id_cargo <= 0) {
        echo json_encode(['success' => false, 'message' => 'Selecione um cargo válido']);
        return;
    }
    
    try {
        $stmt = $db->prepare("UPDATE hotel_funcionarios SET nome = :nome, id_cargo = :cargo WHERE id_funcionario = :id");
        $stmt->execute([':nome' => $nome, ':cargo' => $id_cargo, ':id' => $id]);
        echo json_encode(['success' => true, 'message' => 'Funcionário atualizado com sucesso!']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Erro ao atualizar funcionário']);
    }
}

function deletarFuncionario($db) {
    requerAutenticacao();
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Acesso negado. Apenas administradores podem deletar funcionários.']);
        return;
    }
    
    $id = intval($_POST['id'] ?? 0);
    
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID inválido']);
        return;
    }
    
    try {
        $stmt = $db->prepare("DELETE FROM hotel_funcionarios WHERE id_funcionario = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(['success' => true, 'message' => 'Funcionário deletado com sucesso!']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Erro ao deletar funcionário']);
    }
}
