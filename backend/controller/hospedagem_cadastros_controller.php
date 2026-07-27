<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../core/Logger.php';

header('Content-Type: application/json; charset=utf-8');
requerAdmin();

$pdo = getAuthPdo();
$action = $_POST['acao'] ?? $_GET['acao'] ?? 'listar';

try {
    switch ($action) {
        case 'listar':
            listarCadastrosHospedagem($pdo);
            break;
        case 'salvar_tipo_quarto':
            salvarTipoQuarto($pdo);
            break;
        case 'excluir_tipo_quarto':
            excluirTipoQuarto($pdo);
            break;
        case 'salvar_quarto':
            salvarQuarto($pdo);
            break;
        case 'excluir_quarto':
            excluirQuarto($pdo);
            break;
        case 'salvar_forma_pagamento':
            salvarFormaPagamento($pdo);
            break;
        case 'excluir_forma_pagamento':
            excluirFormaPagamento($pdo);
            break;
        default:
            cadastroHospedagemResponse(false, 'Ação inválida.', null, 400, 'INVALID_ACTION');
    }
} catch (InvalidArgumentException $exception) {
    cadastroHospedagemResponse(false, $exception->getMessage(), null, 422, 'VALIDATION_ERROR');
} catch (PDOException $exception) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if ($exception->getCode() === '23000') {
        cadastroHospedagemResponse(false, 'Já existe um cadastro com esses dados ou ele está em uso.', null, 409, 'CATALOG_CONFLICT');
    }
    apiExceptionResponse($exception, 'hospedagem_cadastros_controller::database');
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    apiExceptionResponse($exception, 'hospedagem_cadastros_controller');
}

function listarCadastrosHospedagem(PDO $pdo): void
{
    $types = $pdo->query(
        'SELECT t.tipo, t.preco_padrao, t.preco_2_pessoas,
                COUNT(q.id_quarto) AS quantidade_quartos
         FROM hotel_quarto_preco t
         LEFT JOIN hotel_quarto q ON q.tipo = t.tipo
         GROUP BY t.tipo, t.preco_padrao, t.preco_2_pessoas
         ORDER BY t.tipo'
    )->fetchAll(PDO::FETCH_ASSOC);

    foreach ($types as &$type) {
        $type['preco_padrao'] = (float) $type['preco_padrao'];
        $type['preco_2_pessoas'] = (float) $type['preco_2_pessoas'];
        $type['quantidade_quartos'] = (int) $type['quantidade_quartos'];
    }
    unset($type);

    $rooms = $pdo->query(
        'SELECT q.id_quarto, q.numero, q.tipo,
                t.preco_padrao, t.preco_2_pessoas,
                (SELECT COUNT(*) FROM hospedagem_reserva r WHERE r.id_quarto = q.id_quarto) AS quantidade_reservas
         FROM hotel_quarto q
         INNER JOIN hotel_quarto_preco t ON t.tipo = q.tipo
         ORDER BY CAST(q.numero AS UNSIGNED), q.numero'
    )->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rooms as &$room) {
        $room['id_quarto'] = (int) $room['id_quarto'];
        $room['preco_padrao'] = (float) $room['preco_padrao'];
        $room['preco_2_pessoas'] = (float) $room['preco_2_pessoas'];
        $room['quantidade_reservas'] = (int) $room['quantidade_reservas'];
    }
    unset($room);

    $paymentMethods = $pdo->query(
        'SELECT f.id_forma_pagamento, f.nome_forma_pagamento,
                ((SELECT COUNT(*) FROM hospedagem_reserva_pagamento p
                   WHERE p.id_forma_pagamento = f.id_forma_pagamento)
                 +
                 (SELECT COUNT(*) FROM hospedagem_reserva_consumo c
                   WHERE c.id_forma_pagamento = f.id_forma_pagamento)) AS quantidade_usos
         FROM financeiro_forma_pagamento f
         ORDER BY f.nome_forma_pagamento'
    )->fetchAll(PDO::FETCH_ASSOC);

    foreach ($paymentMethods as &$method) {
        $method['id_forma_pagamento'] = (int) $method['id_forma_pagamento'];
        $method['quantidade_usos'] = (int) $method['quantidade_usos'];
    }
    unset($method);

    cadastroHospedagemResponse(true, '', [
        'tiposQuarto' => $types,
        'quartos' => $rooms,
        'formasPagamento' => $paymentMethods,
    ]);
}

