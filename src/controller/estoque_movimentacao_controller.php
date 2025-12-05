<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json');

$acao = $_POST['acao'] ?? $_GET['acao'] ?? '';

switch($acao) {
    case 'registrar':
        registrarMovimentacao();
        break;
    case 'listar_estoque':
        listarEstoque();
        break;
    case 'listar_historico':
        listarHistorico();
        break;
    case 'resumo':
        obterResumo();
        break;
    case 'listar_itens_por_local':
        listarItensPorLocal();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Ação inválida']);
}

function registrarMovimentacao() {
    $db = new Database();
    $pdo = $db->connect();
    
    try {
        $pdo->beginTransaction();
        
        // Check authentication
        if (!isAuthenticated()) {
            throw new Exception('Usuário não autenticado');
        }
        
        $id_usuario = intval($_SESSION['id']);
        $nome_usuario = $_SESSION['nome'];
        
        $tipo = $_POST['tipo'] ?? '';
        $id_item = intval($_POST['id_item'] ?? 0);
        $quantidade = intval($_POST['quantidade'] ?? 0);
        $observacao = trim($_POST['observacao'] ?? '');
        $responsavel = $nome_usuario; // Use logged user name
        
        // Determinar local baseado no select (0 = recepcao, 1 = frigobar)
        $local_input = $_POST['local'] ?? '';
        if ($local_input === '0' || $local_input === 'recepcao') {
            $local = 'recepcao';
        } elseif ($local_input === '1' || $local_input === 'frigobar') {
            $local = 'frigobar';
        } else {
            throw new Exception('Local inválido');
        }
        
        // Validações
        if (!in_array($tipo, ['entrada', 'saida'])) {
            throw new Exception('Tipo de movimentação inválido');
        }
        if ($id_item <= 0) {
            throw new Exception('Item inválido');
        }
        if ($quantidade <= 0) {
            throw new Exception('Quantidade deve ser maior que zero');
        }
        
        // Buscar quantidade atual do item no local específico
        $stmt = $pdo->prepare("SELECT quantidade_atual FROM estoque_quantidade WHERE id_item = :id AND local = :local");
        $stmt->execute([':id' => $id_item, ':local' => $local]);
        $estoque = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$estoque) {
            // Se não existe registro de estoque para este local, criar com quantidade 0
            $stmt = $pdo->prepare("INSERT INTO estoque_quantidade (id_item, local, quantidade_atual, quantidade_minima) VALUES (:id, :local, 0, 10)");
            $stmt->execute([':id' => $id_item, ':local' => $local]);
            $quantidade_anterior = 0;
        } else {
            $quantidade_anterior = intval($estoque['quantidade_atual']);
        }
        
        // Calcular nova quantidade
        if ($tipo === 'entrada') {
            $quantidade_posterior = $quantidade_anterior + $quantidade;
            
            // Se for entrada no frigobar, diminuir automaticamente da recepção
            if ($local === 'frigobar') {
                // Buscar estoque na recepção
                $stmt = $pdo->prepare("SELECT quantidade_atual FROM estoque_quantidade WHERE id_item = :id AND local = 'recepcao'");
                $stmt->execute([':id' => $id_item]);
                $estoque_recepcao = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$estoque_recepcao) {
                    // Se não existe estoque na recepção, criar com 0
                    $stmt = $pdo->prepare("INSERT INTO estoque_quantidade (id_item, local, quantidade_atual, quantidade_minima) VALUES (:id, 'recepcao', 0, 10)");
                    $stmt->execute([':id' => $id_item]);
                    $quantidade_anterior_recepcao = 0;
                } else {
                    $quantidade_anterior_recepcao = intval($estoque_recepcao['quantidade_atual']);
                }
                
                // Verificar se tem estoque suficiente na recepção
                if ($quantidade_anterior_recepcao < $quantidade) {
                    throw new Exception('Quantidade insuficiente no estoque da recepção');
                }
                
                // Diminuir da recepção
                $quantidade_posterior_recepcao = $quantidade_anterior_recepcao - $quantidade;
                $stmt = $pdo->prepare("UPDATE estoque_quantidade SET quantidade_atual = :qtd WHERE id_item = :id AND local = 'recepcao'");
                $stmt->execute([':qtd' => $quantidade_posterior_recepcao, ':id' => $id_item]);
                
                // Registrar saída na recepção (movimentação automática)
                $stmt = $pdo->prepare("INSERT INTO estoque_movimentacao (id_item, id_usuario, local, tipo, quantidade, quantidade_anterior, quantidade_posterior, observacao, responsavel) VALUES (:id_item, :id_usuario, 'recepcao', 'saida', :qtd, :qtd_ant, :qtd_pos, :obs, :resp)");
                $stmt->execute([
                    ':id_item' => $id_item,
                    ':id_usuario' => $id_usuario,
                    ':qtd' => $quantidade,
                    ':qtd_ant' => $quantidade_anterior_recepcao,
                    ':qtd_pos' => $quantidade_posterior_recepcao,
                    ':obs' => 'Transferência automática para frigobar',
                    ':resp' => $responsavel
                ]);
            }
        } else {
            $quantidade_posterior = $quantidade_anterior - $quantidade;
            if ($quantidade_posterior < 0) {
                throw new Exception('Quantidade insuficiente em estoque');
            }
        }
        
        // Atualizar estoque no local específico
        $stmt = $pdo->prepare("UPDATE estoque_quantidade SET quantidade_atual = :qtd WHERE id_item = :id AND local = :local");
        $stmt->execute([':qtd' => $quantidade_posterior, ':id' => $id_item, ':local' => $local]);
        
        // Registrar movimentação com local
        $stmt = $pdo->prepare("INSERT INTO estoque_movimentacao (id_item, id_usuario, local, tipo, quantidade, quantidade_anterior, quantidade_posterior, observacao, responsavel) VALUES (:id_item, :id_usuario, :local, :tipo, :qtd, :qtd_ant, :qtd_pos, :obs, :resp)");
        $stmt->execute([
            ':id_item' => $id_item,
            ':id_usuario' => $id_usuario,
            ':local' => $local,
            ':tipo' => $tipo,
            ':qtd' => $quantidade,
            ':qtd_ant' => $quantidade_anterior,
            ':qtd_pos' => $quantidade_posterior,
            ':obs' => $observacao,
            ':resp' => $responsavel
        ]);
        
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Movimentação registrada com sucesso!']);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function listarEstoque() {
    $db = new Database();
    $pdo = $db->connect();
    
    $local = $_GET['local'] ?? ''; // 'recepcao' ou 'frigobar'
    
    // Validar local
    if (!in_array($local, ['recepcao', 'frigobar'])) {
        echo json_encode(['success' => false, 'message' => 'Local inválido']);
        return;
    }
    
    // Buscar itens que têm estoque no local especificado
    // Para recepção: todos os itens (controla_frigobar = 0 ou 1, mas com estoque em recepcao)
    // Para frigobar: apenas itens que controlam frigobar (controla_frigobar = 1) e têm estoque em frigobar
    $sql = "SELECT 
                i.id_item,
                i.nome,
                c.nome_categoria,
                COALESCE(e.quantidade_atual, 0) as quantidade_atual,
                COALESCE(e.quantidade_minima, 10) as quantidade_minima,
                i.controla_frigobar
            FROM estoque_item i
            LEFT JOIN estoque_categorias_item c ON i.id_categoria = c.id_categoria
            LEFT JOIN estoque_quantidade e ON i.id_item = e.id_item AND e.local = :local
            WHERE (:local = 'recepcao' OR i.controla_frigobar = 1)
            ORDER BY i.nome";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':local' => $local]);
    $itens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Adicionar status baseado na quantidade
    foreach ($itens as &$item) {
        $qtd_atual = intval($item['quantidade_atual']);
        $qtd_min = intval($item['quantidade_minima']);
        $item['status'] = $qtd_atual >= $qtd_min ? 'OK' : 'Baixo';
    }
    
    echo json_encode(['success' => true, 'data' => $itens]);
}

