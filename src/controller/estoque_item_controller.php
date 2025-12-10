<?php
/**
 * Controller de Itens - Usando BaseCoreController com Hooks Customizados
 * 
 * Versão refatorada usando o padrão Core.
 * Reduzido de 171 linhas para ~70 linhas (59% menos código)
 * 
 * Inclui hooks customizados para:
 * - Criar registros de estoque (recepcao e frigobar)
 * - Gerenciar mudanças no controle de frigobar
 */

require_once __DIR__ . '/../core/BaseCoreController.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

/**
 * ItemCoreController - Estende BaseCoreController com lógica específica de itens
 */
class ItemCoreController extends BaseCoreController {
    
    /**
     * Hook: Depois de criar item
     * Cria registros de estoque para recepção e frigobar (se aplicável)
     */
    protected function afterCreate($id, $data) {
        try {
            // Criar registro de estoque para recepção (todos os itens têm)
            $stmt = $this->db->prepare(
                "INSERT INTO estoque_quantidade (id_item, local, quantidade_atual, quantidade_minima) 
                 VALUES (:id, 'recepcao', 0, 10)"
            );
            $stmt->execute([':id' => $id]);
            
            // Se controla frigobar, criar também registro para frigobar
            if (isset($data['controla_frigobar']) && $data['controla_frigobar'] == 1) {
                $stmt = $this->db->prepare(
                    "INSERT INTO estoque_quantidade (id_item, local, quantidade_atual, quantidade_minima) 
                     VALUES (:id, 'frigobar', 0, 10)"
                );
                $stmt->execute([':id' => $id]);
            }
        } catch (PDOException $e) {
            // Log error but don't fail the creation
            error_log("Erro ao criar estoque para item $id: " . $e->getMessage());
        }
    }
    
    /**
     * Hook: Depois de atualizar item
     * Gerencia mudanças no controle de frigobar
     */
    protected function afterUpdate($id, $data) {
        try {
            // Verificar se mudou o controle de frigobar
            if (isset($data['controla_frigobar'])) {
                $controla_frigobar = $data['controla_frigobar'];
                
                // Verificar se já existe registro de frigobar
                $stmt = $this->db->prepare(
                    "SELECT COUNT(*) as count FROM estoque_quantidade 
                     WHERE id_item = :id AND local = 'frigobar'"
                );
                $stmt->execute([':id' => $id]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                $tem_frigobar = $result['count'] > 0;
                
                // Se deve controlar frigobar mas não tem registro, criar
                if ($controla_frigobar == 1 && !$tem_frigobar) {
                    $stmt = $this->db->prepare(
                        "INSERT INTO estoque_quantidade (id_item, local, quantidade_atual, quantidade_minima) 
                         VALUES (:id, 'frigobar', 0, 10)"
                    );
                    $stmt->execute([':id' => $id]);
                }
                
                // Se não deve controlar frigobar mas tem registro, deletar
                if ($controla_frigobar == 0 && $tem_frigobar) {
                    $stmt = $this->db->prepare(
                        "DELETE FROM estoque_quantidade 
                         WHERE id_item = :id AND local = 'frigobar'"
                    );
                    $stmt->execute([':id' => $id]);
                }
            }
        } catch (PDOException $e) {
            // Log error but don't fail the update
            error_log("Erro ao gerenciar frigobar para item $id: " . $e->getMessage());
        }
    }

    /**
     * Sobrescreve method read para incluir quantidades mínimas
     */
    protected function read() {
        try {
            $sql = "SELECT 
                        i.id_item, 
                        i.nome, 
                        i.controla_frigobar,
                        i.id_categoria, 
                        c.nome_categoria,
                        COALESCE(er.quantidade_minima, 10) as min_recepcao,
                        COALESCE(ef.quantidade_minima, 10) as min_frigobar
                    FROM {$this->table} i
                    LEFT JOIN estoque_categorias_item c ON i.id_categoria = c.id_categoria
                    LEFT JOIN estoque_quantidade er ON i.id_item = er.id_item AND er.local = 'recepcao'
                    LEFT JOIN estoque_quantidade ef ON i.id_item = ef.id_item AND ef.local = 'frigobar'
                    ORDER BY i.nome";
            
            $stmt = $this->db->query($sql);
            $data = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
            
            return $this->jsonResponse(true, '', ['data' => $data]);
            
        } catch (PDOException $e) {
            return $this->jsonResponse(false, 'Erro ao listar: ' . $e->getMessage());
        }
    }
}

// Conectar ao banco
$database = new Database();
$db = $database->connect();

// Criar controller customizado
$controller = new ItemCoreController($db, [
    'table' => 'estoque_item',
    'primaryKey' => 'id_item',
    'fields' => ['nome', 'id_categoria', 'controla_frigobar'],
    'requiredFields' => ['nome', 'id_categoria'],
    'orderBy' => 'nome',
    'requireAuth' => true,
    'requireAdmin' => true,
    'relationships' => [
        'nome_categoria' => [
            'table' => 'estoque_categorias_item',
            'foreignKey' => 'id_categoria',
            'primaryKey' => 'id_categoria',
            'displayField' => 'nome_categoria',
            'type' => 'LEFT'
        ]
    ]
]);

// Processar requisição
$controller->handleRequest();