function salvarTipoQuarto(PDO $pdo): void
{
    $original = normalizarRotuloCadastro($_POST['tipo_original'] ?? '', 50, true);
    $type = normalizarRotuloCadastro($_POST['tipo'] ?? '', 50);
    $standardPrice = normalizarValorCadastro($_POST['preco_padrao'] ?? null, 'Informe o preço padrão.');
    $twoPeoplePrice = normalizarValorCadastro($_POST['preco_2_pessoas'] ?? null, 'Informe o preço para duas pessoas.');

    if ($original !== '') {
        if (!tipoQuartoExiste($pdo, $original)) {
            cadastroHospedagemResponse(false, 'Tipo de quarto não encontrado.', null, 404, 'ROOM_TYPE_NOT_FOUND');
        }
        if ($original !== $type && tipoQuartoExiste($pdo, $type)) {
            cadastroHospedagemResponse(false, 'Já existe um tipo de quarto com esse nome.', null, 409, 'ROOM_TYPE_EXISTS');
        }
    } elseif (tipoQuartoExiste($pdo, $type)) {
        cadastroHospedagemResponse(false, 'Já existe um tipo de quarto com esse nome.', null, 409, 'ROOM_TYPE_EXISTS');
    }

    $pdo->beginTransaction();
    if ($original !== '') {
        $stmt = $pdo->prepare(
            'UPDATE hotel_quarto_preco
             SET tipo = :tipo, preco_padrao = :preco_padrao, preco_2_pessoas = :preco_2_pessoas
             WHERE tipo = :original'
        );
        $stmt->execute([
            ':tipo' => $type,
            ':preco_padrao' => $standardPrice,
            ':preco_2_pessoas' => $twoPeoplePrice,
            ':original' => $original,
        ]);
        $action = 'UPDATE_ROOM_TYPE';
    } else {
        $stmt = $pdo->prepare(
            'INSERT INTO hotel_quarto_preco (tipo, preco_padrao, preco_2_pessoas)
             VALUES (:tipo, :preco_padrao, :preco_2_pessoas)'
        );
        $stmt->execute([
            ':tipo' => $type,
            ':preco_padrao' => $standardPrice,
            ':preco_2_pessoas' => $twoPeoplePrice,
        ]);
        $action = 'CREATE_ROOM_TYPE';
    }

    Logger::system($pdo, 'ADMIN', $action, 'hotel_quarto_preco', $type, [
        'tipo_original' => $original ?: null,
        'preco_padrao' => $standardPrice,
        'preco_2_pessoas' => $twoPeoplePrice,
    ]);
    $pdo->commit();
    cadastroHospedagemResponse(true, $original !== '' ? 'Tipo de quarto atualizado.' : 'Tipo de quarto criado.');
}

function excluirTipoQuarto(PDO $pdo): void
{
    $type = normalizarRotuloCadastro($_POST['tipo'] ?? '', 50);
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM hotel_quarto WHERE tipo = :tipo');
    $stmt->execute([':tipo' => $type]);
    if ((int) $stmt->fetchColumn() > 0) {
        cadastroHospedagemResponse(false, 'Esse tipo possui quartos cadastrados e não pode ser excluído.', null, 409, 'ROOM_TYPE_IN_USE');
    }

    $delete = $pdo->prepare('DELETE FROM hotel_quarto_preco WHERE tipo = :tipo');
    $delete->execute([':tipo' => $type]);
    if ($delete->rowCount() === 0) {
        cadastroHospedagemResponse(false, 'Tipo de quarto não encontrado.', null, 404, 'ROOM_TYPE_NOT_FOUND');
    }

    Logger::system($pdo, 'ADMIN', 'DELETE_ROOM_TYPE', 'hotel_quarto_preco', $type);
    cadastroHospedagemResponse(true, 'Tipo de quarto excluído.');
}