function listarHistorico() {
    $db = new Database();
    $pdo = $db->connect();
    
    $limite = intval($_GET['limite'] ?? 50);
    
    $sql = "SELECT 
                m.id_movimentacao,
                m.tipo,
                m.local,
                m.quantidade,
                m.quantidade_anterior,
                m.quantidade_posterior,
                m.observacao,
                m.responsavel,
                DATE_FORMAT(m.data_movimentacao, '%d/%m/%Y %H:%i') as data_formatada,
                m.data_movimentacao,
                i.nome as nome_item
            FROM estoque_movimentacao m
            INNER JOIN estoque_item i ON m.id_item = i.id_item
            ORDER BY m.data_movimentacao DESC
            LIMIT :limite";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);
    $stmt->execute();
    $movimentacoes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formatar dados
    foreach ($movimentacoes as &$mov) {
        // Formatar nome do local
        $mov['local'] = ucfirst($mov['local'] ?? 'Recepção');
        $mov['quantidade_formatada'] = ($mov['tipo'] === 'entrada' ? '+' : '-') . $mov['quantidade'];
    }
    
    echo json_encode(['success' => true, 'data' => $movimentacoes]);
}

function obterResumo() {
    $db = new Database();
    $pdo = $db->connect();
    
    $hoje = date('Y-m-d');
    
    // Entradas hoje
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM estoque_movimentacao WHERE tipo = 'entrada' AND DATE(data_movimentacao) = :hoje");
    $stmt->execute([':hoje' => $hoje]);
    $entradas_hoje = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Saídas hoje
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM estoque_movimentacao WHERE tipo = 'saida' AND DATE(data_movimentacao) = :hoje");
    $stmt->execute([':hoje' => $hoje]);
    $saidas_hoje = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Itens com estoque em recepção (todos os itens podem ter estoque em recepção)
    $stmt = $pdo->query("SELECT COUNT(DISTINCT id_item) as total FROM estoque_quantidade WHERE local = 'recepcao'");
    $itens_recepcao = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Itens com estoque em frigobar (apenas itens que controlam frigobar)
    $stmt = $pdo->query("SELECT COUNT(DISTINCT id_item) as total FROM estoque_quantidade WHERE local = 'frigobar'");
    $itens_frigobar = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo json_encode([
        'success' => true,
        'data' => [
            'entradas_hoje' => intval($entradas_hoje),
            'saidas_hoje' => intval($saidas_hoje),
            'itens_recepcao' => intval($itens_recepcao),
            'itens_frigobar' => intval($itens_frigobar)
        ]
    ]);
}

