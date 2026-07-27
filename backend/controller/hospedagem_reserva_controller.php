<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../service/EstoqueConsumoService.php';
require_once __DIR__ . '/../service/AppConfigService.php';
require_once __DIR__ . '/../service/ReservaDiariaService.php';

header('Content-Type: application/json');

function reservaError(string $message, int $status = 422, string $code = 'VALIDATION_ERROR'): void
{
    apiJsonResponse(false, null, $message, $status, $code);
}

$acao = $_POST['acao'] ?? $_GET['acao'] ?? '';

switch ($acao) {
    case 'listar':
        listarReservas();
        break;
    case 'cadastrar':
        cadastrarReserva();
        break;
    case 'atualizar_status':
        atualizarStatusReserva();
        break;
    case 'atualizar_checkout':
        atualizarCheckoutReserva();
        break;
    case 'atualizar_valor_estadia':
        atualizarValorEstadia();
        break;
    case 'deletar':
        deletarReserva();
        break;
    case 'listar_consumos':
        listarConsumos();
        break;
    case 'adicionar_consumo':
        adicionarConsumo();
        break;
    case 'quitar_consumo':
        quitarConsumo();
        break;
    case 'deletar_consumo':
        deletarConsumo();
        break;
    case 'listar_reservas_consumo':
        listarReservasConsumo();
        break;
    case 'listar_pagamentos':
        listarPagamentos();
        break;
    case 'adicionar_pagamento':
        adicionarPagamento();
        break;
    case 'deletar_pagamento':
        deletarPagamento();
        break;
    case 'listar_formas_pagamento':
        listarFormasPagamento();
        break;
    case 'listar_quartos':
        listarQuartos();
        break;
    case 'listar_clientes':
        listarClientes();
        break;
    case 'listar_empresas':
        listarEmpresas();
        break;
    case 'listar_timeline':
        listarTimelineReserva();
        break;
    default:
        reservaError('Ação inválida.', 400, 'INVALID_ACTION');
        break;
}

function listarReservas()
{
    $db = new Database();
    $pdo = $db->connect();
    $autoFechadas = fecharReservasSemPagamentoVencidas($pdo);
    $reservaTemIdUsuario = colunaExiste($pdo, 'hospedagem_reserva', 'id_usuario');

    $page = max(1, intval($_GET['page'] ?? 1));
    $perPage = intval($_GET['per_page'] ?? 20);
    $perPage = max(1, min(100, $perPage));
    $offset = ($page - 1) * $perPage;

    $status = trim($_GET['status'] ?? '');
    $origem = trim($_GET['origem'] ?? '');
    $dataInicio = trim($_GET['data_inicio'] ?? '');
    $dataFim = trim($_GET['data_fim'] ?? '');
    $codigo = trim($_GET['codigo'] ?? '');
    $clienteEmpresa = trim($_GET['cliente_empresa'] ?? '');
    $cliente = trim($_GET['cliente'] ?? '');
    $empresa = trim($_GET['empresa'] ?? '');
    $semPagamento = $_GET['sem_pagamento'] ?? '';

    $where = [];
    $params = [];

    if ($status !== '') {
        $where[] = "r.status = :status";
        $params[':status'] = $status;
    }
    if ($origem !== '') {
        $where[] = "r.origem = :origem";
        $params[':origem'] = $origem;
    }
    if ($dataInicio !== '') {
        $where[] = "DATE(r.data_checkin) >= :data_inicio";
        $params[':data_inicio'] = $dataInicio;
    }
    if ($dataFim !== '') {
        $where[] = "DATE(r.data_checkin) <= :data_fim";
        $params[':data_fim'] = $dataFim;
    }
    if ($semPagamento === '1' || $semPagamento === '0') {
        $where[] = "r.sem_pagamento = :sem_pagamento";
        $params[':sem_pagamento'] = intval($semPagamento);
    }
    if ($codigo !== '') {
        $where[] = "r.codigo_reserva LIKE :codigo";
        $params[':codigo'] = '%' . $codigo . '%';
    }
    if ($cliente !== '') {
        $where[] = "(c.nome LIKE :cliente OR c.documento LIKE :cliente OR c.telefone LIKE :cliente OR r.codigo_reserva LIKE :cliente)";
        $params[':cliente'] = '%' . $cliente . '%';
    }
    if ($empresa !== '') {
        $where[] = "(e.razao_social LIKE :empresa OR e.cnpj LIKE :empresa OR e.telefone LIKE :empresa)";
        $params[':empresa'] = '%' . $empresa . '%';
    }
    if ($clienteEmpresa !== '') {
        $where[] = "(c.nome LIKE :cliente_empresa OR c.documento LIKE :cliente_empresa OR c.telefone LIKE :cliente_empresa OR e.razao_social LIKE :cliente_empresa OR e.cnpj LIKE :cliente_empresa OR e.telefone LIKE :cliente_empresa)";
        $params[':cliente_empresa'] = '%' . $clienteEmpresa . '%';
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $sqlCount = "SELECT COUNT(*)
            FROM hospedagem_reserva r
            LEFT JOIN hotel_quarto q ON r.id_quarto = q.id_quarto
            LEFT JOIN hospedagem_cliente_dados c ON r.id_cliente = c.id_cliente
            LEFT JOIN hospedagem_empresa_dados e ON r.id_empresa = e.id_empresa
            $whereSql";
    $stmtCount = $pdo->prepare($sqlCount);
    $stmtCount->execute($params);
    $total = intval($stmtCount->fetchColumn() ?: 0);
    $totalPages = max(1, (int) ceil($total / $perPage));

    $selectUsuarioReserva = $reservaTemIdUsuario
        ? "au_res.nome as usuario_criacao_nome"
        : "NULL as usuario_criacao_nome";
    $joinUsuarioReserva = $reservaTemIdUsuario
        ? "LEFT JOIN auth_users au_res ON au_res.id = r.id_usuario"
        : "";

    $sql = "SELECT r.*, q.numero as quarto_numero, c.nome as cliente_nome, e.razao_social as empresa_razao,
                   $selectUsuarioReserva,
                   (SELECT COUNT(*) FROM hospedagem_reserva_pagamento p WHERE p.id_reserva = r.id_reserva) as pagamentos_count
            FROM hospedagem_reserva r
            LEFT JOIN hotel_quarto q ON r.id_quarto = q.id_quarto
            LEFT JOIN hospedagem_cliente_dados c ON r.id_cliente = c.id_cliente
            LEFT JOIN hospedagem_empresa_dados e ON r.id_empresa = e.id_empresa
            $joinUsuarioReserva
            $whereSql
            ORDER BY r.id_reserva DESC
            LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $alertas = buscarAlertasReservasSemPagamento($pdo);
    $alertas['fechadas_automaticamente'] = $autoFechadas;

    echo json_encode([
        'success' => true,
        'data' => [
            'data' => $data,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => $totalPages
            ],
            'alertas' => $alertas
        ]
    ]);
}

