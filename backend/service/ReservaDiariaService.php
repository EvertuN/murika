<?php

final class ReservaDiariaService
{
    public static function normalizar($payload, DateTimeImmutable $checkinDate, int $quantidadeDiarias): ?array
    {
        $raw = trim((string) $payload);
        if ($raw === '') return null;

        $diarias = json_decode($raw, true);
        if (!is_array($diarias)) throw new InvalidArgumentException('A lista de diárias é inválida.');
        if (count($diarias) !== $quantidadeDiarias) throw new InvalidArgumentException('A quantidade de diárias não corresponde ao período informado.');

        $normalizadas = [];
        foreach ($diarias as $indice => $diaria) {
            if (!is_array($diaria)) throw new InvalidArgumentException('Diária inválida.');

            $dataEsperada = $checkinDate->modify('+' . $indice . ' days')->format('Y-m-d');
            $data = trim((string) ($diaria['data'] ?? ''));
            if ($data !== $dataEsperada) throw new InvalidArgumentException('As datas das diárias não correspondem ao período informado.');

            $valor = round(self::normalizarValor($diaria['valor'] ?? ''), 2);
            if ($valor <= 0) throw new InvalidArgumentException('Todas as diárias devem possuir valor maior que zero.');

            $normalizadas[] = ['data' => $data, 'valor' => $valor];
        }

        return $normalizadas;
    }

    public static function total(array $diarias): float
    {
        return round(array_sum(array_column($diarias, 'valor')), 2);
    }

    private static function normalizarValor($valor): float
    {
        if (is_numeric($valor)) return (float) $valor;

        $limpo = str_replace('.', '', (string) $valor);
        $limpo = str_replace(',', '.', $limpo);
        return (float) $limpo;
    }
}
