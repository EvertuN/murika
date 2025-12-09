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
            'requireAdmin' => true
        ],
        
        'funcionario' => [
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
