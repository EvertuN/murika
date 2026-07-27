<?php
/**
 * CoreFactory - Fábrica para criar controllers Core
 * 
 * Facilita a criação de controllers genéricos com configurações pré-definidas.
 */

require_once __DIR__ . '/BaseCoreController.php';

class CoreFactory {
    
    /**
     * Configurações padrão para cada entidade
     */
    private static $configs = [
        'cargo' => [
            'table' => 'hotel_cargo',
            'primaryKey' => 'id_cargo',
            'fields' => ['cargo'],
            'requiredFields' => ['cargo'],
            'orderBy' => 'cargo',
            'requireAuth' => true,
            'requireAdmin' => true
        ],
        
        'categoria' => [
            'table' => 'estoque_categorias_item',
            'primaryKey' => 'id_categoria',
            'fields' => ['nome_categoria'],
            'requiredFields' => ['nome_categoria'],
            'orderBy' => 'nome_categoria',
            'requireAuth' => true,
            'requireAdmin' => true,
            'softDelete' => true,
            'uniqueChecks' => [
                [
                    'field' => 'nome_categoria',
                    'expression' => 'nome_categoria',
                    'activeMessage' => 'Categoria já cadastrada.',
                    'inactiveMessage' => 'Categoria já existe inativada. Contate um administrador para ativar.'
                ]
            ],
            'deleteBlockActiveChildren' => [
                [
                    'table' => 'estoque_item',
                    'field' => 'id_categoria',
                    'activeColumn' => 'is_deleted',
                    'message' => 'Inative todos os itens desta categoria antes de excluir a categoria.'
                ]
            ]
        ],
        
        'funcionarios' => [
            'table' => 'hotel_funcionarios',
            'primaryKey' => 'id_funcionario',
            'fields' => ['nome', 'id_cargo'],
            'requiredFields' => ['nome', 'id_cargo'],
            'orderBy' => 'nome',
            'requireAuth' => true,
            'requireAdmin' => true,
            'relationships' => [
                'cargo' => [
                    'table' => 'hotel_cargo',
                    'foreignKey' => 'id_cargo',
                    'primaryKey' => 'id_cargo',
                    'displayField' => 'cargo',
                    'type' => 'LEFT'
                ]
            ]
        ],
        
        'item' => [
            'table' => 'estoque_item',
            'primaryKey' => 'id_item',
            'fields' => ['nome', 'id_categoria', 'preco_venda'],
            'requiredFields' => ['nome', 'id_categoria', 'preco_venda'],
            'orderBy' => 'nome',
            'requireAuth' => true,
            'requireAdmin' => false,
            'createRequireAdmin' => true,
            'updateRequireAdmin' => true,
            'deleteRequireAdmin' => true,
            'softDelete' => true,
            'uniqueChecks' => [
                [
                    'field' => 'nome',
                    'expression' => 'nome',
                    'activeMessage' => 'Item já cadastrado.',
                    'inactiveMessage' => 'Item já existe inativado. Contate um administrador para ativar.'
                ]
            ],
            'relationships' => [
                'nome_categoria' => [
                    'table' => 'estoque_categorias_item',
                    'foreignKey' => 'id_categoria',
                    'primaryKey' => 'id_categoria',
                    'displayField' => 'nome_categoria',
                    'type' => 'LEFT'
                ]
            ]
        ],
        
        'cliente' => [
            'table' => 'hospedagem_cliente_dados',
            'primaryKey' => 'id_cliente',
            'fields' => ['nome', 'telefone', 'email', 'tipo_documento', 'documento', 'credito'],
            'requiredFields' => ['nome', 'tipo_documento', 'documento'],
            'orderBy' => 'nome',
            'requireAuth' => true,
            'requireAdmin' => false,
            'createRequireAdmin' => false,
            'updateRequireAdmin' => true,
            'deleteRequireAdmin' => true,
            'softDelete' => true
        ],

        'empresa' => [
            'table' => 'hospedagem_empresa_dados',
            'primaryKey' => 'id_empresa',
            'fields' => ['razao_social', 'cnpj', 'telefone'],
            'requiredFields' => ['cnpj'],
            'orderBy' => 'razao_social',
            'requireAuth' => true,
            'requireAdmin' => false,
            'createRequireAdmin' => false,
            'updateRequireAdmin' => true,
            'deleteRequireAdmin' => true,
            'softDelete' => true
        ]

    ];
    
    /**
     * Cria um controller core para a entidade especificada
     * 
     * @param PDO $db Conexão com banco de dados
     * @param string $entity Nome da entidade (cargo, categoria, funcionario, item)
     * @param array $customConfig Configurações customizadas (opcional)
     * @return BaseCoreController
     */
    public static function create($db, $entity, $customConfig = []) {
        if (!isset(self::$configs[$entity])) {
            throw new Exception("Entidade '$entity' não possui configuração padrão");
        }
        
        // Mesclar configuração padrão com customizações
        $config = array_merge(self::$configs[$entity], $customConfig);
        
        return new BaseCoreController($db, $config);
    }
    
    /**
     * Verifica se uma entidade existe na configuração
     * 
     * @param string $entity Nome da entidade
     * @return bool
     */
    public static function hasEntity($entity) {
        return isset(self::$configs[$entity]);
    }

    /**
     * Retorna a configuração de uma entidade
     * 
     * @param string $entity Nome da entidade
     * @return array Configuração
     */
    public static function getConfig($entity) {
        return self::$configs[$entity] ?? null;
    }
    
    /**
     * Lista todas as entidades disponíveis
     * 
     * @return array Lista de nomes de entidades
     */
    public static function listEntities() {
        return array_keys(self::$configs);
    }
}