function fecharReservasSemPagamentoVencidas(PDO $pdo): int
{
    $prazoFechamento = max(0, AppConfigService::getInt($pdo, 'reservation_auto_close_days', 2));
    $temIgnorarFechamentoAutomatico = colunaExiste($pdo, 'hospedagem_reserva', 'ignorar_fechamento_automatico');
    $filtroIgnorarFechamento = $temIgnorarFechamentoAutomatico
        ? " AND COALESCE(r.ignorar_fechamento_automatico, 0) = 0"
        : "";

    $sqlSelect = "SELECT r.id_reserva, r.codigo_reserva, r.data_checkout,
                   CASE
                       WHEN EXISTS (
                           SELECT 1
                           FROM hospedagem_reserva_pagamento p
                           WHERE p.id_reserva = r.id_reserva
                       ) THEN 0
                       ELSE 1
                   END as sem_pagamento_real
            FROM hospedagem_reserva r
            WHERE TRIM(UPPER(r.status)) = 'ABERTA'
              AND r.data_checkout IS NOT NULL
              AND DATE_ADD(DATE(r.data_checkout), INTERVAL {$prazoFechamento} DAY) <= CURDATE()
              $filtroIgnorarFechamento";
    $stmt = $pdo->query($sqlSelect);
    $reservas = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
    if (!$reservas) {
        return 0;
    }

    $ids = array_map(static fn($reserva) => intval($reserva['id_reserva']), $reservas);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmtUpdate = $pdo->prepare("UPDATE hospedagem_reserva r
            SET r.status = 'FECHADA',
                r.sem_pagamento = CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM hospedagem_reserva_pagamento p
                        WHERE p.id_reserva = r.id_reserva
                    ) THEN 0
                    ELSE 1
                END
            WHERE r.id_reserva IN ($placeholders)");
    $stmtUpdate->execute($ids);

    foreach ($reservas as $reserva) {
        logHospedagemAdmin($pdo, 'AUTO_CLOSE_UNPAID_RESERVATION', 'hospedagem_reserva', intval($reserva['id_reserva']), [
            'codigo_reserva' => $reserva['codigo_reserva'] ?? null,
            'data_checkout' => $reserva['data_checkout'] ?? null,
            'sem_pagamento' => intval($reserva['sem_pagamento_real'] ?? 0),
            'motivo' => 'Reserva aberta fechada automaticamente 48h apos checkout'
        ]);
    }

    return count($reservas);
}

