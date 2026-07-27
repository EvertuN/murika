<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../service/EstoqueConsumoService.php';

header('Content-Type: application/json; charset=utf-8');

$acao = $_POST['acao'] ?? $_GET['acao'] ?? '';
switch ($acao) {
    case 'registrar': registrarMovimentacao(); break;
    case 'listar_estoque': listarEstoque(); break;
    case 'listar_historico': listarHistorico(); break;
    case 'resumo': obterResumo(); break;
    case 'listar_itens_por_local': listarItens(); break;
    case 'atualizar_minimo': atualizarMinimo(); break;
    case 'corrigir_movimentacao': corrigirMovimentacao(); break;
    default: apiJsonResponse(false, null, 'Ação inválida.', 400, 'INVALID_ACTION');
}

function conexaoEstoque(): PDO
{
    return (new Database())->connect();
}

function registrarMovimentacao(): void
{
    $pdo = conexaoEstoque();
    try {
        $pdo->beginTransaction();
        if (!isAuthenticated()) throw new InvalidArgumentException('Usuário não autenticado');
        $payload = [
            'tipo' => $_POST['tipo'] ?? '',
            'tipo_consumo' => $_POST['tipo_consumo'] ?? '',
            'id_reserva' => $_POST['id_reserva'] ?? null,
            'id_item' => $_POST['id_item'] ?? 0,
            'quantidade' => $_POST['quantidade'] ?? 0,
            'valor_unitario' => $_POST['valor_unitario'] ?? null,
            'justificativa_valor' => $_POST['justificativa_valor'] ?? '',
            'pode_sobrescrever_valor' => isAdmin(),
            'responsavel_consumo' => $_POST['responsavel_consumo'] ?? '',
            'id_forma_pagamento' => $_POST['id_forma_pagamento'] ?? null,
            'codigo_autorizacao' => $_POST['codigo_autorizacao'] ?? null,
            'is_prazo' => intval($_POST['is_prazo'] ?? 0) === 1,
            'cobrar_na_reserva' => intval($_POST['cobrar_na_reserva'] ?? 0) === 1,
            'registrar_sem_pagamento' => intval($_POST['registrar_sem_pagamento'] ?? 0) === 1,
            'observacao' => $_POST['observacao'] ?? '',
            'id_usuario' => $_SESSION['id'] ?? null,
            'responsavel' => $_SESSION['nome'] ?? 'Usuário',
        ];
        $isConsumo = ($payload['tipo'] ?? '') === 'saida' && trim((string) $payload['tipo_consumo']) !== '';
        $result = $isConsumo
            ? EstoqueConsumoService::registrarConsumo($pdo, $payload)
            : EstoqueConsumoService::registrarMovimentacao($pdo, $payload);
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => $isConsumo ? 'Consumo registrado com sucesso!' : 'Movimentação registrada com sucesso!', 'data' => $result]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        apiExceptionResponse($e, 'estoque_movimentacao_controller::registrar', 'Não foi possível registrar a movimentação.');
    }
}

