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
    
    try {
        $pdo->beginTransaction();
        
        $nome = trim($_POST['nome'] ?? '');
        $id_categoria = intval($_POST['id_categoria'] ?? 0);
        $controla_frigobar = isset($_POST['controla_frigobar']) ? 1 : 0;
        
        if (empty($nome)) { 
            throw new Exception('Nome do item é obrigatório');
        }
        if ($id_categoria <= 0) { 
            throw new Exception('Selecione uma categoria válida');
        }
        
        // Inserir item
        $stmt = $pdo->prepare("INSERT INTO estoque_item (nome, id_categoria, controla_frigobar) VALUES (:nome, :idc, :fg)");
        $stmt->execute([':nome' => $nome, ':idc' => $id_categoria, ':fg' => $controla_frigobar]);
        $id_item = $pdo->lastInsertId();
        
        // Criar registro de estoque para recepção (todos os itens têm estoque em recepção)
        $stmt = $pdo->prepare("INSERT INTO estoque_quantidade (id_item, local, quantidade_atual, quantidade_minima) VALUES (:id, 'recepcao', 0, 10)");
        $stmt->execute([':id' => $id_item]);
        
        // Se controla frigobar, criar também registro de estoque para frigobar
        if ($controla_frigobar == 1) {
            $stmt = $pdo->prepare("INSERT INTO estoque_quantidade (id_item, local, quantidade_atual, quantidade_minima) VALUES (:id, 'frigobar', 0, 10)");
            $stmt->execute([':id' => $id_item]);
        }
        
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Item cadastrado com sucesso!']);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
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
    requerAutenticacao();
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Acesso negado. Apenas administradores podem editar itens.']);
        return;
    }

    $db = new Database();
    $pdo = $db->connect();
    
    try {
        $pdo->beginTransaction();
        
        $id = intval($_POST['id'] ?? 0);
        $nome = trim($_POST['nome'] ?? '');
        $id_categoria = intval($_POST['id_categoria'] ?? 0);
        $controla_frigobar = isset($_POST['controla_frigobar']) ? 1 : 0;
        
        if ($id <= 0) { 
            throw new Exception('ID inválido');
        }
        if (empty($nome)) { 
            throw new Exception('Nome do item é obrigatório');
        }
        if ($id_categoria <= 0) { 
            throw new Exception('Selecione uma categoria válida');
        }
        
        // Buscar valor anterior de controla_frigobar
        $stmt = $pdo->prepare("SELECT controla_frigobar FROM estoque_item WHERE id_item = :id");
        $stmt->execute([':id' => $id]);
        $item_anterior = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$item_anterior) {
            throw new Exception('Item não encontrado');
        }
        
        $controla_frigobar_anterior = intval($item_anterior['controla_frigobar']);
        
        // Atualizar item
        $stmt = $pdo->prepare("UPDATE estoque_item SET nome = :nome, id_categoria = :idc, controla_frigobar = :fg WHERE id_item = :id");
        $stmt->execute([':nome' => $nome, ':idc' => $id_categoria, ':fg' => $controla_frigobar, ':id' => $id]);
        
        // Verificar se precisa criar ou remover registro de estoque de frigobar
        if ($controla_frigobar == 1 && $controla_frigobar_anterior == 0) {
            // Item agora controla frigobar, criar registro de estoque se não existir
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM estoque_quantidade WHERE id_item = :id AND local = 'frigobar'");
            $stmt->execute([':id' => $id]);
            $existe = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            if ($existe == 0) {
                $stmt = $pdo->prepare("INSERT INTO estoque_quantidade (id_item, local, quantidade_atual, quantidade_minima) VALUES (:id, 'frigobar', 0, 10)");
                $stmt->execute([':id' => $id]);
            }
        } elseif ($controla_frigobar == 0 && $controla_frigobar_anterior == 1) {
            // Item não controla mais frigobar, remover registro de estoque de frigobar
            // Mas manter movimentações históricas, apenas remover o estoque atual
            $stmt = $pdo->prepare("DELETE FROM estoque_quantidade WHERE id_item = :id AND local = 'frigobar'");
            $stmt->execute([':id' => $id]);
        }
        
        // Garantir que existe registro de estoque em recepção
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM estoque_quantidade WHERE id_item = :id AND local = 'recepcao'");
        $stmt->execute([':id' => $id]);
        $existe_recepcao = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        if ($existe_recepcao == 0) {
            $stmt = $pdo->prepare("INSERT INTO estoque_quantidade (id_item, local, quantidade_atual, quantidade_minima) VALUES (:id, 'recepcao', 0, 10)");
            $stmt->execute([':id' => $id]);
        }
        
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Item atualizado com sucesso!']);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

require_once __DIR__ . '/../config/auth.php';

function deletarItem() {
    requerAutenticacao();
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Acesso negado. Apenas administradores podem deletar itens.']);
        return;
    }

    $db = new Database();
    $pdo = $db->connect();
    $id = intval($_POST['id'] ?? 0);
    if ($id <= 0) { echo json_encode(['success' => false, 'message' => 'ID inválido']); return; }
    $stmt = $pdo->prepare("DELETE FROM estoque_item WHERE id_item = :id");
    $ok = $stmt->execute([':id' => $id]);
    echo json_encode($ok ? ['success' => true, 'message' => 'Item deletado com sucesso!'] : ['success' => false, 'message' => 'Erro ao deletar item']);
}
