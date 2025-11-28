# Sistema de Gestão de Hotel
## 100% MURIKA
### O melhor, maior e mais humilde sistema de gerenciamento de hoteis existente
```
docker-compose up -d

containers:
    - murika-php | 68f2b9aaa609
    - mysql:5.7 | d08135c28362
    - phpmyadmin/phpmyadmin | 0e4614d8779a
```

## DB
```
-- ============================================
-- MIGRAÇÃO: Adicionar coluna LOCAL (corrigido)
-- ============================================

-- 1. Remover a foreign key constraint primeiro
ALTER TABLE `estoque_quantidade` 
DROP FOREIGN KEY `estoque_quantidade_ibfk_1`;

-- 2. Remover a constraint UNIQUE do id_item
ALTER TABLE `estoque_quantidade` 
DROP INDEX `id_item`;

-- 3. Adicionar coluna LOCAL
ALTER TABLE `estoque_quantidade` 
ADD COLUMN `local` ENUM('recepcao', 'frigobar') NOT NULL DEFAULT 'recepcao' AFTER `id_item`;

-- 4. Criar UNIQUE KEY composto (id_item + local)
ALTER TABLE `estoque_quantidade` 
ADD UNIQUE KEY `unique_item_local` (`id_item`, `local`);

-- 5. Recriar a foreign key
ALTER TABLE `estoque_quantidade` 
ADD CONSTRAINT `estoque_quantidade_ibfk_1` 
FOREIGN KEY (`id_item`) REFERENCES `estoque_item` (`id_item`) ON DELETE CASCADE;

-- 6. Adicionar coluna LOCAL na tabela de movimentação
ALTER TABLE `estoque_movimentacao` 
ADD COLUMN `local` ENUM('recepcao', 'frigobar') NOT NULL DEFAULT 'recepcao' AFTER `id_item`;

-- 7. Adicionar índice para melhorar performance de consultas
ALTER TABLE `estoque_movimentacao` 
ADD INDEX `idx_item_local` (`id_item`, `local`);

-- ============================================
-- OPCIONAL: Criar registros de frigobar para itens que controlam frigobar
-- ============================================

-- Inserir registro de frigobar para itens que têm controla_frigobar = 1
INSERT INTO `estoque_quantidade` (`id_item`, `local`, `quantidade_atual`, `quantidade_minima`)
SELECT 
    ei.id_item,
    'frigobar' AS local,
    0 AS quantidade_atual,
    10 AS quantidade_minima
FROM `estoque_item` ei
WHERE ei.controla_frigobar = 1
AND NOT EXISTS (
    SELECT 1 
    FROM `estoque_quantidade` eq 
    WHERE eq.id_item = ei.id_item 
    AND eq.local = 'frigobar'
);

-- ============================================
-- VERIFICAÇÃO: Conferir a estrutura
-- ============================================

-- Ver a nova estrutura da tabela
DESCRIBE `estoque_quantidade`;

-- Ver os registros atualizados
SELECT 
    eq.id_estoque,
    ei.nome AS item,
    eq.local,
    eq.quantidade_atual,
    eq.quantidade_minima,
    ei.controla_frigobar
FROM `estoque_quantidade` eq
JOIN `estoque_item` ei ON eq.id_item = ei.id_item
ORDER BY ei.nome, eq.local;
```