function listarEstoque(): void
{
    $pdo = conexaoEstoque();
    $stmt = $pdo->query("SELECT i.id_item, i.nome, i.preco_venda, c.nome_categoria,
                               COALESCE(e.quantidade_atual, 0) AS quantidade_atual,
                               COALESCE(e.quantidade_minima, 10) AS quantidade_minima
                        FROM estoque_item i
                        LEFT JOIN estoque_categorias_item c ON c.id_categoria = i.id_categoria
                        LEFT JOIN estoque_quantidade e ON e.id_item = i.id_item
                        WHERE i.is_deleted = 0 AND COALESCE(c.is_deleted, 0) = 0
                        ORDER BY i.nome");
    $itens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($itens as &$item) {
        $item['status'] = intval($item['quantidade_atual']) >= intval($item['quantidade_minima']) ? 'OK' : 'Baixo';
    }
    echo json_encode(['success' => true, 'data' => $itens]);
}

function listarHistorico(): void
{
    $pdo = conexaoEstoque();
    $pagina = max(1, intval($_GET['pagina'] ?? 1));
    $limite = min(100, max(1, intval($_GET['limite'] ?? 50)));
    $offset = ($pagina - 1) * $limite;
    $data = trim((string) ($_GET['data'] ?? ''));
    $where = $data !== '' ? 'WHERE DATE(m.data_movimentacao) = :data' : '';
    $params = $data !== '' ? [':data' => $data] : [];

    $count = $pdo->prepare("SELECT COUNT(*) FROM estoque_movimentacao m {$where}");
    $count->execute($params);
    $total = intval($count->fetchColumn());

    $sql = "SELECT m.id_movimentacao, m.tipo, m.quantidade, m.quantidade_corrigida,
                   COALESCE(m.quantidade_corrigida, m.quantidade) AS quantidade_efetiva,
                   m.corrigida, m.motivo_correcao, DATE_FORMAT(m.corrigida_em, '%d/%m/%Y %H:%i') AS corrigida_em,
                   u.nome AS corrigida_por_nome, m.quantidade_anterior, m.quantidade_posterior,
                   m.observacao, m.responsavel, c.tipo_consumo, c.id_reserva, c.valor_sugerido,
                   c.valor_unitario, c.valor_total, c.valor_sobrescrito, c.justificativa_valor,
                   c.responsavel_consumo, c.codigo_autorizacao, c.is_prazo, c.status_pagamento,
                   fp.nome_forma_pagamento, r.codigo_reserva, hc.nome AS cliente_nome,
                   DATE_FORMAT(m.data_movimentacao, '%d/%m/%Y %H:%i') AS data_formatada,
                   m.data_movimentacao, i.nome AS nome_item
            FROM estoque_movimentacao m
            INNER JOIN estoque_item i ON i.id_item = m.id_item
            LEFT JOIN hospedagem_reserva_consumo c ON c.id_movimentacao = m.id_movimentacao
            LEFT JOIN financeiro_forma_pagamento fp ON fp.id_forma_pagamento = c.id_forma_pagamento
            LEFT JOIN hospedagem_reserva r ON r.id_reserva = c.id_reserva
            LEFT JOIN hospedagem_cliente_dados hc ON hc.id_cliente = r.id_cliente
            LEFT JOIN auth_users u ON u.id = m.corrigida_por
            {$where}
            ORDER BY m.data_movimentacao DESC LIMIT :limite OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) $stmt->bindValue($key, $value);
    $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $movimentacoes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($movimentacoes as &$mov) {
        $mov['quantidade_formatada'] = ($mov['tipo'] === 'entrada' ? '+' : '-') . $mov['quantidade_efetiva'];
    }
    echo json_encode(['success' => true, 'data' => $movimentacoes, 'paginacao' => [
        'pagina_atual' => $pagina,
        'total_paginas' => (int) ceil($total / $limite),
        'total_registros' => $total,
    ]]);
}