function salvarQuarto(PDO $pdo): void
{
    $id = filter_var($_POST['id_quarto'] ?? null, FILTER_VALIDATE_INT);
    $number = normalizarNumeroQuarto($_POST['numero'] ?? '');
    $type = normalizarRotuloCadastro($_POST['tipo'] ?? '', 50);

    if (!tipoQuartoExiste($pdo, $type)) {
        throw new InvalidArgumentException('Selecione um tipo de quarto válido.');
    }

    if ($id && $id > 0) {
        $stmt = $pdo->prepare('UPDATE hotel_quarto SET numero = :numero, tipo = :tipo WHERE id_quarto = :id');
        $stmt->execute([':numero' => $number, ':tipo' => $type, ':id' => $id]);
        if ($stmt->rowCount() === 0 && !quartoExiste($pdo, $id)) {
            cadastroHospedagemResponse(false, 'Quarto não encontrado.', null, 404, 'ROOM_NOT_FOUND');
        }
        $action = 'UPDATE_ROOM';
        $roomId = $id;
    } else {
        $stmt = $pdo->prepare('INSERT INTO hotel_quarto (numero, tipo) VALUES (:numero, :tipo)');
        $stmt->execute([':numero' => $number, ':tipo' => $type]);
        $action = 'CREATE_ROOM';
        $roomId = (int) $pdo->lastInsertId();
    }

    Logger::system($pdo, 'ADMIN', $action, 'hotel_quarto', $roomId, [
        'numero' => $number,
        'tipo' => $type,
    ]);
    cadastroHospedagemResponse(true, $id ? 'Quarto atualizado.' : 'Quarto criado.', ['id' => $roomId]);
}

function excluirQuarto(PDO $pdo): void
{
    $id = filter_var($_POST['id_quarto'] ?? null, FILTER_VALIDATE_INT);
    if (!$id || $id < 1) throw new InvalidArgumentException('Quarto inválido.');

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM hospedagem_reserva WHERE id_quarto = :id');
    $stmt->execute([':id' => $id]);
    if ((int) $stmt->fetchColumn() > 0) {
        cadastroHospedagemResponse(false, 'Esse quarto possui reservas e não pode ser excluído.', null, 409, 'ROOM_IN_USE');
    }

    $delete = $pdo->prepare('DELETE FROM hotel_quarto WHERE id_quarto = :id');
    $delete->execute([':id' => $id]);
    if ($delete->rowCount() === 0) {
        cadastroHospedagemResponse(false, 'Quarto não encontrado.', null, 404, 'ROOM_NOT_FOUND');
    }

    Logger::system($pdo, 'ADMIN', 'DELETE_ROOM', 'hotel_quarto', $id);
    cadastroHospedagemResponse(true, 'Quarto excluído.');
}

function salvarFormaPagamento(PDO $pdo): void
{
    $id = filter_var($_POST['id_forma_pagamento'] ?? null, FILTER_VALIDATE_INT);
    $name = normalizarRotuloCadastro($_POST['nome_forma_pagamento'] ?? '', 60);

    if ($id && $id > 0) {
        $stmt = $pdo->prepare(
            'UPDATE financeiro_forma_pagamento
             SET nome_forma_pagamento = :nome
             WHERE id_forma_pagamento = :id'
        );
        $stmt->execute([':nome' => $name, ':id' => $id]);
        if ($stmt->rowCount() === 0 && !formaPagamentoExiste($pdo, $id)) {
            cadastroHospedagemResponse(false, 'Forma de pagamento não encontrada.', null, 404, 'PAYMENT_METHOD_NOT_FOUND');
        }
        $action = 'UPDATE_PAYMENT_METHOD';
        $methodId = $id;
    } else {
        $stmt = $pdo->prepare('INSERT INTO financeiro_forma_pagamento (nome_forma_pagamento) VALUES (:nome)');
        $stmt->execute([':nome' => $name]);
        $action = 'CREATE_PAYMENT_METHOD';
        $methodId = (int) $pdo->lastInsertId();
    }

    Logger::system($pdo, 'ADMIN', $action, 'financeiro_forma_pagamento', $methodId, ['nome' => $name]);
    cadastroHospedagemResponse(true, $id ? 'Forma de pagamento atualizada.' : 'Forma de pagamento criada.', ['id' => $methodId]);
}

