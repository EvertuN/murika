<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json; charset=utf-8');

try {
    requerPerfil(['admin', 'financeiro']);

    $acao = $_GET['acao'] ?? $_POST['acao'] ?? 'dashboard';
    if ($acao !== 'dashboard') {
        apiJsonResponse(false, null, 'Ação inválida.', 400, 'INVALID_ACTION');
        exit;
    }

    $database = new Database();
    $pdo = $database->connect();
    [$inicio, $fim, $periodoLabel, $mes, $ano] = periodoFinanceiro();

    echo json_encode([
        'success' => true,
        'data' => [
            'periodo' => [
                'inicio' => $inicio,
                'fim' => $fim,
                'label' => $periodoLabel,
                'mes' => $mes,
                'ano' => $ano,
            ],
            'resumo' => resumoFinanceiro($pdo, $inicio, $fim),
            'pagamentos' => pagamentosPorForma($pdo, $inicio, $fim),
            'quartos' => totaisPorQuarto($pdo, $inicio, $fim),
            'tipos_quarto' => totaisPorTipoQuarto($pdo, $inicio, $fim),
            'estoque' => resumoEstoque($pdo, $inicio, $fim),
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    apiExceptionResponse($e, 'financeiro_controller', 'Não foi possível carregar o dashboard financeiro.');
}

function periodoFinanceiro(): array
{
    $dataInicio = trim((string) ($_GET['data_inicio'] ?? $_POST['data_inicio'] ?? ''));
    $dataFim = trim((string) ($_GET['data_fim'] ?? $_POST['data_fim'] ?? ''));

    if ($dataInicio !== '' && $dataFim !== '') {
        $inicio = DateTime::createFromFormat('Y-m-d', $dataInicio) ?: new DateTime('first day of this month');
        $fim = DateTime::createFromFormat('Y-m-d', $dataFim) ?: new DateTime('last day of this month');
        if ($fim < $inicio) {
            [$inicio, $fim] = [$fim, $inicio];
        }
        return [
            $inicio->format('Y-m-d'),
            $fim->format('Y-m-d'),
            $inicio->format('d/m/Y') . ' a ' . $fim->format('d/m/Y'),
            (int) $inicio->format('m'),
            (int) $inicio->format('Y'),
        ];
    }

    $mes = (int) ($_GET['mes'] ?? $_POST['mes'] ?? date('n'));
    $ano = (int) ($_GET['ano'] ?? $_POST['ano'] ?? date('Y'));
    if ($mes < 1 || $mes > 12) $mes = (int) date('n');
    if ($ano < 2000 || $ano > 2100) $ano = (int) date('Y');

    $inicio = new DateTime(sprintf('%04d-%02d-01', $ano, $mes));
    $fim = clone $inicio;
    $fim->modify('last day of this month');

    return [
        $inicio->format('Y-m-d'),
        $fim->format('Y-m-d'),
        str_pad((string) $mes, 2, '0', STR_PAD_LEFT) . '/' . $ano,
        $mes,
        $ano,
    ];
}

function resumoFinanceiro(PDO $pdo, string $inicio, string $fim): array
{
    $recebimentos = recebimentosMurika($pdo, $inicio, $fim);

    $stmt = $pdo->prepare("
        SELECT
            COUNT(*) as total_reservas,
            SUM(CASE WHEN r.status = 'FECHADA' THEN 1 ELSE 0 END) as reservas_fechadas,
            SUM(CASE WHEN r.status = 'ABERTA' THEN 1 ELSE 0 END) as reservas_abertas,
            SUM(CASE WHEN r.sem_pagamento = 1 AND r.status <> 'CANCELADA' THEN 1 ELSE 0 END) as sem_pagamento,
            SUM(CASE WHEN r.status = 'CANCELADA' THEN 1 ELSE 0 END) as canceladas
        FROM hospedagem_reserva r
        WHERE DATE(r.created_at) BETWEEN :inicio AND :fim
    ");
    $stmt->execute([':inicio' => $inicio, ':fim' => $fim]);
    $reservas = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    return [
        'total_murika' => (float) $recebimentos['total'],
        'total_sem_prazo' => (float) $recebimentos['sem_prazo'],
        'total_prazo' => (float) $recebimentos['prazo'],
        'pagamentos' => (int) $recebimentos['pagamentos'],
        'reservas_pagas' => (int) $recebimentos['reservas_pagas'],
        'reservas_fechadas_sem_pagamento' => (int) ($reservas['sem_pagamento'] ?? 0),
        'reservas_abertas' => (int) ($reservas['reservas_abertas'] ?? 0),
        'reservas_fechadas' => (int) ($reservas['reservas_fechadas'] ?? 0),
        'reservas_canceladas' => (int) ($reservas['canceladas'] ?? 0),
    ];
}

function recebimentosMurika(PDO $pdo, string $inicio, string $fim): array
{
    $stmt = $pdo->prepare("
        SELECT
            SUM(valor) as total,
            SUM(CASE WHEN is_prazo = 1 THEN valor ELSE 0 END) as prazo,
            SUM(CASE WHEN is_prazo = 1 THEN 0 ELSE valor END) as sem_prazo,
            COUNT(*) as pagamentos,
            COUNT(DISTINCT id_reserva) as reservas_pagas
        FROM (
            SELECT p.valor, p.is_prazo, p.id_reserva
            FROM hospedagem_reserva_pagamento p
            INNER JOIN hospedagem_reserva r ON r.id_reserva = p.id_reserva
            WHERE p.data_pagamento BETWEEN :inicio_pag AND :fim_pag
              AND r.status <> 'CANCELADA'

            UNION ALL

            SELECT c.valor_total as valor, c.is_prazo, c.id_reserva
            FROM hospedagem_reserva_consumo c
            LEFT JOIN hospedagem_reserva r ON r.id_reserva = c.id_reserva
            WHERE COALESCE(c.data_pagamento, DATE(c.created_at)) BETWEEN :inicio_con AND :fim_con
              AND (c.status_pagamento = 'PAGO' OR c.status_pagamento = 'A_PRAZO' OR c.is_prazo = 1)
              AND (r.id_reserva IS NULL OR r.status <> 'CANCELADA')
        ) recebimentos
    ");
    $stmt->execute([
        ':inicio_pag' => $inicio,
        ':fim_pag' => $fim,
        ':inicio_con' => $inicio,
        ':fim_con' => $fim,
    ]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: ['total' => 0, 'prazo' => 0, 'sem_prazo' => 0, 'pagamentos' => 0, 'reservas_pagas' => 0];
}

function pagamentosPorForma(PDO $pdo, string $inicio, string $fim): array
{
    $stmt = $pdo->prepare("
        SELECT forma, SUM(valor) as total, COUNT(*) as quantidade
        FROM (
            SELECT COALESCE(f.nome_forma_pagamento, 'A PRAZO') as forma, p.valor
            FROM hospedagem_reserva_pagamento p
            LEFT JOIN financeiro_forma_pagamento f ON f.id_forma_pagamento = p.id_forma_pagamento
            INNER JOIN hospedagem_reserva r ON r.id_reserva = p.id_reserva
            WHERE p.data_pagamento BETWEEN :inicio_pag AND :fim_pag
              AND r.status <> 'CANCELADA'

            UNION ALL

            SELECT COALESCE(f.nome_forma_pagamento, 'A PRAZO') as forma, c.valor_total as valor
            FROM hospedagem_reserva_consumo c
            LEFT JOIN financeiro_forma_pagamento f ON f.id_forma_pagamento = c.id_forma_pagamento
            LEFT JOIN hospedagem_reserva r ON r.id_reserva = c.id_reserva
            WHERE COALESCE(c.data_pagamento, DATE(c.created_at)) BETWEEN :inicio_con AND :fim_con
              AND (c.status_pagamento = 'PAGO' OR c.status_pagamento = 'A_PRAZO' OR c.is_prazo = 1)
              AND (r.id_reserva IS NULL OR r.status <> 'CANCELADA')
        ) dados
        GROUP BY forma
        ORDER BY total DESC
    ");
    $stmt->execute([
        ':inicio_pag' => $inicio,
        ':fim_pag' => $fim,
        ':inicio_con' => $inicio,
        ':fim_con' => $fim,
    ]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function totaisPorQuarto(PDO $pdo, string $inicio, string $fim): array
{
    $stmt = $pdo->prepare("
        SELECT q.numero, q.tipo, SUM(p.valor) as total, COUNT(DISTINCT r.id_reserva) as reservas,
               CASE WHEN COUNT(DISTINCT r.id_reserva) > 0 THEN SUM(p.valor) / COUNT(DISTINCT r.id_reserva) ELSE 0 END as media_reserva
        FROM hospedagem_reserva_pagamento p
        INNER JOIN hospedagem_reserva r ON r.id_reserva = p.id_reserva
        INNER JOIN hotel_quarto q ON q.id_quarto = r.id_quarto
        WHERE p.data_pagamento BETWEEN :inicio AND :fim
          AND r.status <> 'CANCELADA'
        GROUP BY q.id_quarto, q.numero, q.tipo
        ORDER BY total DESC
    ");
    $stmt->execute([':inicio' => $inicio, ':fim' => $fim]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function totaisPorTipoQuarto(PDO $pdo, string $inicio, string $fim): array
{
    $stmt = $pdo->prepare("
        SELECT q.tipo, SUM(p.valor) as total, COUNT(DISTINCT r.id_reserva) as reservas,
               CASE WHEN COUNT(DISTINCT r.id_reserva) > 0 THEN SUM(p.valor) / COUNT(DISTINCT r.id_reserva) ELSE 0 END as media_reserva
        FROM hospedagem_reserva_pagamento p
        INNER JOIN hospedagem_reserva r ON r.id_reserva = p.id_reserva
        INNER JOIN hotel_quarto q ON q.id_quarto = r.id_quarto
        WHERE p.data_pagamento BETWEEN :inicio AND :fim
          AND r.status <> 'CANCELADA'
        GROUP BY q.tipo
        ORDER BY total DESC
    ");
    $stmt->execute([':inicio' => $inicio, ':fim' => $fim]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function resumoEstoque(PDO $pdo, string $inicio, string $fim): array
{
    $stmt = $pdo->prepare("
        SELECT
            SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE 0 END) as quantidade_entrada,
            SUM(CASE WHEN m.tipo = 'saida' THEN m.quantidade ELSE 0 END) as quantidade_saida,
            COUNT(CASE WHEN m.tipo = 'entrada' THEN 1 END) as movimentos_entrada,
            COUNT(CASE WHEN m.tipo = 'saida' THEN 1 END) as movimentos_saida,
            SUM(CASE WHEN m.tipo = 'saida' THEN COALESCE(c.valor_total, m.quantidade * i.preco_venda, 0) ELSE 0 END) as valor_saida
        FROM estoque_movimentacao m
        INNER JOIN estoque_item i ON i.id_item = m.id_item
        LEFT JOIN hospedagem_reserva_consumo c ON c.id_movimentacao = m.id_movimentacao
        WHERE DATE(m.data_movimentacao) BETWEEN :inicio AND :fim
    ");
    $stmt->execute([':inicio' => $inicio, ':fim' => $fim]);
    $geral = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $stmtCategoria = $pdo->prepare("
        SELECT COALESCE(cat.nome_categoria, 'Sem categoria') as categoria,
               SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE 0 END) as quantidade_entrada,
               SUM(CASE WHEN m.tipo = 'saida' THEN m.quantidade ELSE 0 END) as quantidade_saida,
               SUM(CASE WHEN m.tipo = 'saida' THEN COALESCE(c.valor_total, m.quantidade * i.preco_venda, 0) ELSE 0 END) as valor_saida
        FROM estoque_movimentacao m
        INNER JOIN estoque_item i ON i.id_item = m.id_item
        LEFT JOIN estoque_categorias_item cat ON cat.id_categoria = i.id_categoria
        LEFT JOIN hospedagem_reserva_consumo c ON c.id_movimentacao = m.id_movimentacao
        WHERE DATE(m.data_movimentacao) BETWEEN :inicio AND :fim
        GROUP BY categoria
        ORDER BY valor_saida DESC, quantidade_saida DESC
    ");
    $stmtCategoria->execute([':inicio' => $inicio, ':fim' => $fim]);

    $stmtItem = $pdo->prepare("
        SELECT i.nome, COALESCE(cat.nome_categoria, 'Sem categoria') as categoria,
               SUM(CASE WHEN m.tipo = 'saida' THEN m.quantidade ELSE 0 END) as quantidade_saida,
               SUM(CASE WHEN m.tipo = 'saida' THEN COALESCE(c.valor_total, m.quantidade * i.preco_venda, 0) ELSE 0 END) as valor_saida
        FROM estoque_movimentacao m
        INNER JOIN estoque_item i ON i.id_item = m.id_item
        LEFT JOIN estoque_categorias_item cat ON cat.id_categoria = i.id_categoria
        LEFT JOIN hospedagem_reserva_consumo c ON c.id_movimentacao = m.id_movimentacao
        WHERE DATE(m.data_movimentacao) BETWEEN :inicio AND :fim
        GROUP BY i.id_item, i.nome, categoria
        ORDER BY quantidade_saida DESC, valor_saida DESC
        LIMIT 15
    ");
    $stmtItem->execute([':inicio' => $inicio, ':fim' => $fim]);

    return [
        'geral' => [
            'quantidade_entrada' => (int) ($geral['quantidade_entrada'] ?? 0),
            'quantidade_saida' => (int) ($geral['quantidade_saida'] ?? 0),
            'movimentos_entrada' => (int) ($geral['movimentos_entrada'] ?? 0),
            'movimentos_saida' => (int) ($geral['movimentos_saida'] ?? 0),
            'valor_saida' => (float) ($geral['valor_saida'] ?? 0),
        ],
        'por_categoria' => $stmtCategoria->fetchAll(PDO::FETCH_ASSOC),
        'por_item' => $stmtItem->fetchAll(PDO::FETCH_ASSOC),
    ];
}
