SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `murika`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `auth_logs`
--

CREATE TABLE `auth_logs` (
  `id` int(11) NOT NULL,
  `user_id` varchar(36) COLLATE utf8_bin DEFAULT NULL,
  `action` varchar(50) COLLATE utf8_bin NOT NULL,
  `details` json DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8_bin NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Estrutura para tabela `auth_tentativa_login`
--

CREATE TABLE `auth_tentativa_login` (
  `id` int(11) NOT NULL,
  `ip` varchar(45) COLLATE utf8_bin NOT NULL,
  `username` varchar(255) COLLATE utf8_bin NOT NULL,
  `attempt_time` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Estrutura para tabela `auth_users`
--

CREATE TABLE `auth_users` (
  `id` char(36) COLLATE utf8_bin NOT NULL,
  `nome` varchar(100) COLLATE utf8_bin NOT NULL,
  `usuario` varchar(50) COLLATE utf8_bin NOT NULL,
  `senha` varchar(255) COLLATE utf8_bin NOT NULL,
  `tipo` enum('admin','usuario') COLLATE utf8_bin NOT NULL DEFAULT 'usuario',
  `id_funcionario` int(11) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estoque_categorias_item`
--

CREATE TABLE `estoque_categorias_item` (
  `id_categoria` int(11) NOT NULL,
  `nome_categoria` varchar(50) COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estoque_item`
--

CREATE TABLE `estoque_item` (
  `id_item` int(11) NOT NULL,
  `nome` varchar(50) COLLATE utf8_bin DEFAULT NULL,
  `id_categoria` int(11) DEFAULT NULL,
  `controla_frigobar` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estoque_movimentacao`
--

CREATE TABLE `estoque_movimentacao` (
  `id_movimentacao` int(11) NOT NULL,
  `id_item` int(11) NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `local` enum('recepcao','frigobar') COLLATE utf8_bin NOT NULL DEFAULT 'recepcao',
  `tipo` enum('entrada','saida') COLLATE utf8_bin NOT NULL,
  `quantidade` int(11) NOT NULL,
  `quantidade_anterior` int(11) NOT NULL,
  `quantidade_posterior` int(11) NOT NULL,
  `observacao` text COLLATE utf8_bin,
  `responsavel` varchar(100) COLLATE utf8_bin DEFAULT NULL,
  `data_movimentacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estoque_quantidade`
--

CREATE TABLE `estoque_quantidade` (
  `id_estoque` int(11) NOT NULL,
  `id_item` int(11) NOT NULL,
  `local` enum('recepcao','frigobar') COLLATE utf8_bin NOT NULL DEFAULT 'recepcao',
  `quantidade_atual` int(11) NOT NULL DEFAULT '0',
  `quantidade_minima` int(11) NOT NULL DEFAULT '10',
  `data_atualizacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Estrutura para tabela `hotel_cargo`
--

CREATE TABLE `hotel_cargo` (
  `id_cargo` int(11) NOT NULL,
  `cargo` varchar(25) COLLATE utf8_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Estrutura para tabela `hotel_funcionarios`
--

CREATE TABLE `hotel_funcionarios` (
  `id_funcionario` int(11) NOT NULL,
  `nome` varchar(50) COLLATE utf8_bin NOT NULL,
  `id_cargo` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Estrutura para tabela `system_logs`
--

CREATE TABLE `system_logs` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'SYSTEM, INVENTORY, REPORT, ADMIN',
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_entity` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tabela ou entidade afetada',
  `target_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID do registro afetado',
  `details` json DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `auth_logs`
--
ALTER TABLE `auth_logs`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `auth_tentativa_login`
--
ALTER TABLE `auth_tentativa_login`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `auth_users`
--
ALTER TABLE `auth_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario` (`usuario`),
  ADD KEY `fk_auth_funcionario` (`id_funcionario`);

--
-- Índices de tabela `estoque_categorias_item`
--
ALTER TABLE `estoque_categorias_item`
  ADD PRIMARY KEY (`id_categoria`);

--
-- Índices de tabela `estoque_item`
--
ALTER TABLE `estoque_item`
  ADD PRIMARY KEY (`id_item`),
  ADD KEY `id_categoria` (`id_categoria`);

--
-- Índices de tabela `estoque_movimentacao`
--
ALTER TABLE `estoque_movimentacao`
  ADD PRIMARY KEY (`id_movimentacao`),
  ADD KEY `id_item` (`id_item`),
  ADD KEY `tipo` (`tipo`),
  ADD KEY `data_movimentacao` (`data_movimentacao`),
  ADD KEY `idx_movimentacao_data` (`data_movimentacao`),
  ADD KEY `idx_item_tipo` (`id_item`,`tipo`),
  ADD KEY `idx_item_local` (`id_item`,`local`);

--
-- Índices de tabela `estoque_quantidade`
--
ALTER TABLE `estoque_quantidade`
  ADD PRIMARY KEY (`id_estoque`),
  ADD UNIQUE KEY `unique_item_local` (`id_item`,`local`);

--
-- Índices de tabela `hotel_cargo`
--
ALTER TABLE `hotel_cargo`
  ADD PRIMARY KEY (`id_cargo`);

--
-- Índices de tabela `hotel_funcionarios`
--
ALTER TABLE `hotel_funcionarios`
  ADD PRIMARY KEY (`id_funcionario`),
  ADD KEY `id_cargo` (`id_cargo`);

--
-- Índices de tabela `system_logs`
--
ALTER TABLE `system_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_entity` (`target_entity`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `auth_logs`
--
ALTER TABLE `auth_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `auth_tentativa_login`
--
ALTER TABLE `auth_tentativa_login`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estoque_categorias_item`
--
ALTER TABLE `estoque_categorias_item`
  MODIFY `id_categoria` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estoque_item`
--
ALTER TABLE `estoque_item`
  MODIFY `id_item` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estoque_movimentacao`
--
ALTER TABLE `estoque_movimentacao`
  MODIFY `id_movimentacao` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estoque_quantidade`
--
ALTER TABLE `estoque_quantidade`
  MODIFY `id_estoque` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `hotel_cargo`
--
ALTER TABLE `hotel_cargo`
  MODIFY `id_cargo` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `hotel_funcionarios`
--
ALTER TABLE `hotel_funcionarios`
  MODIFY `id_funcionario` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `auth_users`
--
ALTER TABLE `auth_users`
  ADD CONSTRAINT `fk_auth_funcionario` FOREIGN KEY (`id_funcionario`) REFERENCES `hotel_funcionarios` (`id_funcionario`) ON DELETE SET NULL;

--
-- Restrições para tabelas `estoque_item`
--
ALTER TABLE `estoque_item`
  ADD CONSTRAINT `estoque_item_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `estoque_categorias_item` (`id_categoria`);

--
-- Restrições para tabelas `estoque_movimentacao`
--
ALTER TABLE `estoque_movimentacao`
  ADD CONSTRAINT `estoque_movimentacao_ibfk_1` FOREIGN KEY (`id_item`) REFERENCES `estoque_item` (`id_item`) ON DELETE CASCADE;

--
-- Restrições para tabelas `estoque_quantidade`
--
ALTER TABLE `estoque_quantidade`
  ADD CONSTRAINT `estoque_quantidade_ibfk_1` FOREIGN KEY (`id_item`) REFERENCES `estoque_item` (`id_item`) ON DELETE CASCADE;

--
-- Restrições para tabelas `hotel_funcionarios`
--
ALTER TABLE `hotel_funcionarios`
  ADD CONSTRAINT `hotel_funcionarios_ibfk_1` FOREIGN KEY (`id_cargo`) REFERENCES `hotel_cargo` (`id_cargo`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