function corrigirMovimentacao(): void
{
    $pdo = conexaoEstoque();
    try {
        if (!isAdmin()) throw new InvalidArgumentException('Somente administradores podem corrigir movimentações.');
        $id = intval($_POST['id_movimentacao'] ?? 0);
        $nova = intval($_POST['quantidade_corrigida'] ?? -1);
        $motivo = trim((string) ($_POST['motivo'] ?? ''));
        if ($id <= 0 || $nova < 0 || $motivo === '') throw new InvalidArgumentException('Informe movimentação, quantidade e motivo válidos.');
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("SELECT m.*, i.nome AS nome_item FROM estoque_movimentacao m INNER JOIN estoque_item i ON i.id_item=m.id_item WHERE id_movimentacao=:id FOR UPDATE");
        $stmt->execute([':id' => $id]);
        $mov = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$mov) throw new InvalidArgumentException('Movimentação não encontrada.');
        $atual = $mov['quantidade_corrigida'] !== null ? intval($mov['quantidade_corrigida']) : intval($mov['quantidade']);
        if ($nova === $atual) throw new InvalidArgumentException('A quantidade informada é igual à atual.');
        $delta = ($mov['tipo'] === 'entrada' ? 1 : -1) * ($nova - $atual);
        $saldo = $pdo->prepare("SELECT quantidade_atual FROM estoque_quantidade WHERE id_item=:id FOR UPDATE");
        $saldo->execute([':id' => $mov['id_item']]);
        $quantidade = intval($saldo->fetchColumn()) + $delta;
        if ($quantidade < 0) throw new InvalidArgumentException('Correção deixaria o estoque negativo.');
        $pdo->prepare("UPDATE estoque_quantidade SET quantidade_atual=:qtd WHERE id_item=:id")->execute([':qtd' => $quantidade, ':id' => $mov['id_item']]);
        $pdo->prepare("UPDATE estoque_movimentacao SET quantidade_corrigida=:qtd,corrigida=1,motivo_correcao=:motivo,corrigida_por=:usuario,corrigida_em=NOW() WHERE id_movimentacao=:id")
            ->execute([':qtd' => $nova, ':motivo' => $motivo, ':usuario' => $_SESSION['id'] ?? null, ':id' => $id]);
        $pdo->prepare("UPDATE hospedagem_reserva_consumo SET quantidade=:qtd,valor_total=valor_unitario*:qtd WHERE id_movimentacao=:id")
            ->execute([':qtd' => $nova, ':id' => $id]);
        Logger::system($pdo, 'INVENTORY', 'CORRECT', 'estoque_movimentacao', $id, ['item' => $mov['nome_item'], 'quantidade_anterior' => $atual, 'quantidade_corrigida' => $nova, 'motivo' => $motivo]);
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Movimentação corrigida com sucesso.', 'data' => ['quantidade_estoque' => $quantidade]]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        apiExceptionResponse($e, 'estoque_movimentacao_controller::corrigir', 'Não foi possível corrigir a movimentação.');
    }
}

function obterResumo(): void
{
    $pdo = conexaoEstoque();
    $hoje = date('Y-m-d');
    $stmt = $pdo->prepare("SELECT SUM(tipo='entrada') entradas, SUM(tipo='saida') saidas FROM estoque_movimentacao WHERE DATE(data_movimentacao)=:hoje");
    $stmt->execute([':hoje' => $hoje]);
    $mov = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $itens = intval($pdo->query('SELECT COUNT(*) FROM estoque_quantidade')->fetchColumn());
    echo json_encode(['success' => true, 'data' => ['entradas_hoje' => intval($mov['entradas'] ?? 0), 'saidas_hoje' => intval($mov['saidas'] ?? 0), 'total_itens' => $itens]]);
}

function listarItens(): void
{
    $pdo = conexaoEstoque();
    $stmt = $pdo->query("SELECT i.id_item,i.nome,i.preco_venda,c.nome_categoria FROM estoque_item i LEFT JOIN estoque_categorias_item c ON c.id_categoria=i.id_categoria WHERE i.is_deleted=0 AND COALESCE(c.is_deleted,0)=0 ORDER BY i.nome");
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function atualizarMinimo(): void
{
    $pdo = conexaoEstoque();
    try {
        if (!isAdmin()) throw new InvalidArgumentException('Somente administradores podem alterar o estoque mínimo.');
        $id = intval($_POST['id_item'] ?? 0);
        $minimo = intval($_POST['minimo'] ?? -1);
        if ($id <= 0 || $minimo < 0) throw new InvalidArgumentException('Item ou quantidade mínima inválida.');
        $stmt = $pdo->prepare("INSERT INTO estoque_quantidade (id_item,quantidade_atual,quantidade_minima) VALUES (:id,0,:minimo) ON DUPLICATE KEY UPDATE quantidade_minima=VALUES(quantidade_minima)");
        $stmt->execute([':id' => $id, ':minimo' => $minimo]);
        echo json_encode(['success' => true, 'message' => 'Quantidade mínima atualizada']);
    } catch (Throwable $e) {
        apiExceptionResponse($e, 'estoque_movimentacao_controller::atualizar_minimo', 'Não foi possível atualizar o estoque mínimo.');
    }
}