function listarItensPorLocal() {
    $db = new Database();
    $pdo = $db->connect();
    
    $local = $_GET['local'] ?? ''; // '0' para recepção, '1' para frigobar
    
    // Determinar o local real
    if ($local === '0' || $local === 'recepcao') {
        $local_real = 'recepcao';
        // Para recepção, mostrar todos os itens (todos podem ter estoque em recepção)
        $sql = "SELECT 
                    i.id_item,
                    i.nome,
                    c.nome_categoria
                FROM estoque_item i
                LEFT JOIN estoque_categorias_item c ON i.id_categoria = c.id_categoria
                ORDER BY i.nome";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
    } elseif ($local === '1' || $local === 'frigobar') {
        $local_real = 'frigobar';
        // Para frigobar, apenas itens que controlam frigobar
    $sql = "SELECT 
                i.id_item,
                i.nome,
                c.nome_categoria
            FROM estoque_item i
            LEFT JOIN estoque_categorias_item c ON i.id_categoria = c.id_categoria
                WHERE i.controla_frigobar = 1
            ORDER BY i.nome";
    $stmt = $pdo->prepare($sql);
        $stmt->execute();
    } else {
        echo json_encode(['success' => false, 'message' => 'Local inválido']);
        return;
    }
    
    $itens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $itens]);
}