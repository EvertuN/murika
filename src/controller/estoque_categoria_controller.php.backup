<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../model/estoque_categoria_model.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->connect();
$categoriaModel = new CategoriaModel($db);

$acao = $_POST['acao'] ?? $_GET['acao'] ?? '';

switch($acao) {
    case 'cadastrar':
        $nome = trim($_POST['nome_categoria'] ?? '');
        
        if(empty($nome)) {
            echo json_encode(['success' => false, 'message' => 'Nome da categoria é obrigatório']);
            break;
        }

        if($categoriaModel->existe($nome)) {
            echo json_encode(['success' => false, 'message' => 'Categoria já existe']);
            break;
        }

        $resultado = $categoriaModel->cadastrar($nome);
        if($resultado['success']) {
            echo json_encode(['success' => true, 'message' => 'Categoria cadastrada com sucesso!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erro ao cadastrar categoria']);
        }
        break;

    case 'listar':
        $categorias = $categoriaModel->listar();
        echo json_encode(['success' => true, 'data' => $categorias]);
        break;

    case 'deletar':
        requerAutenticacao();
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'message' => 'Acesso negado. Apenas administradores podem deletar categorias.']);
            break;
        }
        $id = $_POST['id'] ?? 0;
        if($categoriaModel->deletar($id)) {
            echo json_encode(['success' => true, 'message' => 'Categoria deletada com sucesso!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erro ao deletar categoria']);
        }
        break;

    case 'editar':
        requerAutenticacao();
        if (!isAdmin()) {
            echo json_encode(['success' => false, 'message' => 'Acesso negado. Apenas administradores podem editar categorias.']);
            break;
        }
        $id = $_POST['id'] ?? 0;
        $nome = trim($_POST['nome_categoria'] ?? '');
        
        if($categoriaModel->editar($id, $nome)) {
            echo json_encode(['success' => true, 'message' => 'Categoria atualizada com sucesso!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erro ao editar categoria']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Ação inválida']);
}
