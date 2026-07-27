<?php

require_once __DIR__ . '/AppConfigService.php';

class EstoqueConsumoService
{
    public const TIPO_HOSPEDE = 'CONSUMO_HOSPEDE';
    public const TIPO_OUTRO = 'OUTRO_CONSUMO';
    public const TIPO_DESCARTE = 'DESCARTE';
    public const STATUS_PAGO = 'PAGO';
    public const STATUS_COBRADO_RESERVA = 'COBRADO_RESERVA';
    public const STATUS_PENDENTE = 'PENDENTE';
    public const STATUS_A_PRAZO = 'A_PRAZO';

    public static function registrarMovimentacao(PDO $pdo, array $payload): array
    {
        $tipo = (string) ($payload['tipo'] ?? '');
        $idItem = (int) ($payload['id_item'] ?? 0);
        $quantidade = (int) ($payload['quantidade'] ?? 0);
        $observacao = trim((string) ($payload['observacao'] ?? ''));
        $responsavel = trim((string) ($payload['responsavel'] ?? ''));
        $idUsuarioMovimentacao = self::normalizarUsuarioMovimentacao($payload['id_usuario'] ?? null);

        if (!in_array($tipo, ['entrada', 'saida'], true)) {
            throw new InvalidArgumentException('Tipo de movimentacao invalido');
        }
        if ($idItem <= 0) {
            throw new InvalidArgumentException('Item invalido');
        }
        if ($quantidade <= 0) {
            throw new InvalidArgumentException('Quantidade deve ser maior que zero');
        }

        $movimentacaoId = self::baixarOuEntrarEstoque(
            $pdo,
            $idItem,
            $idUsuarioMovimentacao,
            $tipo,
            $quantidade,
            $observacao,
            $responsavel
        );

        return [
            'id_movimentacao' => $movimentacaoId,
        ];
    }