function excluirFormaPagamento(PDO $pdo): void
{
    $id = filter_var($_POST['id_forma_pagamento'] ?? null, FILTER_VALIDATE_INT);
    if (!$id || $id < 1) throw new InvalidArgumentException('Forma de pagamento inválida.');

    $stmt = $pdo->prepare(
        'SELECT
            (SELECT COUNT(*) FROM hospedagem_reserva_pagamento WHERE id_forma_pagamento = :id_pagamento)
            +
            (SELECT COUNT(*) FROM hospedagem_reserva_consumo WHERE id_forma_pagamento = :id_consumo)'
    );
    $stmt->execute([':id_pagamento' => $id, ':id_consumo' => $id]);
    if ((int) $stmt->fetchColumn() > 0) {
        cadastroHospedagemResponse(false, 'Essa forma de pagamento já foi utilizada e não pode ser excluída.', null, 409, 'PAYMENT_METHOD_IN_USE');
    }

    $delete = $pdo->prepare('DELETE FROM financeiro_forma_pagamento WHERE id_forma_pagamento = :id');
    $delete->execute([':id' => $id]);
    if ($delete->rowCount() === 0) {
        cadastroHospedagemResponse(false, 'Forma de pagamento não encontrada.', null, 404, 'PAYMENT_METHOD_NOT_FOUND');
    }

    Logger::system($pdo, 'ADMIN', 'DELETE_PAYMENT_METHOD', 'financeiro_forma_pagamento', $id);
    cadastroHospedagemResponse(true, 'Forma de pagamento excluída.');
}

function normalizarRotuloCadastro($value, int $maxLength, bool $allowEmpty = false): string
{
    $normalized = preg_replace('/\s+/u', ' ', trim((string) $value));
    if ($normalized === '' && $allowEmpty) return '';
    if ($normalized === '' || !preg_match('/^.{1,' . $maxLength . '}$/us', $normalized)) {
        throw new InvalidArgumentException('Informe um nome válido com até ' . $maxLength . ' caracteres.');
    }
    return $normalized;
}

function normalizarNumeroQuarto($value): string
{
    $number = trim((string) $value);
    if (!preg_match('/^[\p{L}\p{N}._-]{1,20}$/u', $number)) {
        throw new InvalidArgumentException('Informe um número de quarto válido com até 20 caracteres.');
    }
    return $number;
}

function normalizarValorCadastro($value, string $message): string
{
    $normalized = str_replace(',', '.', trim((string) $value));
    if ($normalized === '' || !is_numeric($normalized)) throw new InvalidArgumentException($message);
    $number = (float) $normalized;
    if ($number < 0 || $number > 99999999.99) throw new InvalidArgumentException('Informe um valor válido.');
    return number_format($number, 2, '.', '');
}

function tipoQuartoExiste(PDO $pdo, string $type): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM hotel_quarto_preco WHERE tipo = :tipo LIMIT 1');
    $stmt->execute([':tipo' => $type]);
    return (bool) $stmt->fetchColumn();
}

function quartoExiste(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM hotel_quarto WHERE id_quarto = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    return (bool) $stmt->fetchColumn();
}

function formaPagamentoExiste(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM financeiro_forma_pagamento WHERE id_forma_pagamento = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    return (bool) $stmt->fetchColumn();
}

function cadastroHospedagemResponse($success, $message = '', $data = null, $status = 200, $code = null): void
{
    apiJsonResponse((bool) $success, $data, (string) $message, (int) $status, $code);
    exit;
}
