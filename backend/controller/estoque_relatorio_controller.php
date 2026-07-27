<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../service/AppConfigService.php';

$acao = $_POST['acao'] ?? $_GET['acao'] ?? '';
if ($acao !== '') {
    header('Content-Type: application/json; charset=utf-8');
    if ($acao !== 'gerar_relatorio') {
        apiJsonResponse(false, null, 'Ação inválida.', 400, 'INVALID_ACTION');
        exit;
    }
    gerarRelatorioEstoque();
    exit;
}

renderizarRelatorioEstoque();

function validarDataRelatorio(string $data): string
{
    $valor = DateTimeImmutable::createFromFormat('!Y-m-d', $data);
    if (!$valor || $valor->format('Y-m-d') !== $data) {
        throw new InvalidArgumentException('Data inválida.');
    }
    return $data;
}

function validarHoraRelatorio(string $hora): string
{
    if ($hora === '') return '';
    $valor = DateTimeImmutable::createFromFormat('!H:i', $hora);
    if (!$valor || $valor->format('H:i') !== $hora) throw new InvalidArgumentException('Hora inválida.');
    return $hora;
}

function parametrosPeriodoRelatorio(): array
{
    $legado = (string) ($_GET['data'] ?? '');
    $dataInicio = validarDataRelatorio((string) ($_GET['data_inicio'] ?? ($legado ?: date('Y-m-d'))));
    $dataFim = validarDataRelatorio((string) ($_GET['data_fim'] ?? ($legado ?: $dataInicio)));
    $horaInicio = validarHoraRelatorio(trim((string) ($_GET['hora_inicio'] ?? '')));
    $horaFim = validarHoraRelatorio(trim((string) ($_GET['hora_fim'] ?? '')));
    $inicio = new DateTimeImmutable($dataInicio . ' ' . ($horaInicio ?: '00:00') . ':00');
    $fim = new DateTimeImmutable($dataFim . ' ' . ($horaFim ?: '23:59') . ':59');
    if ($fim < $inicio) throw new InvalidArgumentException('O fim do período deve ser posterior ao início.');
    return [$dataInicio, $dataFim, $horaInicio, $horaFim, $inicio, $fim];
}