function buscarAlertasReservasSemPagamento(PDO $pdo): array
{
    $temIgnorarFechamentoAutomatico = colunaExiste($pdo, 'hospedagem_reserva', 'ignorar_fechamento_automatico');
    $filtroIgnorarFechamento = $temIgnorarFechamentoAutomatico
        ? " AND COALESCE(r.ignorar_fechamento_automatico, 0) = 0"
        : "";

    $stmtAbertas = $pdo->query("SELECT COUNT(*)
            FROM hospedagem_reserva r
            WHERE TRIM(UPPER(r.status)) = 'ABERTA'
              AND NOT EXISTS (
                  SELECT 1
                  FROM hospedagem_reserva_pagamento p
                  WHERE p.id_reserva = r.id_reserva
              )");
    $abertasSemPagamento = intval($stmtAbertas ? $stmtAbertas->fetchColumn() : 0);

    $stmtIraoFechar = $pdo->query("SELECT COUNT(*)
            FROM hospedagem_reserva r
            WHERE TRIM(UPPER(r.status)) = 'ABERTA'
              AND r.data_checkout IS NOT NULL
              AND DATE(r.data_checkout) < CURDATE()
              $filtroIgnorarFechamento
              AND NOT EXISTS (
                  SELECT 1
                  FROM hospedagem_reserva_pagamento p
                  WHERE p.id_reserva = r.id_reserva
              )");
    $iraoFecharSemPagamento = intval($stmtIraoFechar ? $stmtIraoFechar->fetchColumn() : 0);

    $stmtFechadasSemPagamento = $pdo->query("SELECT COUNT(*)
            FROM hospedagem_reserva r
            WHERE TRIM(UPPER(r.status)) = 'FECHADA'
              AND r.data_checkout IS NOT NULL
              AND MONTH(r.data_checkout) = MONTH(CURDATE())
              AND YEAR(r.data_checkout) = YEAR(CURDATE())
              AND NOT EXISTS (
                  SELECT 1
                  FROM hospedagem_reserva_pagamento p
                  WHERE p.id_reserva = r.id_reserva
              )");
    $fechadasSemPagamento = intval($stmtFechadasSemPagamento ? $stmtFechadasSemPagamento->fetchColumn() : 0);

    $stmtConsumosPendentes = $pdo->query("SELECT COUNT(*)
            FROM hospedagem_reserva_consumo c
            INNER JOIN hospedagem_reserva r ON r.id_reserva = c.id_reserva
            WHERE TRIM(UPPER(r.status)) <> 'CANCELADA'
              AND c.status_pagamento = 'PENDENTE'");
    $consumosPendentesPagamento = intval($stmtConsumosPendentes ? $stmtConsumosPendentes->fetchColumn() : 0);

    return [
        'abertas_sem_pagamento' => $abertasSemPagamento,
        'irao_fechar_sem_pagamento' => $iraoFecharSemPagamento,
        'fechadas_sem_pagamento' => $fechadasSemPagamento,
        'consumos_pendentes_pagamento' => $consumosPendentesPagamento
    ];
}

function cadastrarReserva()
{
    $pdo = (new Database())->connect();

    try {
        $idQuarto = intval($_POST['id_quarto'] ?? 0);
        $idCliente = ($_POST['id_cliente'] ?? '') !== '' ? intval($_POST['id_cliente']) : null;
        $idEmpresa = ($_POST['id_empresa'] ?? '') !== '' ? intval($_POST['id_empresa']) : null;
        $origem = strtoupper(trim((string) ($_POST['origem'] ?? 'BALCAO')));
        $dataCheckin = trim((string) ($_POST['data_checkin'] ?? ''));
        $dataCheckout = trim((string) ($_POST['data_checkout'] ?? ''));
        $observacao = trim((string) ($_POST['observacao'] ?? ''));
        $semPagamentoInicial = intval($_POST['sem_pagamento_inicial'] ?? 0) === 1;
        $idUsuario = $_SESSION['id'] ?? null;

        if ($idQuarto <= 0) throw new InvalidArgumentException('Quarto é obrigatório.');
        if (!in_array($origem, ['BALCAO', 'ONLINE'], true)) throw new InvalidArgumentException('Origem inválida.');

        $checkinDate = parseReservaInputDate($dataCheckin);
        $checkoutDate = parseReservaInputDate($dataCheckout);
        if (!$checkinDate) throw new InvalidArgumentException('Informe uma data de check-in válida.');
        if (!$checkoutDate) throw new InvalidArgumentException('Informe uma data de checkout válida.');
        if ($checkoutDate <= $checkinDate) throw new InvalidArgumentException('Checkout deve ser pelo menos 1 dia posterior ao check-in.');

        if (!isAdmin()) {
            $today = new DateTimeImmutable('today');
            if ($checkinDate < $today->modify('-30 days')) throw new InvalidArgumentException('Check-in deve ser no máximo 30 dias antes de hoje.');
            if ($checkoutDate > $today->modify('+1 year')) throw new InvalidArgumentException('Checkout deve ser no máximo 1 ano à frente.');
        }

        $quantidadeDiarias = max(1, (int) $checkinDate->diff($checkoutDate)->days);
        $diariasDetalhes = ReservaDiariaService::normalizar(
            $_POST['diarias_valores'] ?? '',
            $checkinDate,
            $quantidadeDiarias
        );
        $valorEstadia = $diariasDetalhes !== null
            ? ReservaDiariaService::total($diariasDetalhes)
            : normalizarValor($_POST['valor_estadia'] ?? '');
        if ($valorEstadia <= 0) throw new InvalidArgumentException('Informe o valor das diárias.');
        $pagamento = null;
        if (!$semPagamentoInicial) {
            $pagamento = validarPagamentoInicial($pdo, $_POST);
        }

        $pdo->beginTransaction();
        $codigoReserva = gerarCodigoReserva($pdo);
        $stmt = $pdo->prepare("INSERT INTO hospedagem_reserva
            (codigo_reserva, id_quarto, id_cliente, id_empresa, origem, data_checkin, data_checkout,
             quantidade_diarias, valor_estadia, status, sem_pagamento, observacao, id_usuario)
            VALUES
            (:codigo, :quarto, :cliente, :empresa, :origem, :checkin, :checkout,
             :diarias, :valor, 'ABERTA', :sem_pagamento, :observacao, :usuario)");
        $stmt->execute([
            ':codigo' => $codigoReserva,
            ':quarto' => $idQuarto,
            ':cliente' => $idCliente,
            ':empresa' => $idEmpresa,
            ':origem' => $origem,
            ':checkin' => $checkinDate->format('Y-m-d H:i:s'),
            ':checkout' => $checkoutDate->format('Y-m-d H:i:s'),
            ':diarias' => $quantidadeDiarias,
            ':valor' => $valorEstadia,
            ':sem_pagamento' => $pagamento ? 0 : 1,
            ':observacao' => $observacao !== '' ? $observacao : null,
            ':usuario' => $idUsuario,
        ]);
        $reservaId = (int) $pdo->lastInsertId();

        $pagamentoId = null;
        if ($pagamento) {
            $pagamentoId = inserirPagamentoReserva($pdo, $reservaId, $pagamento, $idUsuario);
        }

        logHospedagemAdmin($pdo, 'CREATE', 'hospedagem_reserva', $reservaId, [
            'codigo_reserva' => $codigoReserva,
            'id_quarto' => $idQuarto,
            'id_cliente' => $idCliente,
            'id_empresa' => $idEmpresa,
            'origem' => $origem,
            'data_checkin' => $checkinDate->format('Y-m-d'),
            'data_checkout' => $checkoutDate->format('Y-m-d'),
            'quantidade_diarias' => $quantidadeDiarias,
            'valor_estadia' => $valorEstadia,
            'diarias' => $diariasDetalhes,
            'id_pagamento_inicial' => $pagamentoId,
            'sem_pagamento_inicial' => $pagamento ? 0 : 1,
        ]);

        $pdo->commit();
        echo json_encode(['success' => true, 'data' => [
            'id_reserva' => $reservaId,
            'codigo_reserva' => $codigoReserva,
            'id_pagamento' => $pagamentoId,
            'quantidade_diarias' => $quantidadeDiarias,
            'valor_estadia' => $valorEstadia,
            'diarias' => $diariasDetalhes,
        ]], JSON_UNESCAPED_UNICODE);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        apiExceptionResponse($e, 'hospedagem_reserva_controller::cadastrar', 'Não foi possível criar a reserva.');
    }
}

function validarPagamentoInicial(PDO $pdo, array $payload): array
{
    $valor = normalizarValor($payload['valor_pagamento_inicial'] ?? '');
    $data = trim((string) ($payload['data_pagamento_inicial'] ?? date('Y-m-d')));
    $isPrazo = intval($payload['pagamento_inicial_prazo'] ?? 0) === 1;
    $idForma = intval($payload['id_forma_pagamento_inicial'] ?? 0);
    $codigo = trim((string) ($payload['codigo_autorizacao_inicial'] ?? ''));
    $observacao = trim((string) ($payload['observacao_pagamento_inicial'] ?? ''));

    if ($valor <= 0) throw new InvalidArgumentException('Informe o valor do pagamento inicial.');
    $dataValida = DateTimeImmutable::createFromFormat('!Y-m-d', $data);
    if (!$dataValida || $dataValida->format('Y-m-d') !== $data) throw new InvalidArgumentException('Data do pagamento inicial inválida.');

    if (!$isPrazo) {
        if ($idForma <= 0) throw new InvalidArgumentException('Selecione a forma do pagamento inicial.');
        $stmt = $pdo->prepare('SELECT nome_forma_pagamento FROM financeiro_forma_pagamento WHERE id_forma_pagamento = :id');
        $stmt->execute([':id' => $idForma]);
        $forma = $stmt->fetchColumn();
        if ($forma === false) throw new InvalidArgumentException('Forma de pagamento inicial inválida.');
        $formaNormalizada = normalizarTexto($forma);
        $exigeCodigo = strpos($formaNormalizada, 'PIX') !== false || strpos($formaNormalizada, 'CREDITO') !== false || strpos($formaNormalizada, 'DEBITO') !== false;
        if ($exigeCodigo && $codigo === '') throw new InvalidArgumentException('Código obrigatório para a forma de pagamento inicial.');
        if (mb_strlen($codigo, 'UTF-8') > 6) throw new InvalidArgumentException('Código deve ter no máximo 6 caracteres.');
    }

    return [
        'valor' => $valor,
        'data' => $data,
        'is_prazo' => $isPrazo,
        'id_forma_pagamento' => $isPrazo ? null : $idForma,
        'codigo_autorizacao' => $isPrazo || $codigo === '' ? null : $codigo,
        'observacao' => $observacao === '' ? null : $observacao,
    ];
}

function inserirPagamentoReserva(PDO $pdo, int $reservaId, array $pagamento, ?string $idUsuario): int
{
    $stmt = $pdo->prepare("INSERT INTO hospedagem_reserva_pagamento
        (id_reserva, id_forma_pagamento, valor, data_pagamento, codigo_autorizacao, numero_nf, observacao, is_prazo, id_usuario)
        VALUES (:reserva, :forma, :valor, :data, :codigo, NULL, :observacao, :prazo, :usuario)");
    $stmt->execute([
        ':reserva' => $reservaId,
        ':forma' => $pagamento['id_forma_pagamento'],
        ':valor' => $pagamento['valor'],
        ':data' => $pagamento['data'],
        ':codigo' => $pagamento['codigo_autorizacao'],
        ':observacao' => $pagamento['observacao'],
        ':prazo' => $pagamento['is_prazo'] ? 1 : 0,
        ':usuario' => $idUsuario,
    ]);
    return (int) $pdo->lastInsertId();
}
function colunaExiste(PDO $pdo, string $tabela, string $coluna): bool
{
    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :tabela
          AND COLUMN_NAME = :coluna
    ");
    $stmt->execute([':tabela' => $tabela, ':coluna' => $coluna]);
    return intval($stmt->fetchColumn() ?: 0) > 0;
}

function gerarCodigoReserva(PDO $pdo): string
{
    $caracteres = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for ($tentativa = 0; $tentativa < 10; $tentativa++) {
        $aleatorio = '';
        for ($i = 0; $i < 8; $i++) {
            $aleatorio .= $caracteres[random_int(0, strlen($caracteres) - 1)];
        }

        $codigo = $aleatorio;
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM hospedagem_reserva WHERE codigo_reserva = :codigo");
        $stmt->execute([':codigo' => $codigo]);
        if (intval($stmt->fetchColumn()) === 0) {
            return $codigo;
        }
    }

    // Fallback extremamente improvável
    return strtoupper(bin2hex(random_bytes(3)));
}

function atualizarStatusReserva()
{
    $db = new Database();
    $pdo = $db->connect();

    $id_reserva = intval($_POST['id_reserva'] ?? 0);
    $status = strtoupper(trim($_POST['status'] ?? ''));

    if ($id_reserva <= 0) {
        reservaError('Reserva inválida.');
        return;
    }

    $statusValidos = ['ABERTA', 'FECHADA', 'CANCELADA'];
    if (!in_array($status, $statusValidos, true)) {
        reservaError('Status inválido.');
        return;
    }

    $temIgnorarFechamentoAutomatico = colunaExiste($pdo, 'hospedagem_reserva', 'ignorar_fechamento_automatico');
    $selectIgnorarFechamento = $temIgnorarFechamentoAutomatico ? ', ignorar_fechamento_automatico' : '';
    $stmtReserva = $pdo->prepare("SELECT status$selectIgnorarFechamento FROM hospedagem_reserva WHERE id_reserva = :id");
    $stmtReserva->execute([':id' => $id_reserva]);
    $reservaAtual = $stmtReserva->fetch(PDO::FETCH_ASSOC);
    $statusAtual = strtoupper((string) ($reservaAtual['status'] ?? ''));
    if ($statusAtual === '') {
        reservaError('Reserva não encontrada.', 404, 'RESERVATION_NOT_FOUND');
        return;
    }

    $justificativaAdmin = trim($_POST['justificativa_admin'] ?? '');
    $isAdminUsuario = function_exists('isAdmin') ? isAdmin() : false;
    $statusRestritoAtual = in_array($statusAtual, ['FECHADA', 'CANCELADA'], true);

    if ($statusRestritoAtual && !$isAdminUsuario) {
        reservaError('Apenas administradores podem alterar o status de uma reserva fechada ou cancelada.', 403, 'FORBIDDEN');
        return;
    }

    $alteracaoForcadaAdmin = $statusRestritoAtual && $statusAtual !== $status && $isAdminUsuario;

    $stmtPag = $pdo->prepare("SELECT COUNT(*) FROM hospedagem_reserva_pagamento WHERE id_reserva = :id");
    $stmtPag->execute([':id' => $id_reserva]);
    $totalPagamentos = intval($stmtPag->fetchColumn() ?: 0);
    $semPagamento = $totalPagamentos > 0 ? 0 : 1;
    $ignorarFechamentoAutomatico = $temIgnorarFechamentoAutomatico ? intval($reservaAtual['ignorar_fechamento_automatico'] ?? 0) : 0;
    if ($temIgnorarFechamentoAutomatico) {
        if ($status === 'ABERTA' && $statusAtual !== 'ABERTA' && $isAdminUsuario) {
            $ignorarFechamentoAutomatico = 1;
        } elseif ($status !== 'ABERTA') {
            $ignorarFechamentoAutomatico = 0;
        }
    }

    if ($status === 'FECHADA' && !$isAdminUsuario) {
        $stmtConsumoPendente = $pdo->prepare("
            SELECT COUNT(*)
            FROM hospedagem_reserva_consumo
            WHERE id_reserva = :id
              AND status_pagamento = :status_pagamento
        ");
        $stmtConsumoPendente->execute([
            ':id' => $id_reserva,
            ':status_pagamento' => EstoqueConsumoService::STATUS_PENDENTE,
        ]);
        if (intval($stmtConsumoPendente->fetchColumn() ?: 0) > 0) {
            reservaError('Resolva os consumos pendentes antes de fechar a reserva.', 409, 'PENDING_CONSUMPTIONS');
            return;
        }
    }

    if ($status === 'FECHADA' && $totalPagamentos === 0 && !$isAdminUsuario) {
        reservaError('Somente administradores podem fechar uma reserva sem pagamento.', 403, 'FORBIDDEN');
        return;
    }

    if ($temIgnorarFechamentoAutomatico) {
        $stmt = $pdo->prepare("UPDATE hospedagem_reserva SET status = :status, sem_pagamento = :sem_pagamento, ignorar_fechamento_automatico = :ignorar_fechamento_automatico WHERE id_reserva = :id");
        $stmt->execute([':status' => $status, ':sem_pagamento' => $semPagamento, ':ignorar_fechamento_automatico' => $ignorarFechamentoAutomatico, ':id' => $id_reserva]);
    } else {
        $stmt = $pdo->prepare("UPDATE hospedagem_reserva SET status = :status, sem_pagamento = :sem_pagamento WHERE id_reserva = :id");
        $stmt->execute([':status' => $status, ':sem_pagamento' => $semPagamento, ':id' => $id_reserva]);
    }

    logHospedagemAdmin($pdo, 'UPDATE_STATUS', 'hospedagem_reserva', $id_reserva, [
        'status_anterior' => $statusAtual,
        'status' => $status,
        'sem_pagamento' => $semPagamento,
        'total_pagamentos' => $totalPagamentos,
        'ignorar_fechamento_automatico' => $ignorarFechamentoAutomatico,
        'alteracao_forcada_admin' => $alteracaoForcadaAdmin ? 1 : 0,
        'justificativa_admin' => $justificativaAdmin !== '' ? $justificativaAdmin : null
    ]);

    echo json_encode(['success' => true]);
}

function atualizarValorEstadia()
{
    $pdo = (new Database())->connect();
    try {
        if (!isAdmin()) throw new InvalidArgumentException('Somente administradores podem alterar o valor da estadia.');
        $idReserva = intval($_POST['id_reserva'] ?? 0);
        $novoValor = normalizarValor($_POST['valor_estadia'] ?? '');
        $motivo = trim((string) ($_POST['motivo'] ?? ''));
        if ($idReserva <= 0 || $novoValor <= 0) throw new InvalidArgumentException('Reserva ou valor da estadia inválido.');
        if ($motivo === '') throw new InvalidArgumentException('Informe o motivo da alteração do valor.');

        $pdo->beginTransaction();
        $stmt = $pdo->prepare('SELECT valor_estadia, codigo_reserva FROM hospedagem_reserva WHERE id_reserva = :id FOR UPDATE');
        $stmt->execute([':id' => $idReserva]);
        $reserva = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$reserva) throw new InvalidArgumentException('Reserva não encontrada.');
        $valorAnterior = (float) $reserva['valor_estadia'];
        if (abs($valorAnterior - $novoValor) < 0.005) throw new InvalidArgumentException('O novo valor é igual ao valor atual.');

        $pdo->prepare('UPDATE hospedagem_reserva SET valor_estadia = :valor, valor_estadia_atualizado_em = NOW(), valor_estadia_atualizado_por = :usuario WHERE id_reserva = :id')
            ->execute([':valor' => $novoValor, ':usuario' => $_SESSION['id'] ?? null, ':id' => $idReserva]);
        logHospedagemAdmin($pdo, 'UPDATE_STAY_VALUE', 'hospedagem_reserva', $idReserva, [
            'codigo_reserva' => $reserva['codigo_reserva'],
            'valor_anterior' => $valorAnterior,
            'valor_novo' => $novoValor,
            'motivo' => $motivo,
        ]);
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Valor da estadia atualizado.', 'data' => ['valor_estadia' => $novoValor]], JSON_UNESCAPED_UNICODE);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        apiExceptionResponse($e, 'hospedagem_reserva_controller::alterar_valor_estadia', 'Não foi possível alterar o valor da estadia.');
    }
}

function atualizarCheckoutReserva()
{
    $db = new Database();
    $pdo = $db->connect();

    $id_reserva = intval($_POST['id_reserva'] ?? 0);
    $nova_data_checkout = trim($_POST['data_checkout'] ?? '');
    $motivo = trim($_POST['motivo'] ?? '');

    if ($id_reserva <= 0) {
        reservaError('Reserva inválida.');
        return;
    }

    if ($nova_data_checkout === '') {
        reservaError('Informe a nova data de checkout.');
        return;
    }

    $stmt = $pdo->prepare("SELECT id_reserva, data_checkin, data_checkout, status FROM hospedagem_reserva WHERE id_reserva = :id_reserva");
    $stmt->execute([':id_reserva' => $id_reserva]);
    $reserva = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$reserva) {
        reservaError('Reserva não encontrada.', 404, 'RESERVATION_NOT_FOUND');
        return;
    }

    if (($reserva['status'] ?? '') === 'CANCELADA') {
        reservaError('Reserva cancelada não pode ter checkout alterado.');
        return;
    }
    if (($reserva['status'] ?? '') === 'FECHADA') {
        reservaError('Reserva fechada não pode ter checkout alterado.');
        return;
    }

    $checkin = parseReservaDate($reserva['data_checkin'] ?? '');
    $checkoutAtual = parseReservaDate($reserva['data_checkout'] ?? '');
    $novoCheckout = DateTime::createFromFormat('Y-m-d', $nova_data_checkout);

    if (!$checkin || !$novoCheckout) {
        reservaError('Data inválida para checkout.');
        return;
    }

    $baseCheckoutAtual = $checkoutAtual ?: clone $checkin;
    $baseCheckoutAtual->setTime(0, 0, 0);
    $novoCheckout->setTime(0, 0, 0);

    $diferencaDias = intval($baseCheckoutAtual->diff($novoCheckout)->format('%r%a'));
    if ($diferencaDias <= 0) {
        reservaError('A nova data deve aumentar a reserva em pelo menos 1 dia.');
        return;
    }

    $quantidadeDiarias = max(1, (int) $checkin->diff($novoCheckout)->days);
    if (colunaExiste($pdo, 'hospedagem_reserva', 'ignorar_fechamento_automatico')) {
        $stmtUpdate = $pdo->prepare("UPDATE hospedagem_reserva SET data_checkout = :data_checkout, quantidade_diarias = :diarias, ignorar_fechamento_automatico = 0 WHERE id_reserva = :id_reserva");
    } else {
        $stmtUpdate = $pdo->prepare("UPDATE hospedagem_reserva SET data_checkout = :data_checkout, quantidade_diarias = :diarias WHERE id_reserva = :id_reserva");
    }
    $stmtUpdate->execute([
        ':data_checkout' => $novoCheckout->format('Y-m-d'),
        ':diarias' => $quantidadeDiarias,
        ':id_reserva' => $id_reserva
    ]);

    logHospedagemAdmin($pdo, 'UPDATE_CHECKOUT', 'hospedagem_reserva', $id_reserva, [
        'data_checkout_anterior' => $reserva['data_checkout'] ?? null,
        'data_checkout_nova' => $novoCheckout->format('Y-m-d'),
        'aumento_dias' => $diferencaDias,
        'motivo' => $motivo !== '' ? $motivo : null
    ]);

    echo json_encode([
        'success' => true,
        'data' => [
            'id_reserva' => $id_reserva,
            'data_checkout' => $novoCheckout->format('Y-m-d'),
            'aumento_dias' => $diferencaDias
        ]
    ]);
}
function listarPagamentos()
{
    $db = new Database();
    $pdo = $db->connect();
    $pagamentoTemIdUsuario = colunaExiste($pdo, 'hospedagem_reserva_pagamento', 'id_usuario');

    $id_reserva = intval($_GET['id_reserva'] ?? 0);
    if ($id_reserva <= 0) {
        reservaError('Reserva inválida');
        return;
    }

    $selectUsuarioPagamento = $pagamentoTemIdUsuario
        ? "au_pag.nome as usuario_criacao_nome"
        : "NULL as usuario_criacao_nome";
    $joinUsuarioPagamento = $pagamentoTemIdUsuario
        ? "LEFT JOIN auth_users au_pag ON au_pag.id = p.id_usuario"
        : "";

    $sql = "SELECT p.*, f.nome_forma_pagamento, $selectUsuarioPagamento
            FROM hospedagem_reserva_pagamento p
            LEFT JOIN financeiro_forma_pagamento f ON p.id_forma_pagamento = f.id_forma_pagamento
            $joinUsuarioPagamento
            WHERE p.id_reserva = :id_reserva
            ORDER BY p.id_pagamento DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id_reserva' => $id_reserva]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $data]);
}

function listarConsumos()
{
    $db = new Database();
    $pdo = $db->connect();

    $id_reserva = intval($_GET['id_reserva'] ?? 0);
    if ($id_reserva <= 0) {
        reservaError('Reserva inválida.');
        return;
    }

    $sql = "SELECT c.*, i.nome as nome_item, fp.nome_forma_pagamento,
                   COALESCE(au.nome, m.responsavel, 'Sistema') as usuario_criacao_nome,
                   DATE_FORMAT(c.created_at, '%d/%m/%Y %H:%i:%s') as data_formatada
            FROM hospedagem_reserva_consumo c
            INNER JOIN estoque_item i ON i.id_item = c.id_item
            LEFT JOIN financeiro_forma_pagamento fp ON fp.id_forma_pagamento = c.id_forma_pagamento
            LEFT JOIN estoque_movimentacao m ON m.id_movimentacao = c.id_movimentacao
            LEFT JOIN auth_users au ON au.id = c.id_usuario
            WHERE c.id_reserva = :id_reserva
            ORDER BY c.id_consumo DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id_reserva' => $id_reserva]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $data]);
}

function adicionarConsumo()
{
    $db = new Database();
    $pdo = $db->connect();

    try {
        $pdo->beginTransaction();

        if (!isAuthenticated()) {
            throw new InvalidArgumentException('Usuario nao autenticado');
        }

        $idReserva = intval($_POST['id_reserva'] ?? 0);
        if ($idReserva <= 0) {
            throw new InvalidArgumentException('Reserva invalida');
        }

        $payload = [
            'tipo' => 'saida',
            'tipo_consumo' => EstoqueConsumoService::TIPO_HOSPEDE,
            'id_reserva' => $idReserva,
            'id_item' => $_POST['id_item'] ?? 0,
            'quantidade' => $_POST['quantidade'] ?? 0,
            'valor_unitario' => $_POST['valor_unitario'] ?? null,
            'justificativa_valor' => $_POST['justificativa_valor'] ?? '',
            'pode_sobrescrever_valor' => isAdmin(),
            'id_forma_pagamento' => $_POST['id_forma_pagamento'] ?? null,
            'codigo_autorizacao' => $_POST['codigo_autorizacao'] ?? null,
            'is_prazo' => intval($_POST['is_prazo'] ?? 0) === 1,
            'cobrar_na_reserva' => intval($_POST['cobrar_na_reserva'] ?? 0) === 1,
            'registrar_sem_pagamento' => intval($_POST['registrar_sem_pagamento'] ?? 0) === 1,
            'observacao' => $_POST['observacao'] ?? '',
            'id_usuario' => $_SESSION['id'] ?? null,
            'responsavel' => $_SESSION['nome'] ?? 'Usuario',
        ];

        $result = EstoqueConsumoService::registrarConsumo($pdo, $payload);

        logHospedagemAdmin($pdo, 'ADD_CONSUMPTION', 'hospedagem_reserva', $idReserva, [
            'id_reserva' => $idReserva,
            'id_consumo' => $result['id_consumo'] ?? null,
            'id_movimentacao' => $result['id_movimentacao'] ?? null,
            'valor_total' => $result['valor_total'] ?? null,
        ]);

        $pdo->commit();
        echo json_encode(['success' => true, 'data' => $result]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        apiExceptionResponse($e, 'hospedagem_reserva_controller::registrar_consumo', 'Não foi possível registrar o consumo.');
    }
}

function quitarConsumo()
{
    $db = new Database();
    $pdo = $db->connect();

    try {
        $pdo->beginTransaction();

        if (!isAuthenticated()) {
            throw new InvalidArgumentException('Usuario nao autenticado');
        }

        $idConsumo = intval($_POST['id_consumo'] ?? 0);
        $formaQuitacao = strtoupper(trim((string) ($_POST['forma_quitacao'] ?? '')));
        $idFormaPagamento = isset($_POST['id_forma_pagamento']) && $_POST['id_forma_pagamento'] !== ''
            ? intval($_POST['id_forma_pagamento'])
            : null;
        $codigoAutorizacao = trim((string) ($_POST['codigo_autorizacao'] ?? ''));
        $observacaoQuitacao = trim((string) ($_POST['observacao'] ?? ''));

        if ($idConsumo <= 0) {
            throw new InvalidArgumentException('Consumo invalido');
        }
        if (!in_array($formaQuitacao, ['PAGAR_AGORA', 'COBRAR_NA_RESERVA', 'A_PRAZO'], true)) {
            throw new InvalidArgumentException('Forma de quitacao invalida');
        }

        $stmt = $pdo->prepare("
            SELECT c.*, r.status as reserva_status
            FROM hospedagem_reserva_consumo c
            INNER JOIN hospedagem_reserva r ON r.id_reserva = c.id_reserva
            WHERE c.id_consumo = :id
            FOR UPDATE
        ");
        $stmt->execute([':id' => $idConsumo]);
        $consumo = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$consumo) {
            throw new InvalidArgumentException('Consumo nao encontrado');
        }
        if (($consumo['tipo_consumo'] ?? '') !== EstoqueConsumoService::TIPO_HOSPEDE) {
            throw new InvalidArgumentException('Somente consumo de hospede pode ser quitado');
        }
        if (($consumo['reserva_status'] ?? '') === 'CANCELADA') {
            throw new InvalidArgumentException('Reserva cancelada nao permite quitacao');
        }
        if (($consumo['status_pagamento'] ?? '') !== EstoqueConsumoService::STATUS_PENDENTE) {
            throw new InvalidArgumentException('Somente consumo pendente pode ser quitado');
        }

        $novoStatus = EstoqueConsumoService::STATUS_PAGO;
        $isPrazo = 0;
        $dataPagamento = date('Y-m-d');

        if ($formaQuitacao === 'A_PRAZO') {
            $novoStatus = EstoqueConsumoService::STATUS_A_PRAZO;
            $isPrazo = 1;
            $idFormaPagamento = null;
            $codigoAutorizacao = '';
            $dataPagamento = null;
        } elseif ($formaQuitacao === 'COBRAR_NA_RESERVA') {
            $novoStatus = EstoqueConsumoService::STATUS_COBRADO_RESERVA;
            $idFormaPagamento = null;
            $codigoAutorizacao = '';
            $dataPagamento = null;
        } else {
            if (!$idFormaPagamento || $idFormaPagamento <= 0) {
                throw new InvalidArgumentException('Selecione a forma de pagamento');
            }
            if ($codigoAutorizacao !== '' && mb_strlen($codigoAutorizacao, 'UTF-8') > 6) {
                throw new InvalidArgumentException('Codigo deve ter no maximo 6 caracteres');
            }
            if (EstoqueConsumoService::formaPagamentoExigeCodigo($pdo, $idFormaPagamento) && $codigoAutorizacao === '') {
                throw new InvalidArgumentException('Codigo obrigatorio para esta forma');
            }
        }

        $observacaoAtual = trim((string) ($consumo['observacao'] ?? ''));
        $observacaoFinal = $observacaoAtual;
        if ($observacaoQuitacao !== '') {
            $observacaoFinal = trim($observacaoAtual . ($observacaoAtual !== '' ? "\n" : '') . 'Quitacao: ' . $observacaoQuitacao);
        }

        $stmtUpdate = $pdo->prepare("
            UPDATE hospedagem_reserva_consumo
            SET status_pagamento = :status_pagamento,
                id_forma_pagamento = :id_forma_pagamento,
                codigo_autorizacao = :codigo_autorizacao,
                is_prazo = :is_prazo,
                data_pagamento = :data_pagamento,
                observacao = :observacao
            WHERE id_consumo = :id_consumo
        ");
        $stmtUpdate->execute([
            ':status_pagamento' => $novoStatus,
            ':id_forma_pagamento' => $idFormaPagamento,
            ':codigo_autorizacao' => $codigoAutorizacao !== '' ? $codigoAutorizacao : null,
            ':is_prazo' => $isPrazo,
            ':data_pagamento' => $dataPagamento,
            ':observacao' => $observacaoFinal !== '' ? $observacaoFinal : null,
            ':id_consumo' => $idConsumo,
        ]);

        logHospedagemAdmin($pdo, 'SETTLE_CONSUMPTION', 'hospedagem_reserva', intval($consumo['id_reserva'] ?? 0), [
            'id_reserva' => intval($consumo['id_reserva'] ?? 0),
            'id_consumo' => $idConsumo,
            'forma_quitacao' => $formaQuitacao,
            'status_pagamento' => $novoStatus,
            'valor_total' => $consumo['valor_total'] ?? null,
        ]);

        $pdo->commit();
        echo json_encode(['success' => true, 'data' => ['id_consumo' => $idConsumo, 'status_pagamento' => $novoStatus]]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        apiExceptionResponse($e, 'hospedagem_reserva_controller::quitar_consumo', 'Não foi possível quitar o consumo.');
    }
}

function deletarConsumo()
{
    $db = new Database();
    $pdo = $db->connect();

    try {
        $pdo->beginTransaction();

        if (!isAuthenticated()) {
            throw new InvalidArgumentException('Usuario nao autenticado');
        }
        if (!isAdmin()) {
            throw new InvalidArgumentException('Apenas administradores podem excluir consumo.');
        }

        $idConsumo = intval($_POST['id_consumo'] ?? 0);
        $motivo = trim((string) ($_POST['motivo'] ?? ''));
        if ($idConsumo <= 0) {
            throw new InvalidArgumentException('Consumo invalido');
        }
        if ($motivo === '') {
            throw new InvalidArgumentException('Informe o motivo da exclusao.');
        }

        $stmt = $pdo->prepare("
            SELECT c.*, i.nome as nome_item, r.codigo_reserva
            FROM hospedagem_reserva_consumo c
            INNER JOIN estoque_item i ON i.id_item = c.id_item
            LEFT JOIN hospedagem_reserva r ON r.id_reserva = c.id_reserva
            WHERE c.id_consumo = :id
            FOR UPDATE
        ");
        $stmt->execute([':id' => $idConsumo]);
        $consumo = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$consumo) {
            throw new InvalidArgumentException('Consumo nao encontrado');
        }

        $idItem = (int) $consumo['id_item'];
        $quantidade = (int) $consumo['quantidade'];
        $observacao = 'Estorno do consumo #' . $idConsumo . ' - ' . $motivo;
        $responsavel = $_SESSION['nome'] ?? 'Admin';

        $stmtEstoque = $pdo->prepare("
            SELECT quantidade_atual
            FROM estoque_quantidade
            WHERE id_item = :id_item
            FOR UPDATE
        ");
        $stmtEstoque->execute([':id_item' => $idItem]);
        $quantidadeAnterior = $stmtEstoque->fetchColumn();
        if ($quantidadeAnterior === false) {
            $quantidadeAnterior = 0;
            $pdo->prepare("
                INSERT INTO estoque_quantidade (id_item, quantidade_atual, quantidade_minima)
                VALUES (:id_item, 0, 10)
            ")->execute([':id_item' => $idItem]);
        }

        $quantidadeAnterior = (int) $quantidadeAnterior;
        $quantidadePosterior = $quantidadeAnterior + $quantidade;

        $stmtUpdate = $pdo->prepare("
            UPDATE estoque_quantidade
            SET quantidade_atual = :quantidade
            WHERE id_item = :id_item
        ");
        $stmtUpdate->execute([
            ':quantidade' => $quantidadePosterior,
            ':id_item' => $idItem,
        ]);

        $stmtMov = $pdo->prepare("
            INSERT INTO estoque_movimentacao
                (id_item, id_usuario, tipo, quantidade, quantidade_anterior, quantidade_posterior, observacao, responsavel)
            VALUES
                (:id_item, :id_usuario, 'entrada', :quantidade, :quantidade_anterior, :quantidade_posterior, :observacao, :responsavel)
        ");
        $stmtMov->execute([
            ':id_item' => $idItem,
            ':id_usuario' => $_SESSION['id'] ?? null,
            ':quantidade' => $quantidade,
            ':quantidade_anterior' => $quantidadeAnterior,
            ':quantidade_posterior' => $quantidadePosterior,
            ':observacao' => $observacao,
            ':responsavel' => $responsavel,
        ]);
        $idMovimentacaoEstorno = (int) $pdo->lastInsertId();

        $stmtDelete = $pdo->prepare("DELETE FROM hospedagem_reserva_consumo WHERE id_consumo = :id");
        $stmtDelete->execute([':id' => $idConsumo]);

        logHospedagemAdmin($pdo, 'DELETE_CONSUMPTION', 'hospedagem_reserva', intval($consumo['id_reserva'] ?? 0), [
            'id_reserva' => intval($consumo['id_reserva'] ?? 0),
            'codigo_reserva' => $consumo['codigo_reserva'] ?? null,
            'id_consumo' => $idConsumo,
            'id_movimentacao_original' => intval($consumo['id_movimentacao'] ?? 0),
            'id_movimentacao_estorno' => $idMovimentacaoEstorno,
            'item' => $consumo['nome_item'] ?? null,
            'quantidade' => $quantidade,
            'valor_total' => $consumo['valor_total'] ?? null,
            'motivo' => $motivo,
        ]);

        $pdo->commit();
        echo json_encode(['success' => true, 'data' => ['id_movimentacao_estorno' => $idMovimentacaoEstorno]]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        apiExceptionResponse($e, 'hospedagem_reserva_controller::excluir_consumo', 'Não foi possível excluir o consumo.');
    }
}

function listarReservasConsumo()
{
    $db = new Database();
    $pdo = $db->connect();

    $sql = "SELECT r.id_reserva, r.codigo_reserva, r.data_checkin, r.data_checkout, r.status,
                   q.numero as quarto_numero,
                   c.nome as cliente_nome,
                   e.razao_social as empresa_razao,
                   EXISTS (
                       SELECT 1
                       FROM hospedagem_reserva_pagamento p
                       WHERE p.id_reserva = r.id_reserva AND p.is_prazo = 1
                   ) as has_pagamento_prazo
            FROM hospedagem_reserva r
            LEFT JOIN hotel_quarto q ON q.id_quarto = r.id_quarto
            LEFT JOIN hospedagem_cliente_dados c ON c.id_cliente = r.id_cliente
            LEFT JOIN hospedagem_empresa_dados e ON e.id_empresa = r.id_empresa
            WHERE (
                r.status = 'ABERTA'
                OR (
                    r.status = 'FECHADA'
                    AND r.data_checkout >= DATE_SUB(CURDATE(), INTERVAL 15 DAY)
                )
            )
            ORDER BY r.data_checkin DESC, r.id_reserva DESC
            LIMIT 200";

    $stmt = $pdo->query($sql);
    $data = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

    echo json_encode(['success' => true, 'data' => $data]);
}

function listarTimelineReserva()
{
    $db = new Database();
    $pdo = $db->connect();

    $id_reserva = intval($_GET['id_reserva'] ?? 0);
    if ($id_reserva <= 0) {
        reservaError('Reserva inválida.');
        return;
    }

    $stmtReserva = $pdo->prepare("SELECT id_reserva FROM hospedagem_reserva WHERE id_reserva = :id");
    $stmtReserva->execute([':id' => $id_reserva]);
    if (!$stmtReserva->fetchColumn()) {
        reservaError('Reserva não encontrada.', 404, 'RESERVATION_NOT_FOUND');
        return;
    }

    $sql = "SELECT l.id, l.created_at, l.action, l.target_entity, l.target_id, l.details, l.ip,
                   COALESCE(u.nome, 'Sistema') as user_name
            FROM system_logs l
            LEFT JOIN auth_users u ON u.id = l.user_id
            LEFT JOIN hospedagem_reserva_pagamento rp
                   ON l.target_entity = 'hospedagem_reserva_pagamento'
                  AND rp.id_pagamento = CAST(l.target_id AS UNSIGNED)
            WHERE (
                (l.target_entity = 'hospedagem_reserva' AND l.target_id = :id_reserva_str)
                OR
                (l.target_entity = 'hospedagem_reserva_pagamento' AND (
                    rp.id_reserva = :id_reserva_int
                    OR l.details LIKE :id_reserva_like
                ))
            )
            ORDER BY l.created_at DESC, l.id DESC
            LIMIT 300";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id_reserva_str' => (string) $id_reserva,
        ':id_reserva_int' => $id_reserva,
        ':id_reserva_like' => '%"id_reserva":' . $id_reserva . '%'
    ]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $timeline = [];
    foreach ($rows as $row) {
        $detailsDecoded = json_decode((string) ($row['details'] ?? ''), true);
        if (!is_array($detailsDecoded)) {
            $detailsDecoded = ['raw' => (string) ($row['details'] ?? '')];
        }

        $timeline[] = [
            'id' => intval($row['id'] ?? 0),
            'created_at' => $row['created_at'] ?? null,
            'action' => (string) ($row['action'] ?? ''),
            'entity' => (string) ($row['target_entity'] ?? ''),
            'target_id' => (string) ($row['target_id'] ?? ''),
            'user_name' => $row['user_name'] ?: 'Sistema',
            'ip' => $row['ip'] ?? null,
            'details' => $detailsDecoded
        ];
    }

    echo json_encode(['success' => true, 'data' => $timeline]);
}

function adicionarPagamento()
{
    $db = new Database();
    $pdo = $db->connect();
    $pagamentoTemIdUsuario = colunaExiste($pdo, 'hospedagem_reserva_pagamento', 'id_usuario');
    $idUsuarioSessao = $_SESSION['id'] ?? null;
    $isAdminUsuario = function_exists('isAdmin') ? isAdmin() : false;

    $id_reserva = intval($_POST['id_reserva'] ?? 0);
    $id_forma_pagamento = intval($_POST['id_forma_pagamento'] ?? 0);
    $valor = normalizarValor($_POST['valor'] ?? '');
    $data_pagamento = $_POST['data_pagamento'] ?? date('Y-m-d');
    $codigo_autorizacao = $_POST['codigo_autorizacao'] ?? null;
    $numero_nf = $_POST['numero_nf'] ?? null;
    $observacao = $_POST['observacao'] ?? null;
    $isPrazo = isset($_POST['is_prazo']) && intval($_POST['is_prazo']) === 1;

    if ($id_reserva <= 0 || $valor <= 0 || (!$isPrazo && $id_forma_pagamento <= 0)) {
        reservaError('Informe o valor total da hospedagem.');
        return;
    }

    $stmtReserva = $pdo->prepare("SELECT status FROM hospedagem_reserva WHERE id_reserva = :id_reserva");
    $stmtReserva->execute([':id_reserva' => $id_reserva]);
    $reserva = $stmtReserva->fetch(PDO::FETCH_ASSOC);
    if (!$reserva) {
        reservaError('Reserva não encontrada.', 404, 'RESERVATION_NOT_FOUND');
        return;
    }
    if (($reserva['status'] ?? '') === 'CANCELADA') {
        reservaError('Reserva cancelada não permite pagamento.');
        return;
    }
    if (($reserva['status'] ?? '') === 'FECHADA' && !$isAdminUsuario) {
        reservaError('Somente administradores podem adicionar pagamentos a uma reserva fechada.', 403, 'FORBIDDEN');
        return;
    }

    $forma = null;
    if (!$isPrazo) {
        $stmtForma = $pdo->prepare("SELECT nome_forma_pagamento FROM financeiro_forma_pagamento WHERE id_forma_pagamento = :id_forma_pagamento");
        $stmtForma->execute([':id_forma_pagamento' => $id_forma_pagamento]);
        $forma = $stmtForma->fetch(PDO::FETCH_ASSOC);
        if (!$forma) {
            reservaError('Forma de pagamento inválida.');
            return;
        }
    }

    $formaNome = normalizarTexto($forma['nome_forma_pagamento'] ?? '');
    $codigo = trim((string) $codigo_autorizacao);
    if (!$isPrazo && strpos($formaNome, 'PRAZO') !== false) {
        $isPrazo = true;
    }

    if ($codigo !== '' && mb_strlen($codigo, 'UTF-8') > 6) {
        reservaError('Código deve ter no máximo 6 caracteres.');
        return;
    }

    $exigeCodigo = !$isPrazo && (
        strpos($formaNome, 'PIX') !== false
        || strpos($formaNome, 'CREDITO') !== false
        || strpos($formaNome, 'DEBITO') !== false
    );
    if ($exigeCodigo && $codigo === '') {
        reservaError('Código obrigatório para esta forma.');
        return;
    }

    if ($pagamentoTemIdUsuario) {
        $sql = "INSERT INTO hospedagem_reserva_pagamento
                (id_reserva, id_forma_pagamento, valor, data_pagamento, codigo_autorizacao, numero_nf, observacao, is_prazo, id_usuario)
                VALUES (:id_reserva, :id_forma_pagamento, :valor, :data_pagamento, :codigo_autorizacao, :numero_nf, :observacao, :is_prazo, :id_usuario)";
    } else {
        $sql = "INSERT INTO hospedagem_reserva_pagamento
                (id_reserva, id_forma_pagamento, valor, data_pagamento, codigo_autorizacao, numero_nf, observacao, is_prazo)
                VALUES (:id_reserva, :id_forma_pagamento, :valor, :data_pagamento, :codigo_autorizacao, :numero_nf, :observacao, :is_prazo)";
    }

    $stmt = $pdo->prepare($sql);
    $params = [
        ':id_reserva' => $id_reserva,
        ':id_forma_pagamento' => $isPrazo ? null : $id_forma_pagamento,
        ':valor' => $valor,
        ':data_pagamento' => $data_pagamento,
        ':codigo_autorizacao' => $isPrazo ? null : ($codigo_autorizacao ?: null),
        ':numero_nf' => null,
        ':observacao' => $observacao ?: null,
        ':is_prazo' => $isPrazo ? 1 : 0
    ];
    if ($pagamentoTemIdUsuario) {
        $params[':id_usuario'] = $idUsuarioSessao ?: null;
    }
    $stmt->execute($params);
    $pagamentoId = (int) $pdo->lastInsertId();

    $stmtUpdate = $pdo->prepare("UPDATE hospedagem_reserva SET sem_pagamento = 0 WHERE id_reserva = :id");
    $stmtUpdate->execute([':id' => $id_reserva]);

    logHospedagemAdmin($pdo, 'ADD_PAYMENT', 'hospedagem_reserva', $id_reserva, [
        'id_reserva' => $id_reserva,
        'id_pagamento' => $pagamentoId,
        'id_forma_pagamento' => $isPrazo ? null : $id_forma_pagamento,
        'valor' => $valor,
        'data_pagamento' => $data_pagamento,
        'is_prazo' => $isPrazo ? 1 : 0,
        'situacao_reserva' => 'PG'
    ]);

    echo json_encode(['success' => true, 'data' => ['id_pagamento' => $pagamentoId]]);
}

function deletarReserva()
{
    $db = new Database();
    $pdo = $db->connect();

    if (!isAdmin()) {
        reservaError('Apenas administradores podem excluir reservas.', 403, 'FORBIDDEN');
        return;
    }

    $id_reserva = intval($_POST['id_reserva'] ?? 0);
    if ($id_reserva <= 0) {
        reservaError('Reserva inválida.');
        return;
    }

    $stmtPag = $pdo->prepare("SELECT COUNT(*) FROM hospedagem_reserva_pagamento WHERE id_reserva = :id");
    $stmtPag->execute([':id' => $id_reserva]);
    $temPagamento = intval($stmtPag->fetchColumn() ?: 0) > 0;
    if ($temPagamento) {
        reservaError('Reserva possui pagamento e não pode ser excluída.', 409, 'RESERVATION_HAS_PAYMENTS');
        return;
    }

    $stmt = $pdo->prepare("DELETE FROM hospedagem_reserva WHERE id_reserva = :id");
    $stmt->execute([':id' => $id_reserva]);

    logHospedagemAdmin($pdo, 'DELETE', 'hospedagem_reserva', $id_reserva, []);

    echo json_encode(['success' => true]);
}

function deletarPagamento()
{
    $db = new Database();
    $pdo = $db->connect();

    if (!isAdmin()) {
        reservaError('Apenas administradores podem excluir pagamentos.', 403, 'FORBIDDEN');
        return;
    }

    $id_pagamento = intval($_POST['id_pagamento'] ?? 0);
    if ($id_pagamento <= 0) {
        reservaError('Pagamento inválido.');
        return;
    }

    $stmtInfo = $pdo->prepare("SELECT id_reserva FROM hospedagem_reserva_pagamento WHERE id_pagamento = :id");
    $stmtInfo->execute([':id' => $id_pagamento]);
    $info = $stmtInfo->fetch(PDO::FETCH_ASSOC);
    if (!$info) {
        reservaError('Pagamento não encontrado.', 404, 'PAYMENT_NOT_FOUND');
        return;
    }

    $stmt = $pdo->prepare("DELETE FROM hospedagem_reserva_pagamento WHERE id_pagamento = :id");
    $stmt->execute([':id' => $id_pagamento]);

    $stmtPag = $pdo->prepare("SELECT COUNT(*) FROM hospedagem_reserva_pagamento WHERE id_reserva = :id");
    $stmtPag->execute([':id' => $info['id_reserva']]);
    $restantes = intval($stmtPag->fetchColumn() ?: 0);
    if ($restantes === 0) {
        $stmtUpdate = $pdo->prepare("UPDATE hospedagem_reserva SET sem_pagamento = 1 WHERE id_reserva = :id");
        $stmtUpdate->execute([':id' => $info['id_reserva']]);
    }

    logHospedagemAdmin($pdo, 'DELETE_PAYMENT', 'hospedagem_reserva', intval($info['id_reserva'] ?? 0), [
        'id_reserva' => intval($info['id_reserva'] ?? 0),
        'id_pagamento' => $id_pagamento,
        'pagamentos_restantes' => $restantes,
        'situacao_reserva' => $restantes > 0 ? 'PG' : 'SP'
    ]);

    echo json_encode(['success' => true]);
}

function listarFormasPagamento()
{
    $db = new Database();
    $pdo = $db->connect();

    $stmt = $pdo->query('SELECT id_forma_pagamento, nome_forma_pagamento FROM financeiro_forma_pagamento ORDER BY nome_forma_pagamento');
    $data = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

    echo json_encode(['success' => true, 'data' => $data]);
}

function listarQuartos()
{
    $db = new Database();
    $pdo = $db->connect();

    $sql = "SELECT q.id_quarto, q.numero, q.tipo,
                   p.preco_padrao, p.preco_2_pessoas
            FROM hotel_quarto q
            LEFT JOIN hotel_quarto_preco p ON p.tipo = q.tipo
            ORDER BY q.numero";
    $stmt = $pdo->query($sql);
    $data = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

    echo json_encode(['success' => true, 'data' => $data]);
}

function listarClientes()
{
    $db = new Database();
    $pdo = $db->connect();

    $sql = "SELECT id_cliente, nome, documento, telefone
            FROM hospedagem_cliente_dados
            WHERE is_deleted = 0
            ORDER BY id_cliente DESC";
    $stmt = $pdo->query($sql);
    $data = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

    echo json_encode(['success' => true, 'data' => $data]);
}

function listarEmpresas()
{
    $db = new Database();
    $pdo = $db->connect();

    $sql = "SELECT id_empresa, razao_social, cnpj, telefone
            FROM hospedagem_empresa_dados
            WHERE is_deleted = 0
            ORDER BY id_empresa DESC";
    $stmt = $pdo->query($sql);
    $data = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

    echo json_encode(['success' => true, 'data' => $data]);
}

function normalizarValor($valor)
{
    if (is_numeric($valor)) {
        return (float) $valor;
    }

    $limpo = str_replace('.', '', $valor);
    $limpo = str_replace(',', '.', $limpo);

    return (float) $limpo;
}

function normalizarTexto($texto)
{
    $texto = (string) $texto;
    $upper = mb_strtoupper($texto, 'UTF-8');
    $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $upper);
    if ($ascii === false) {
        return $upper;
    }
    return $ascii;
}

function parseReservaInputDate($value): ?DateTimeImmutable
{
    $raw = trim((string) $value);
    if ($raw === '' || $raw === '0000-00-00' || $raw === '0000-00-00 00:00:00') {
        return null;
    }

    $date = DateTimeImmutable::createFromFormat('!Y-m-d', substr($raw, 0, 10));
    if ($date instanceof DateTimeImmutable) {
        return $date;
    }

    try {
        return new DateTimeImmutable($raw);
    } catch (Exception $e) {
        return null;
    }
}

function parseReservaDate($value): ?DateTime
{
    $raw = trim((string) $value);
    if ($raw === '' || $raw === '0000-00-00' || $raw === '0000-00-00 00:00:00') {
        return null;
    }

    $date = DateTime::createFromFormat('Y-m-d H:i:s', $raw);
    if ($date instanceof DateTime)
        return $date;

    $date = DateTime::createFromFormat('Y-m-d', $raw);
    if ($date instanceof DateTime)
        return $date;

    try {
        return new DateTime($raw);
    } catch (Exception $e) {
        return null;
    }
}

function logHospedagemAdmin(PDO $pdo, string $action, string $entity, $targetId, array $details = []): void
{
    try {
        Logger::system($pdo, 'ADMIN', $action, $entity, (string) $targetId, $details);
    } catch (Exception $e) {
    }
}