    public static function registrarConsumo(PDO $pdo, array $payload): array
    {
        $tipoConsumo = strtoupper(trim((string) ($payload['tipo_consumo'] ?? '')));
        $idReserva = isset($payload['id_reserva']) && $payload['id_reserva'] !== ''
            ? (int) $payload['id_reserva']
            : null;
        $idItem = (int) ($payload['id_item'] ?? 0);
        $quantidade = (int) ($payload['quantidade'] ?? 0);
        $observacao = trim((string) ($payload['observacao'] ?? ''));
        $idFormaPagamento = isset($payload['id_forma_pagamento']) && $payload['id_forma_pagamento'] !== ''
            ? (int) $payload['id_forma_pagamento']
            : null;
        $codigoAutorizacao = trim((string) ($payload['codigo_autorizacao'] ?? ''));
        $cobrarNaReserva = !empty($payload['cobrar_na_reserva']);
        $registrarSemPagamento = !empty($payload['registrar_sem_pagamento']);
        $isPrazo = !empty($payload['is_prazo']);
        $responsavel = trim((string) ($payload['responsavel'] ?? ''));
        $responsavelConsumo = trim((string) ($payload['responsavel_consumo'] ?? ''));
        $justificativaValor = trim((string) ($payload['justificativa_valor'] ?? ''));
        $idUsuario = $payload['id_usuario'] ?? null;
        $idUsuarioMovimentacao = self::normalizarUsuarioMovimentacao($idUsuario);

        if (!in_array($tipoConsumo, [self::TIPO_HOSPEDE, self::TIPO_OUTRO, self::TIPO_DESCARTE], true)) {
            throw new InvalidArgumentException('Contexto de consumo invalido');
        }
        if ($idItem <= 0) {
            throw new InvalidArgumentException('Item invalido');
        }
        if ($quantidade <= 0) {
            throw new InvalidArgumentException('Quantidade deve ser maior que zero');
        }
        if ($tipoConsumo === self::TIPO_HOSPEDE && (!$idReserva || $idReserva <= 0)) {
            throw new InvalidArgumentException('Selecione a reserva do consumo');
        }
        if ($tipoConsumo !== self::TIPO_HOSPEDE) {
            $idReserva = null;
        }
        if ($tipoConsumo === self::TIPO_DESCARTE && $observacao === '') {
            throw new InvalidArgumentException('Informe o motivo do descarte');
        }
        if ($tipoConsumo === self::TIPO_OUTRO && $responsavelConsumo === '') {
            throw new InvalidArgumentException('Informe o responsável pelo outro consumo');
        }
        if ($cobrarNaReserva && $tipoConsumo !== self::TIPO_HOSPEDE) {
            throw new InvalidArgumentException('Somente consumo de hospede pode ser cobrado na reserva');
        }
        if ($registrarSemPagamento && $tipoConsumo !== self::TIPO_HOSPEDE) {
            throw new InvalidArgumentException('Somente consumo de hospede pode ser registrado sem pagamento');
        }
        if ($isPrazo && $tipoConsumo !== self::TIPO_HOSPEDE) {
            throw new InvalidArgumentException('Somente consumo de hospede pode ser corporativo');
        }
        if ($isPrazo && !$idReserva) {
            throw new InvalidArgumentException('Selecione a reserva do consumo corporativo');
        }
        if ($isPrazo) {
            $idFormaPagamento = null;
            $codigoAutorizacao = '';
            $cobrarNaReserva = false;
            $registrarSemPagamento = false;
        } elseif ($cobrarNaReserva) {
            $idFormaPagamento = null;
            $codigoAutorizacao = '';
            $registrarSemPagamento = false;
        } elseif ($registrarSemPagamento) {
            $idFormaPagamento = null;
            $codigoAutorizacao = '';
        } elseif ($tipoConsumo !== self::TIPO_DESCARTE) {
            if (!$idFormaPagamento || $idFormaPagamento <= 0) {
                throw new InvalidArgumentException('Selecione a forma de pagamento');
            }
            if ($codigoAutorizacao !== '' && mb_strlen($codigoAutorizacao, 'UTF-8') > 6) {
                throw new InvalidArgumentException('Codigo deve ter no maximo 6 caracteres');
            }
            if (self::formaPagamentoExigeCodigo($pdo, $idFormaPagamento) && $codigoAutorizacao === '') {
                throw new InvalidArgumentException('Codigo obrigatorio para esta forma');
            }
        } else {
            $idFormaPagamento = null;
            $codigoAutorizacao = '';
        }

        $statusPagamento = self::STATUS_PAGO;
        if ($isPrazo) {
            $statusPagamento = self::STATUS_A_PRAZO;
        } elseif ($cobrarNaReserva) {
            $statusPagamento = self::STATUS_COBRADO_RESERVA;
        } elseif ($registrarSemPagamento) {
            $statusPagamento = self::STATUS_PENDENTE;
        }

        $dataPagamento = $statusPagamento === self::STATUS_PAGO ? date('Y-m-d') : null;

        if ($idReserva) {
            self::validarReserva($pdo, $idReserva);
        }

        $item = self::buscarItem($pdo, $idItem);
        $valorSugerido = (float) ($item['preco_venda'] ?? 0);
        $valorUnitario = $tipoConsumo === self::TIPO_DESCARTE
            ? 0.0
            : self::normalizarValorAplicado($payload['valor_unitario'] ?? null, $valorSugerido);
        $valorSobrescrito = $tipoConsumo !== self::TIPO_DESCARTE
            && abs($valorUnitario - $valorSugerido) > 0.0001;
        if ($valorSobrescrito && empty($payload['pode_sobrescrever_valor'])) {
            throw new InvalidArgumentException('Somente administradores podem alterar o valor deste consumo');
        }
        if ($valorSobrescrito && $justificativaValor === '') {
            throw new InvalidArgumentException('Informe a justificativa para alterar o valor deste consumo');
        }
        $valorTotal = $valorUnitario * $quantidade;

        $movimentacaoId = self::baixarOuEntrarEstoque(
            $pdo,
            $idItem,
            $idUsuarioMovimentacao,
            'saida',
            $quantidade,
            $observacao,
            $responsavel
        );

        $stmt = $pdo->prepare("
            INSERT INTO hospedagem_reserva_consumo
                (tipo_consumo, id_reserva, id_item, id_movimentacao, quantidade, valor_sugerido, valor_unitario, valor_total, valor_sobrescrito, valor_sobrescrito_por, justificativa_valor, responsavel_consumo, id_forma_pagamento, codigo_autorizacao, is_prazo, status_pagamento, data_pagamento, observacao, id_usuario)
            VALUES
                (:tipo_consumo, :id_reserva, :id_item, :id_movimentacao, :quantidade, :valor_sugerido, :valor_unitario, :valor_total, :valor_sobrescrito, :valor_sobrescrito_por, :justificativa_valor, :responsavel_consumo, :id_forma_pagamento, :codigo_autorizacao, :is_prazo, :status_pagamento, :data_pagamento, :observacao, :id_usuario)
        ");
        $stmt->execute([
            ':tipo_consumo' => $tipoConsumo,
            ':id_reserva' => $idReserva,
            ':id_item' => $idItem,
            ':id_movimentacao' => $movimentacaoId,
            ':quantidade' => $quantidade,
            ':valor_sugerido' => $valorSugerido,
            ':valor_unitario' => $valorUnitario,
            ':valor_total' => $valorTotal,
            ':valor_sobrescrito' => $valorSobrescrito ? 1 : 0,
            ':valor_sobrescrito_por' => $valorSobrescrito ? ($idUsuario ?: null) : null,
            ':justificativa_valor' => $valorSobrescrito ? $justificativaValor : null,
            ':responsavel_consumo' => $responsavelConsumo !== '' ? $responsavelConsumo : null,
            ':id_forma_pagamento' => $idFormaPagamento,
            ':codigo_autorizacao' => $codigoAutorizacao !== '' ? $codigoAutorizacao : null,
            ':is_prazo' => $isPrazo ? 1 : 0,
            ':status_pagamento' => $statusPagamento,
            ':data_pagamento' => $dataPagamento,
            ':observacao' => $observacao !== '' ? $observacao : null,
            ':id_usuario' => $idUsuario ?: null,
        ]);

        $consumoId = (int) $pdo->lastInsertId();

        return [
            'id_consumo' => $consumoId,
            'id_movimentacao' => $movimentacaoId,
            'valor_sugerido' => $valorSugerido,
            'valor_unitario' => $valorUnitario,
            'valor_total' => $valorTotal,
            'valor_sobrescrito' => $valorSobrescrito,
        ];
    }

    public static function formaPagamentoExigeCodigo(PDO $pdo, int $idFormaPagamento): bool
    {
        $stmt = $pdo->prepare("SELECT nome_forma_pagamento FROM financeiro_forma_pagamento WHERE id_forma_pagamento = :id");
        $stmt->execute([':id' => $idFormaPagamento]);
        $nome = self::normalizarTexto((string) ($stmt->fetchColumn() ?: ''));
        if ($nome === '') {
            throw new InvalidArgumentException('Forma de pagamento invalida');
        }

        return strpos($nome, 'PIX') !== false
            || strpos($nome, 'CREDITO') !== false
            || strpos($nome, 'DEBITO') !== false;
    }

    private static function baixarOuEntrarEstoque(
        PDO $pdo,
        int $idItem,
        ?string $idUsuario,
        string $tipo,
        int $quantidade,
        string $observacao,
        string $responsavel
    ): int {
        self::garantirItemExiste($pdo, $idItem);

        $quantidadeAnterior = self::buscarQuantidadeAtual($pdo, $idItem);
        if ($tipo === 'entrada') {
            $quantidadePosterior = $quantidadeAnterior + $quantidade;
        } else {
            $quantidadePosterior = $quantidadeAnterior - $quantidade;
            if ($quantidadePosterior < 0) {
                throw new InvalidArgumentException('Quantidade insuficiente em estoque');
            }
        }

        $stmt = $pdo->prepare("UPDATE estoque_quantidade SET quantidade_atual = :qtd WHERE id_item = :id");
        $stmt->execute([':qtd' => $quantidadePosterior, ':id' => $idItem]);

        $stmt = $pdo->prepare("
            INSERT INTO estoque_movimentacao
                (id_item, id_usuario, tipo, quantidade, quantidade_anterior, quantidade_posterior, observacao, responsavel)
            VALUES
                (:id_item, :id_usuario, :tipo, :qtd, :qtd_ant, :qtd_pos, :obs, :resp)
        ");
        $stmt->execute([
            ':id_item' => $idItem,
            ':id_usuario' => $idUsuario,
            ':tipo' => $tipo,
            ':qtd' => $quantidade,
            ':qtd_ant' => $quantidadeAnterior,
            ':qtd_pos' => $quantidadePosterior,
            ':obs' => $observacao,
            ':resp' => $responsavel,
        ]);

        return (int) $pdo->lastInsertId();
    }

    private static function buscarQuantidadeAtual(PDO $pdo, int $idItem): int
    {
        $stmt = $pdo->prepare("SELECT quantidade_atual FROM estoque_quantidade WHERE id_item = :id FOR UPDATE");
        $stmt->execute([':id' => $idItem]);
        $estoque = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$estoque) {
            $minimoPadrao = max(0, AppConfigService::getInt($pdo, 'stock_default_minimum', 10));
            $stmt = $pdo->prepare("INSERT INTO estoque_quantidade (id_item, quantidade_atual, quantidade_minima) VALUES (:id, 0, :minimo)");
            $stmt->execute([':id' => $idItem, ':minimo' => $minimoPadrao]);
            return 0;
        }

        return (int) $estoque['quantidade_atual'];
    }

    private static function buscarItem(PDO $pdo, int $idItem): array
    {
        $stmt = $pdo->prepare("
            SELECT i.id_item, i.nome, i.preco_venda
            FROM estoque_item i
            LEFT JOIN estoque_categorias_item c ON c.id_categoria = i.id_categoria
            WHERE i.id_item = :id
              AND i.is_deleted = 0
              AND COALESCE(c.is_deleted, 0) = 0
        ");
        $stmt->execute([':id' => $idItem]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$item) {
            throw new InvalidArgumentException('Item invalido');
        }

        return $item;
    }

    private static function garantirItemExiste(PDO $pdo, int $idItem): void
    {
        self::buscarItem($pdo, $idItem);
    }

    private static function validarReserva(PDO $pdo, int $idReserva): void
    {
        $stmt = $pdo->prepare("SELECT id_reserva, status FROM hospedagem_reserva WHERE id_reserva = :id");
        $stmt->execute([':id' => $idReserva]);
        $reserva = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$reserva) {
            throw new InvalidArgumentException('Reserva nao encontrada');
        }
        if (($reserva['status'] ?? '') === 'CANCELADA') {
            throw new InvalidArgumentException('Reserva cancelada nao permite consumo');
        }
    }

    private static function normalizarUsuarioMovimentacao($idUsuario): ?string
    {
        if ($idUsuario === null || $idUsuario === '') {
            return null;
        }
        $idUsuario = trim((string) $idUsuario);
        if (preg_match('/^[a-f0-9-]{36}$/i', $idUsuario)) {
            return $idUsuario;
        }

        return null;
    }

    private static function normalizarValorAplicado($valor, float $padrao): float
    {
        if ($valor === null || $valor === '') {
            return $padrao;
        }

        $normalizado = str_replace(',', '.', trim((string) $valor));
        if (!is_numeric($normalizado) || (float) $normalizado < 0) {
            throw new InvalidArgumentException('Valor do consumo inválido');
        }

        return round((float) $normalizado, 2);
    }

    private static function normalizarTexto(string $texto): string
    {
        $upper = mb_strtoupper($texto, 'UTF-8');
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $upper);
        return $ascii === false ? $upper : $ascii;
    }
}
