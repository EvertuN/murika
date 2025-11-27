<?php
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

$acao = $_POST['acao'] ?? $_GET['acao'] ?? '';

switch($acao) {
    case 'cadastrar':
        cadastrarItem();
        break;
    case 'listar':
        listarItens();
        break;
    case 'editar':
        editarItem();
        break;
    case 'deletar':
        deletarItem();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Ação inválida']);
}

function cadastrarItem() {
    $db = new Database();
    $pdo = $db->connect();
    $nome = trim($_POST['nome'] ?? '');
    $id_categoria = intval($_POST['id_categoria'] ?? 0);
    $controla_frigobar = isset($_POST['controla_frigobar']) ? 1 : 0;
    if (empty($nome)) { echo json_encode(['success' => false, 'message' => 'Nome do item é obrigatório']); return; }
    if ($id_categoria <= 0) { echo json_encode(['success' => false, 'message' => 'Selecione uma categoria válida']); return; }
    $stmt = $pdo->prepare("INSERT INTO estoque_item (nome, id_categoria, controla_frigobar) VALUES (:nome, :idc, :fg)");
    $ok = $stmt->execute([':nome' => $nome, ':idc' => $id_categoria, ':fg' => $controla_frigobar]);
    echo json_encode($ok ? ['success' => true, 'message' => 'Item cadastrado com sucesso!'] : ['success' => false, 'message' => 'Erro ao cadastrar item']);
}

function listarItens() {
    $db = new Database();
    $pdo = $db->connect();
    $sql = "SELECT i.id_item, i.nome, i.id_categoria, c.nome_categoria, i.controla_frigobar FROM estoque_item i LEFT JOIN estoque_categorias_item c ON i.id_categoria = c.id_categoria ORDER BY i.nome";
    $stmt = $pdo->query($sql);
    $itens = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
    echo json_encode(['success' => true, 'data' => $itens]);
}

function editarItem() {
    $db = new Database();
    $pdo = $db->connect();
    $id = intval($_POST['id'] ?? 0);
    $nome = trim($_POST['nome'] ?? '');
    $id_categoria = intval($_POST['id_categoria'] ?? 0);
    $controla_frigobar = isset($_POST['controla_frigobar']) ? 1 : 0;
    if ($id <= 0) { echo json_encode(['success' => false, 'message' => 'ID inválido']); return; }
    if (empty($nome)) { echo json_encode(['success' => false, 'message' => 'Nome do item é obrigatório']); return; }
    if ($id_categoria <= 0) { echo json_encode(['success' => false, 'message' => 'Selecione uma categoria válida']); return; }
    $stmt = $pdo->prepare("UPDATE estoque_item SET nome = :nome, id_categoria = :idc, controla_frigobar = :fg WHERE id_item = :id");
    $ok = $stmt->execute([':nome' => $nome, ':idc' => $id_categoria, ':fg' => $controla_frigobar, ':id' => $id]);
    echo json_encode($ok ? ['success' => true, 'message' => 'Item atualizado com sucesso!'] : ['success' => false, 'message' => 'Erro ao atualizar item']);
}

function deletarItem() {
    $db = new Database();
    $pdo = $db->connect();
    $id = intval($_POST['id'] ?? 0);
    if ($id <= 0) { echo json_encode(['success' => false, 'message' => 'ID inválido']); return; }
    $stmt = $pdo->prepare("DELETE FROM estoque_item WHERE id_item = :id");
    $ok = $stmt->execute([':id' => $id]);
    echo json_encode($ok ? ['success' => true, 'message' => 'Item deletado com sucesso!'] : ['success' => false, 'message' => 'Erro ao deletar item']);
}
