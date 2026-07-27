<?php

require_once __DIR__ . '/../core/BaseCoreController.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../service/AppConfigService.php';

class ItemCoreController extends BaseCoreController
{
    private function normalizarPreco(array &$data): void
    {
        if (!isset($data['preco_venda']) || $data['preco_venda'] === '') {
            return;
        }

        $valor = (string) $data['preco_venda'];
        if (strpos($valor, ',') !== false) {
            $valor = str_replace('.', '', $valor);
            $valor = str_replace(',', '.', $valor);
        }
        $data['preco_venda'] = (float) $valor;
    }

    protected function beforeCreate(&$data)
    {
        if (!isAdmin()) {
            return false;
        }
        $this->normalizarPreco($data);
        return true;
    }

    protected function beforeUpdate($id, &$data)
    {
        if (!isAdmin()) {
            return false;
        }
        $this->normalizarPreco($data);
        return true;
    }

    protected function activate()
    {
        $id = intval($_POST['id'] ?? 0);
        if ($id > 0) {
            $stmt = $this->db->prepare("
                SELECT COALESCE(c.is_deleted, 0)
                FROM estoque_item i
                LEFT JOIN estoque_categorias_item c ON c.id_categoria = i.id_categoria
                WHERE i.id_item = :id
            ");
            $stmt->execute([':id' => $id]);
            if (intval($stmt->fetchColumn()) === 1) {
                return $this->jsonResponse(false, 'Ative a categoria deste item antes de ativar o item.');
            }
        }

        return parent::activate();
    }

    protected function afterCreate($id, $data)
    {
        try {
            $minimoPadrao = max(0, AppConfigService::getInt($this->db, 'stock_default_minimum', 10));
            $stmt = $this->db->prepare("
                INSERT INTO estoque_quantidade (id_item, quantidade_atual, quantidade_minima)
                VALUES (:id, 0, :minimo)
            ");
            $stmt->execute([':id' => $id, ':minimo' => $minimoPadrao]);
        } catch (PDOException $e) {
            error_log("Erro ao criar estoque para item {$id}: " . $e->getMessage());
        }
    }

    protected function read()
    {
        try {
            requerAutenticacao();
            $isAdmin = isAdmin();
            $sql = "SELECT
                        i.id_item,
                        i.nome,
                        i.preco_venda,
                        i.id_categoria,
                        i.is_deleted,
                        i.deleted_at,
                        i.deleted_by,
                        c.nome_categoria,
                        COALESCE(eq.quantidade_minima, 10) AS quantidade_minima,
                        COALESCE(eq.quantidade_atual, 0) AS quantidade_atual
                    FROM {$this->table} i
                    LEFT JOIN estoque_categorias_item c ON i.id_categoria = c.id_categoria
                    LEFT JOIN estoque_quantidade eq ON i.id_item = eq.id_item
                    WHERE " . ($isAdmin ? "1 = 1" : "i.is_deleted = 0 AND COALESCE(c.is_deleted, 0) = 0") . "
                    ORDER BY i.nome";

            $stmt = $this->db->query($sql);
            $data = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
            return $this->jsonResponse(true, '', ['data' => $data]);
        } catch (PDOException $e) {
            return apiExceptionResponse($e, 'EstoqueItemController::read', 'Não foi possível carregar os itens.');
        }
    }
}

$database = new Database();
$db = $database->connect();

$controller = new ItemCoreController($db, [
    'table' => 'estoque_item',
    'primaryKey' => 'id_item',
    'fields' => ['nome', 'id_categoria', 'preco_venda'],
    'requiredFields' => ['nome', 'id_categoria', 'preco_venda'],
    'orderBy' => 'nome',
    'requireAuth' => true,
    'requireAdmin' => false,
    'deleteRequireAdmin' => true,
    'softDelete' => true,
    'uniqueChecks' => [[
        'field' => 'nome',
        'expression' => 'nome',
        'activeMessage' => 'Item já cadastrado.',
        'inactiveMessage' => 'Item já existe inativado. Contate um administrador para ativar.',
    ]],
    'relationships' => [
        'nome_categoria' => [
            'table' => 'estoque_categorias_item',
            'foreignKey' => 'id_categoria',
            'primaryKey' => 'id_categoria',
            'displayField' => 'nome_categoria',
            'type' => 'LEFT',
        ],
    ],
]);

$controller->handleRequest();
