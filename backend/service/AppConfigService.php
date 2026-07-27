<?php

class AppConfigService
{
    private static array $cache = [];

    public static function getString(PDO $pdo, string $key, string $fallback = ''): string
    {
        if (array_key_exists($key, self::$cache)) {
            return self::$cache[$key];
        }

        try {
            $stmt = $pdo->prepare('SELECT config_value FROM app_config WHERE config_key = :key LIMIT 1');
            $stmt->execute([':key' => $key]);
            $value = $stmt->fetchColumn();
            self::$cache[$key] = $value === false ? $fallback : (string) $value;
        } catch (Throwable $e) {
            self::$cache[$key] = $fallback;
        }

        return self::$cache[$key];
    }

    public static function getInt(PDO $pdo, string $key, int $fallback): int
    {
        $value = self::getString($pdo, $key, (string) $fallback);
        return preg_match('/^-?\d+$/', $value) ? (int) $value : $fallback;
    }

    public static function list(PDO $pdo): array
    {
        $stmt = $pdo->query("SELECT config_key, config_value, value_type, config_group, label,
                                   description, min_value, max_value, updated_at
                            FROM app_config
                            ORDER BY FIELD(config_group, 'security', 'reservation', 'inventory', 'report'), label");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function update(PDO $pdo, array $values, ?string $userId): array
    {
        if (!$values) {
            throw new InvalidArgumentException('Nenhuma configuração foi informada.');
        }

        $placeholders = implode(',', array_fill(0, count($values), '?'));
        $stmt = $pdo->prepare("SELECT * FROM app_config WHERE config_key IN ({$placeholders})");
        $stmt->execute(array_keys($values));
        $definitions = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $definitions[$row['config_key']] = $row;
        }

        if (count($definitions) !== count($values)) {
            throw new InvalidArgumentException('Uma ou mais configurações são inválidas.');
        }

        $normalized = [];
        foreach ($values as $key => $rawValue) {
            $definition = $definitions[$key];
            $value = trim((string) $rawValue);
            if ($definition['value_type'] === 'integer') {
                if (!preg_match('/^\d+$/', $value)) {
                    throw new InvalidArgumentException($definition['label'] . ': informe um número inteiro.');
                }
                $number = (int) $value;
                if ($definition['min_value'] !== null && $number < (int) $definition['min_value']) {
                    throw new InvalidArgumentException($definition['label'] . ': valor abaixo do mínimo permitido.');
                }
                if ($definition['max_value'] !== null && $number > (int) $definition['max_value']) {
                    throw new InvalidArgumentException($definition['label'] . ': valor acima do máximo permitido.');
                }
                $value = (string) $number;
            } elseif ($definition['value_type'] === 'time' && $value !== '') {
                $time = DateTimeImmutable::createFromFormat('!H:i', $value);
                if (!$time || $time->format('H:i') !== $value) {
                    throw new InvalidArgumentException($definition['label'] . ': informe uma hora válida.');
                }
            } elseif ($definition['value_type'] === 'boolean') {
                if (!in_array($value, ['0', '1'], true)) {
                    throw new InvalidArgumentException($definition['label'] . ': valor booleano inválido.');
                }
            }
            $normalized[$key] = $value;
        }

        $update = $pdo->prepare('UPDATE app_config SET config_value = :value, updated_by = :user WHERE config_key = :key');
        foreach ($normalized as $key => $value) {
            $update->execute([':value' => $value, ':user' => $userId, ':key' => $key]);
            self::$cache[$key] = $value;
        }

        return $normalized;
    }

    public static function clearCache(): void
    {
        self::$cache = [];
    }
}
