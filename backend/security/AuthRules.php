<?php

const AUTH_ROLES = ['admin', 'recepcao', 'financeiro'];

function isValidAuthRole($role) {
    return in_array((string) $role, AUTH_ROLES, true);
}

function isReadOnlyApiAction($action, $method = 'GET') {
    $method = strtoupper(trim((string) $method));
    if (!in_array($method, ['GET', 'HEAD'], true)) {
        return false;
    }

    $action = strtolower(trim((string) $action));
    foreach (['listar', 'buscar', 'obter', 'resumo', 'detalhar', 'dashboard', 'gerar_relatorio'] as $prefix) {
        if ($action === $prefix || strpos($action, $prefix . '_') === 0) {
            return true;
        }
    }

    return false;
}

function roleCanAccessApi($role, $endpoint, $action = '', $method = 'GET') {
    $role = (string) $role;
    $endpoint = (string) $endpoint;

    if ($role === 'admin') {
        return true;
    }

    if ($role === 'recepcao') {
        if (in_array($endpoint, ['item', 'categoria'], true)) {
            return isReadOnlyApiAction($action, $method);
        }

        if (in_array($endpoint, ['cliente', 'empresa'], true)) {
            return isReadOnlyApiAction($action, $method) || $action === 'cadastrar';
        }

        if ($endpoint === 'movimentacao') {
            return !in_array($action, ['atualizar_minimo', 'corrigir_movimentacao'], true);
        }

        if ($endpoint === 'hospedagem_reserva' && strpos((string) $action, 'deletar') === 0) {
            return false;
        }

        return $endpoint === 'hospedagem_reserva';
    }

    if ($role === 'financeiro') {
        if (in_array($endpoint, ['financeiro', 'relatorio'], true)) {
            return true;
        }

        $readableEndpoints = [
            'item',
            'categoria',
            'movimentacao',
            'cliente',
            'empresa',
            'hospedagem_reserva',
        ];

        return in_array($endpoint, $readableEndpoints, true)
            && isReadOnlyApiAction($action, $method);
    }

    if ($endpoint === 'app_config') {
        return false;
    }

    return false;
}

function validateLocalPassword($password, $minimumLength) {
    $password = (string) $password;
    $minimumLength = max(8, (int) $minimumLength);

    if (strlen($password) < $minimumLength) {
        return [
            'valid' => false,
            'message' => "A senha deve ter pelo menos {$minimumLength} caracteres.",
        ];
    }

    return ['valid' => true, 'message' => ''];
}