function gerarRelatorioEstoque(): void
{
    requerPerfil(['admin', 'financeiro']);

    try {
        [$dataInicio, $dataFim, $horaInicio, $horaFim] = parametrosPeriodoRelatorio();
        $baseUrl = (isHttpsRequest() ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
        $query = http_build_query(array_filter([
            'data_inicio' => $dataInicio,
            'data_fim' => $dataFim,
            'hora_inicio' => $horaInicio,
            'hora_fim' => $horaFim,
        ], static fn ($value) => $value !== ''));
        $url = $baseUrl . dirname($_SERVER['PHP_SELF'] ?? '/api') . '/estoque_relatorio_controller.php?' . $query;
        echo json_encode([
            'success' => true,
            'data' => ['url' => $url],
            'url' => $url,
            'message' => 'Relatório gerado com sucesso.',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } catch (Throwable $e) {
        apiExceptionResponse($e, 'estoque_relatorio_controller::gerar', 'Não foi possível gerar o relatório.');
    }
}

function renderizarRelatorioEstoque(): void
{
    requerPerfil(['admin', 'financeiro']);

    $pdo = (new Database())->connect();
    try {
        [$dataInicio, $dataFim, $horaInicio, $horaFim, $inicioDate, $fimDate] = parametrosPeriodoRelatorio();
        $maximoDias = max(1, AppConfigService::getInt($pdo, 'report_max_range_days', 366));
        if ((int) $inicioDate->diff($fimDate)->days > $maximoDias) {
            throw new InvalidArgumentException("O relatório aceita no máximo {$maximoDias} dias por consulta.");
        }
    } catch (Throwable $e) {
        $resolved = resolveApiException($e, 'estoque_relatorio_controller::exibir', 'Não foi possível exibir o relatório.');
        http_response_code($resolved['status']);
        echo htmlspecialchars($resolved['message'], ENT_QUOTES, 'UTF-8');
        return;
    }

    $inicio = $inicioDate->format('Y-m-d H:i:s');
    $fim = $fimDate->format('Y-m-d H:i:s');

    $stmtItens = $pdo->prepare("
        SELECT i.id_item, i.nome, c.nome_categoria,
               COALESCE(eq.quantidade_atual, 0) AS saldo_atual,
               COALESCE(eq.quantidade_minima, 10) AS quantidade_minima,
               COALESCE(SUM(CASE
                   WHEN m.data_movimentacao > :fim
                   THEN IF(m.tipo = 'entrada', 1, -1) * COALESCE(m.quantidade_corrigida, m.quantidade)
                   ELSE 0 END), 0) AS variacao_posterior,
               COALESCE(SUM(CASE
                   WHEN m.data_movimentacao >= :inicio AND m.data_movimentacao <= :fim2
                   THEN IF(m.tipo = 'entrada', 1, -1) * COALESCE(m.quantidade_corrigida, m.quantidade)
                   ELSE 0 END), 0) AS variacao_dia,
               COALESCE(SUM(CASE
                   WHEN m.data_movimentacao >= :inicio2 AND m.data_movimentacao <= :fim3 AND m.tipo = 'entrada'
                   THEN COALESCE(m.quantidade_corrigida, m.quantidade) ELSE 0 END), 0) AS entradas,
               COALESCE(SUM(CASE
                   WHEN m.data_movimentacao >= :inicio3 AND m.data_movimentacao <= :fim4 AND m.tipo = 'saida'
                   THEN COALESCE(m.quantidade_corrigida, m.quantidade) ELSE 0 END), 0) AS saidas
        FROM estoque_item i
        LEFT JOIN estoque_categorias_item c ON c.id_categoria = i.id_categoria
        LEFT JOIN estoque_quantidade eq ON eq.id_item = i.id_item
        LEFT JOIN estoque_movimentacao m ON m.id_item = i.id_item
        WHERE i.is_deleted = 0 AND COALESCE(c.is_deleted, 0) = 0
        GROUP BY i.id_item, i.nome, c.nome_categoria, eq.quantidade_atual, eq.quantidade_minima
        ORDER BY c.nome_categoria, i.nome
    ");
    $stmtItens->execute([
        ':inicio' => $inicio,
        ':inicio2' => $inicio,
        ':inicio3' => $inicio,
        ':fim' => $fim,
        ':fim2' => $fim,
        ':fim3' => $fim,
        ':fim4' => $fim,
    ]);
    $itens = $stmtItens->fetchAll(PDO::FETCH_ASSOC);
    if (AppConfigService::getInt($pdo, 'report_include_zero_stock', 1) !== 1) {
        $itens = array_values(array_filter($itens, static fn ($item) =>
            (int) $item['saldo_atual'] !== 0 || (int) $item['entradas'] !== 0 || (int) $item['saidas'] !== 0
        ));
    }

    $stmtMovimentos = $pdo->prepare("
        SELECT DATE_FORMAT(m.data_movimentacao, '%d/%m/%Y %H:%i') AS horario,
               i.nome AS item, m.tipo,
               COALESCE(m.quantidade_corrigida, m.quantidade) AS quantidade,
               m.observacao, m.responsavel, c.tipo_consumo,
               c.valor_sugerido, c.valor_unitario, c.valor_total,
               c.valor_sobrescrito, c.justificativa_valor, c.responsavel_consumo,
               r.codigo_reserva
        FROM estoque_movimentacao m
        INNER JOIN estoque_item i ON i.id_item = m.id_item
        LEFT JOIN hospedagem_reserva_consumo c ON c.id_movimentacao = m.id_movimentacao
        LEFT JOIN hospedagem_reserva r ON r.id_reserva = c.id_reserva
        WHERE m.data_movimentacao >= :inicio AND m.data_movimentacao <= :fim
        ORDER BY m.data_movimentacao
    ");
    $stmtMovimentos->execute([':inicio' => $inicio, ':fim' => $fim]);
    $movimentos = $stmtMovimentos->fetchAll(PDO::FETCH_ASSOC);

    Logger::system($pdo, 'REPORT', 'GENERATE', 'estoque', null, [
        'data_inicio' => $dataInicio,
        'data_fim' => $dataFim,
        'hora_inicio' => $horaInicio ?: null,
        'hora_fim' => $horaFim ?: null,
        'usuario' => $_SESSION['nome'] ?? 'Usuário',
    ]);

    $e = static fn ($value): string => htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    $formatarValor = static fn ($value): string => 'R$ ' . number_format((float) $value, 2, ',', '.');
    $periodoExibicao = $inicioDate->format('d/m/Y H:i') . ' a ' . $fimDate->format('d/m/Y H:i');

    header('Content-Type: text/html; charset=utf-8');
    ?>
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Relatório de estoque - <?= $e($periodoExibicao) ?></title>
    <style>
        :root { color-scheme: light; font-family: Arial, sans-serif; color: #111; }
        body { margin: 28px; }
        header { display: flex; justify-content: space-between; gap: 24px; align-items: end; border-bottom: 3px solid #000; padding-bottom: 12px; }
        h1 { margin: 0; font-size: 24px; }
        h2 { margin: 28px 0 10px; font-size: 18px; }
        p { margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #bbb; padding: 7px; text-align: left; vertical-align: top; }
        th { background: #111; color: #fff; }
        .number { text-align: right; white-space: nowrap; }
        .low { color: #a40000; font-weight: 700; }
        .empty { padding: 18px; color: #666; text-align: center; }
        .actions { margin: 18px 0; }
        button { background: #000; color: #fff; border: 0; padding: 10px 16px; cursor: pointer; }
        @media print { body { margin: 0; } .actions { display: none; } }
    </style>
</head>
<body>
    <header>
        <div>
            <h1>Relatório de estoque</h1>
            <p>Estoque unificado — período personalizado</p>
        </div>
        <div>
            <p><strong>Período:</strong> <?= $e($periodoExibicao) ?></p>
            <p><strong>Gerado por:</strong> <?= $e($_SESSION['nome'] ?? 'Usuário') ?></p>
        </div>
    </header>
    <div class="actions"><button type="button" onclick="window.print()">Imprimir / salvar em PDF</button></div>

    <h2>Posição dos itens</h2>
    <table>
        <thead><tr><th>Categoria</th><th>Item</th><th class="number">Inicial</th><th class="number">Entradas</th><th class="number">Saídas</th><th class="number">Final</th><th class="number">Mínimo</th></tr></thead>
        <tbody>
        <?php foreach ($itens as $item):
            $final = (int) $item['saldo_atual'] - (int) $item['variacao_posterior'];
            $inicial = $final - (int) $item['variacao_dia'];
            $baixo = $final < (int) $item['quantidade_minima'];
        ?>
            <tr>
                <td><?= $e($item['nome_categoria'] ?? '-') ?></td>
                <td><?= $e($item['nome']) ?></td>
                <td class="number"><?= $inicial ?></td>
                <td class="number"><?= (int) $item['entradas'] ?></td>
                <td class="number"><?= (int) $item['saidas'] ?></td>
                <td class="number <?= $baixo ? 'low' : '' ?>"><?= $final ?></td>
                <td class="number"><?= (int) $item['quantidade_minima'] ?></td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$itens): ?><tr><td colspan="7" class="empty">Nenhum item cadastrado.</td></tr><?php endif; ?>
        </tbody>
    </table>

    <h2>Movimentações</h2>
    <table>
        <thead><tr><th>Hora</th><th>Item</th><th>Operação</th><th class="number">Qtd.</th><th>Consumo / vínculo</th><th class="number">Valor</th><th>Observação</th></tr></thead>
        <tbody>
        <?php foreach ($movimentos as $mov):
            $vinculo = $mov['tipo_consumo'] ?: '-';
            if ($mov['codigo_reserva']) $vinculo .= ' · ' . $mov['codigo_reserva'];
            if ($mov['responsavel_consumo']) $vinculo .= ' · ' . $mov['responsavel_consumo'];
            $observacao = trim(implode(' · ', array_filter([$mov['observacao'], $mov['justificativa_valor']])), ' ·');
        ?>
            <tr>
                <td><?= $e($mov['horario']) ?></td>
                <td><?= $e($mov['item']) ?></td>
                <td><?= $mov['tipo'] === 'entrada' ? 'Entrada' : 'Saída' ?></td>
                <td class="number"><?= (int) $mov['quantidade'] ?></td>
                <td><?= $e($vinculo) ?></td>
                <td class="number"><?= $mov['valor_total'] !== null ? $e($formatarValor($mov['valor_total'])) : '-' ?></td>
                <td><?= $e($observacao ?: '-') ?></td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$movimentos): ?><tr><td colspan="7" class="empty">Nenhuma movimentação registrada nesta data.</td></tr><?php endif; ?>
        </tbody>
    </table>
</body>
</html>
    <?php
}
