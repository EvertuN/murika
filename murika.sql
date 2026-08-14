-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Tempo de geração: 14/08/2026 às 14:56
-- Versão do servidor: 8.0.46
-- Versão do PHP: 8.3.26

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
-- Estrutura para tabela `app_config`
--

CREATE TABLE `app_config` (
  `config_key` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value_type` enum('integer','time','boolean') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'integer',
  `config_group` enum('security','reservation','inventory','report') COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `min_value` int DEFAULT NULL,
  `max_value` int DEFAULT NULL,
  `updated_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `auth_logs`
--

CREATE TABLE `auth_logs` (
  `id` int NOT NULL,
  `user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` json DEFAULT NULL,
  `ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `auth_tentativa_login`
--

CREATE TABLE `auth_tentativa_login` (
  `id` int NOT NULL,
  `ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempt_time` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `auth_users`
--

CREATE TABLE `auth_users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('admin','recepcao','financeiro') COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_funcionario` int DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login_at` datetime DEFAULT NULL,
  `password_changed_at` datetime DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `precisa_trocar_senha` tinyint(1) NOT NULL DEFAULT '0',
  `session_version` int UNSIGNED NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estoque_categorias_item`
--

CREATE TABLE `estoque_categorias_item` (
  `id_categoria` int NOT NULL,
  `nome_categoria` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deleted` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estoque_item`
--

CREATE TABLE `estoque_item` (
  `id_item` int NOT NULL,
  `nome` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_categoria` int DEFAULT NULL,
  `preco_venda` decimal(10,2) DEFAULT '0.00',
  `is_deleted` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estoque_movimentacao`
--

CREATE TABLE `estoque_movimentacao` (
  `id_movimentacao` int NOT NULL,
  `id_item` int NOT NULL,
  `id_usuario` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` enum('entrada','saida') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantidade` int NOT NULL,
  `quantidade_corrigida` int DEFAULT NULL,
  `corrigida` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `motivo_correcao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `corrigida_por` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `corrigida_em` datetime DEFAULT NULL,
  `quantidade_anterior` int NOT NULL,
  `quantidade_posterior` int NOT NULL,
  `observacao` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `responsavel` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_movimentacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estoque_quantidade`
--

CREATE TABLE `estoque_quantidade` (
  `id_estoque` int NOT NULL,
  `id_item` int NOT NULL,
  `quantidade_atual` int NOT NULL DEFAULT '0',
  `quantidade_minima` int NOT NULL DEFAULT '10',
  `data_atualizacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `financeiro_forma_pagamento`
--

CREATE TABLE `financeiro_forma_pagamento` (
  `id_forma_pagamento` tinyint UNSIGNED NOT NULL,
  `nome_forma_pagamento` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- --------------------------------------------------------

--
-- Estrutura para tabela `financeiro_origem_pagamento`
--

CREATE TABLE `financeiro_origem_pagamento` (
  `id_origem_pagamento` tinyint UNSIGNED NOT NULL,
  `nome_origem_pagamento` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL,
  `codigo_monitoramento` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT 'Código do estabelecimento no CSV',
  `tipo` enum('MAQUININHA','LINK','OUTRO') CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT 'OUTRO' COMMENT 'Define regras de validação no frontend'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `financeiro_reserva_logs`
--

CREATE TABLE `financeiro_reserva_logs` (
  `id_log` int UNSIGNED NOT NULL,
  `id_reserva_pagamento` int UNSIGNED DEFAULT NULL,
  `acao` enum('CREATE','UPDATE','DELETE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_usuario` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dados_anteriores` json DEFAULT NULL,
  `dados_novos` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `hospedagem_cliente_dados`
--

CREATE TABLE `hospedagem_cliente_dados` (
  `id_cliente` int NOT NULL,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_documento` enum('CPF','RG','CNH','Passaporte','RNE/CRNM') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `documento` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `credito` decimal(10,2) DEFAULT '0.00',
  `is_deleted` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `hospedagem_empresa_dados`
--

CREATE TABLE `hospedagem_empresa_dados` (
  `id_empresa` int NOT NULL,
  `razao_social` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnpj` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `hospedagem_reserva`
--

CREATE TABLE `hospedagem_reserva` (
  `id_reserva` int NOT NULL,
  `id_quarto` int NOT NULL,
  `id_cliente` int DEFAULT NULL,
  `id_empresa` int DEFAULT NULL,
  `origem` enum('BALCAO','ONLINE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BALCAO',
  `data_checkin` datetime NOT NULL,
  `data_checkout` datetime DEFAULT NULL,
  `quantidade_diarias` int UNSIGNED NOT NULL DEFAULT '1',
  `valor_estadia` decimal(10,2) NOT NULL DEFAULT '0.00',
  `valor_estadia_atualizado_em` datetime DEFAULT NULL,
  `valor_estadia_atualizado_por` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ABERTA','FECHADA','CANCELADA') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ABERTA',
  `sem_pagamento` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `ignorar_fechamento_automatico` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `observacao` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `codigo_reserva` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_usuario` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `hospedagem_reserva_consumo`
--

CREATE TABLE `hospedagem_reserva_consumo` (
  `id_consumo` int NOT NULL,
  `tipo_consumo` enum('CONSUMO_HOSPEDE','OUTRO_CONSUMO','DESCARTE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CONSUMO_HOSPEDE',
  `id_reserva` int DEFAULT NULL,
  `id_item` int NOT NULL,
  `id_movimentacao` int DEFAULT NULL,
  `quantidade` int NOT NULL,
  `valor_sugerido` decimal(10,2) NOT NULL DEFAULT '0.00',
  `valor_unitario` decimal(10,2) NOT NULL,
  `valor_total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `valor_sobrescrito` tinyint(1) NOT NULL DEFAULT '0',
  `valor_sobrescrito_por` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `justificativa_valor` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `responsavel_consumo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_forma_pagamento` tinyint UNSIGNED DEFAULT NULL,
  `codigo_autorizacao` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_prazo` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `status_pagamento` enum('PENDENTE','PAGO','COBRADO_RESERVA','A_PRAZO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PAGO',
  `data_pagamento` date DEFAULT NULL,
  `observacao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_usuario` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `hospedagem_reserva_pagamento`
--

CREATE TABLE `hospedagem_reserva_pagamento` (
  `id_pagamento` int NOT NULL,
  `id_reserva` int NOT NULL,
  `id_forma_pagamento` tinyint UNSIGNED DEFAULT NULL,
  `valor` decimal(10,2) NOT NULL,
  `data_pagamento` date NOT NULL,
  `codigo_autorizacao` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_nf` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_prazo` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `observacao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `id_usuario` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `hotel_cargo`
--

CREATE TABLE `hotel_cargo` (
  `id_cargo` int NOT NULL,
  `cargo` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `hotel_funcionarios`
--

CREATE TABLE `hotel_funcionarios` (
  `id_funcionario` int NOT NULL,
  `nome` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_cargo` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `hotel_quarto`
--

CREATE TABLE `hotel_quarto` (
  `id_quarto` int NOT NULL,
  `numero` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `hotel_quarto_preco`
--

CREATE TABLE `hotel_quarto_preco` (
  `tipo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `preco_padrao` decimal(10,2) NOT NULL DEFAULT '0.00',
  `preco_2_pessoas` decimal(10,2) NOT NULL DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `system_logs`
--

CREATE TABLE `system_logs` (
  `id` int NOT NULL,
  `user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'SYSTEM, INVENTORY, REPORT, ADMIN',
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_entity` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tabela ou entidade afetada',
  `target_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID do registro afetado',
  `details` json DEFAULT NULL,
  `ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tipo_documento`
--

CREATE TABLE `tipo_documento` (
  `id` bigint UNSIGNED NOT NULL,
  `codigo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `criado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `app_config`
--
ALTER TABLE `app_config`
  ADD PRIMARY KEY (`config_key`),
  ADD KEY `idx_app_config_group` (`config_group`),
  ADD KEY `idx_app_config_user` (`updated_by`);

--
-- Índices de tabela `auth_logs`
--
ALTER TABLE `auth_logs`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `auth_tentativa_login`
--
ALTER TABLE `auth_tentativa_login`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_auth_attempt_username_time` (`username`,`attempt_time`),
  ADD KEY `idx_auth_attempt_ip_time` (`ip`,`attempt_time`);

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
  ADD PRIMARY KEY (`id_categoria`),
  ADD KEY `idx_categoria_is_deleted` (`is_deleted`),
  ADD KEY `fk_categoria_deleted_by` (`deleted_by`);

--
-- Índices de tabela `estoque_item`
--
ALTER TABLE `estoque_item`
  ADD PRIMARY KEY (`id_item`),
  ADD KEY `id_categoria` (`id_categoria`),
  ADD KEY `idx_item_is_deleted` (`is_deleted`),
  ADD KEY `idx_item_categoria_deleted` (`id_categoria`,`is_deleted`),
  ADD KEY `fk_item_deleted_by` (`deleted_by`);

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
  ADD KEY `idx_estoque_movimentacao_corrigida` (`corrigida`,`corrigida_em`),
  ADD KEY `idx_estoque_movimentacao_usuario` (`id_usuario`);

--
-- Índices de tabela `estoque_quantidade`
--
ALTER TABLE `estoque_quantidade`
  ADD PRIMARY KEY (`id_estoque`),
  ADD UNIQUE KEY `unique_item` (`id_item`);

--
-- Índices de tabela `financeiro_forma_pagamento`
--
ALTER TABLE `financeiro_forma_pagamento`
  ADD PRIMARY KEY (`id_forma_pagamento`),
  ADD UNIQUE KEY `uk_nome_forma_pagamento` (`nome_forma_pagamento`);

--
-- Índices de tabela `financeiro_origem_pagamento`
--
ALTER TABLE `financeiro_origem_pagamento`
  ADD PRIMARY KEY (`id_origem_pagamento`),
  ADD UNIQUE KEY `uk_codigo_monitoramento` (`codigo_monitoramento`);

--
-- Índices de tabela `financeiro_reserva_logs`
--
ALTER TABLE `financeiro_reserva_logs`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `idx_reserva` (`id_reserva_pagamento`),
  ADD KEY `idx_usuario` (`id_usuario`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Índices de tabela `hospedagem_cliente_dados`
--
ALTER TABLE `hospedagem_cliente_dados`
  ADD PRIMARY KEY (`id_cliente`),
  ADD UNIQUE KEY `idx_documento_unico` (`documento`),
  ADD KEY `idx_busca_contato` (`email`,`telefone`),
  ADD KEY `idx_cliente_is_deleted` (`is_deleted`),
  ADD KEY `idx_cliente_documento_deleted` (`documento`,`is_deleted`),
  ADD KEY `fk_cliente_deleted_by` (`deleted_by`);

--
-- Índices de tabela `hospedagem_empresa_dados`
--
ALTER TABLE `hospedagem_empresa_dados`
  ADD PRIMARY KEY (`id_empresa`),
  ADD UNIQUE KEY `idx_cnpj` (`cnpj`),
  ADD KEY `idx_empresa_is_deleted` (`is_deleted`),
  ADD KEY `idx_empresa_cnpj_deleted` (`cnpj`,`is_deleted`),
  ADD KEY `fk_empresa_deleted_by` (`deleted_by`);

--
-- Índices de tabela `hospedagem_reserva`
--
ALTER TABLE `hospedagem_reserva`
  ADD PRIMARY KEY (`id_reserva`),
  ADD KEY `idx_quarto` (`id_quarto`),
  ADD KEY `idx_cliente` (`id_cliente`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_origem` (`origem`),
  ADD KEY `idx_empresa` (`id_empresa`),
  ADD KEY `fk_hosp_res_usuario` (`id_usuario`),
  ADD KEY `idx_hosp_reserva_auto_fechamento` (`status`,`ignorar_fechamento_automatico`,`data_checkout`),
  ADD KEY `idx_reserva_periodo` (`data_checkin`,`data_checkout`),
  ADD KEY `idx_reserva_valor_usuario` (`valor_estadia_atualizado_por`);

--
-- Índices de tabela `hospedagem_reserva_consumo`
--
ALTER TABLE `hospedagem_reserva_consumo`
  ADD PRIMARY KEY (`id_consumo`),
  ADD KEY `idx_reserva` (`id_reserva`),
  ADD KEY `idx_item` (`id_item`),
  ADD KEY `idx_movimentacao` (`id_movimentacao`),
  ADD KEY `idx_consumo_tipo` (`tipo_consumo`),
  ADD KEY `idx_consumo_forma_pagamento` (`id_forma_pagamento`),
  ADD KEY `idx_consumo_usuario` (`id_usuario`),
  ADD KEY `idx_consumo_created_at` (`created_at`),
  ADD KEY `idx_consumo_codigo_created_prazo` (`codigo_autorizacao`,`created_at`,`is_prazo`),
  ADD KEY `idx_consumo_prazo_created` (`is_prazo`,`created_at`),
  ADD KEY `idx_consumo_status_pagamento` (`status_pagamento`,`created_at`),
  ADD KEY `idx_consumo_data_pagamento` (`data_pagamento`),
  ADD KEY `idx_consumo_valor_sobrescrito` (`valor_sobrescrito`,`created_at`),
  ADD KEY `idx_consumo_valor_usuario` (`valor_sobrescrito_por`);

--
-- Índices de tabela `hospedagem_reserva_pagamento`
--
ALTER TABLE `hospedagem_reserva_pagamento`
  ADD PRIMARY KEY (`id_pagamento`),
  ADD KEY `idx_reserva` (`id_reserva`),
  ADD KEY `idx_data` (`data_pagamento`),
  ADD KEY `idx_forma` (`id_forma_pagamento`),
  ADD KEY `fk_hosp_pag_usuario` (`id_usuario`),
  ADD KEY `idx_reserva_pagamento_codigo_data_prazo` (`codigo_autorizacao`,`data_pagamento`,`is_prazo`),
  ADD KEY `idx_reserva_pagamento_prazo_data` (`is_prazo`,`data_pagamento`);

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
-- Índices de tabela `hotel_quarto`
--
ALTER TABLE `hotel_quarto`
  ADD PRIMARY KEY (`id_quarto`),
  ADD UNIQUE KEY `numero` (`numero`),
  ADD KEY `fk_quarto_config` (`tipo`);

--
-- Índices de tabela `hotel_quarto_preco`
--
ALTER TABLE `hotel_quarto_preco`
  ADD PRIMARY KEY (`tipo`);

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
-- Índices de tabela `tipo_documento`
--
ALTER TABLE `tipo_documento`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `auth_logs`
--
ALTER TABLE `auth_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `auth_tentativa_login`
--
ALTER TABLE `auth_tentativa_login`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estoque_categorias_item`
--
ALTER TABLE `estoque_categorias_item`
  MODIFY `id_categoria` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estoque_item`
--
ALTER TABLE `estoque_item`
  MODIFY `id_item` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estoque_movimentacao`
--
ALTER TABLE `estoque_movimentacao`
  MODIFY `id_movimentacao` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estoque_quantidade`
--
ALTER TABLE `estoque_quantidade`
  MODIFY `id_estoque` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `financeiro_forma_pagamento`
--
ALTER TABLE `financeiro_forma_pagamento`
  MODIFY `id_forma_pagamento` tinyint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `financeiro_origem_pagamento`
--
ALTER TABLE `financeiro_origem_pagamento`
  MODIFY `id_origem_pagamento` tinyint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `financeiro_reserva_logs`
--
ALTER TABLE `financeiro_reserva_logs`
  MODIFY `id_log` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `hospedagem_cliente_dados`
--
ALTER TABLE `hospedagem_cliente_dados`
  MODIFY `id_cliente` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `hospedagem_empresa_dados`
--
ALTER TABLE `hospedagem_empresa_dados`
  MODIFY `id_empresa` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `hospedagem_reserva`
--
ALTER TABLE `hospedagem_reserva`
  MODIFY `id_reserva` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `hospedagem_reserva_consumo`
--
ALTER TABLE `hospedagem_reserva_consumo`
  MODIFY `id_consumo` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `hospedagem_reserva_pagamento`
--
ALTER TABLE `hospedagem_reserva_pagamento`
  MODIFY `id_pagamento` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `hotel_cargo`
--
ALTER TABLE `hotel_cargo`
  MODIFY `id_cargo` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `hotel_funcionarios`
--
ALTER TABLE `hotel_funcionarios`
  MODIFY `id_funcionario` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `hotel_quarto`
--
ALTER TABLE `hotel_quarto`
  MODIFY `id_quarto` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `tipo_documento`
--
ALTER TABLE `tipo_documento`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `app_config`
--
ALTER TABLE `app_config`
  ADD CONSTRAINT `fk_app_config_user` FOREIGN KEY (`updated_by`) REFERENCES `auth_users` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `auth_users`
--
ALTER TABLE `auth_users`
  ADD CONSTRAINT `fk_auth_funcionario` FOREIGN KEY (`id_funcionario`) REFERENCES `hotel_funcionarios` (`id_funcionario`) ON DELETE SET NULL;

--
-- Restrições para tabelas `estoque_categorias_item`
--
ALTER TABLE `estoque_categorias_item`
  ADD CONSTRAINT `fk_categoria_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `auth_users` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `estoque_item`
--
ALTER TABLE `estoque_item`
  ADD CONSTRAINT `estoque_item_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `estoque_categorias_item` (`id_categoria`),
  ADD CONSTRAINT `fk_item_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `auth_users` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `estoque_movimentacao`
--
ALTER TABLE `estoque_movimentacao`
  ADD CONSTRAINT `estoque_movimentacao_ibfk_1` FOREIGN KEY (`id_item`) REFERENCES `estoque_item` (`id_item`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_estoque_movimentacao_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `auth_users` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `estoque_quantidade`
--
ALTER TABLE `estoque_quantidade`
  ADD CONSTRAINT `estoque_quantidade_ibfk_1` FOREIGN KEY (`id_item`) REFERENCES `estoque_item` (`id_item`) ON DELETE CASCADE;

--
-- Restrições para tabelas `hospedagem_cliente_dados`
--
ALTER TABLE `hospedagem_cliente_dados`
  ADD CONSTRAINT `fk_cliente_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `auth_users` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `hospedagem_empresa_dados`
--
ALTER TABLE `hospedagem_empresa_dados`
  ADD CONSTRAINT `fk_empresa_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `auth_users` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `hospedagem_reserva`
--
ALTER TABLE `hospedagem_reserva`
  ADD CONSTRAINT `fk_hosp_res_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `auth_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reserva_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `hospedagem_cliente_dados` (`id_cliente`),
  ADD CONSTRAINT `fk_reserva_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `hospedagem_empresa_dados` (`id_empresa`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_reserva_quarto` FOREIGN KEY (`id_quarto`) REFERENCES `hotel_quarto` (`id_quarto`),
  ADD CONSTRAINT `fk_reserva_valor_usuario` FOREIGN KEY (`valor_estadia_atualizado_por`) REFERENCES `auth_users` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `hospedagem_reserva_consumo`
--
ALTER TABLE `hospedagem_reserva_consumo`
  ADD CONSTRAINT `fk_consumo_forma_pagamento` FOREIGN KEY (`id_forma_pagamento`) REFERENCES `financeiro_forma_pagamento` (`id_forma_pagamento`),
  ADD CONSTRAINT `fk_consumo_item` FOREIGN KEY (`id_item`) REFERENCES `estoque_item` (`id_item`),
  ADD CONSTRAINT `fk_consumo_movimentacao` FOREIGN KEY (`id_movimentacao`) REFERENCES `estoque_movimentacao` (`id_movimentacao`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_consumo_reserva` FOREIGN KEY (`id_reserva`) REFERENCES `hospedagem_reserva` (`id_reserva`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_consumo_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `auth_users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_consumo_valor_usuario` FOREIGN KEY (`valor_sobrescrito_por`) REFERENCES `auth_users` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `hospedagem_reserva_pagamento`
--
ALTER TABLE `hospedagem_reserva_pagamento`
  ADD CONSTRAINT `fk_hosp_pag_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `auth_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pagamento_forma` FOREIGN KEY (`id_forma_pagamento`) REFERENCES `financeiro_forma_pagamento` (`id_forma_pagamento`),
  ADD CONSTRAINT `fk_pagamento_reserva` FOREIGN KEY (`id_reserva`) REFERENCES `hospedagem_reserva` (`id_reserva`) ON DELETE CASCADE;

--
-- Restrições para tabelas `hotel_funcionarios`
--
ALTER TABLE `hotel_funcionarios`
  ADD CONSTRAINT `hotel_funcionarios_ibfk_1` FOREIGN KEY (`id_cargo`) REFERENCES `hotel_cargo` (`id_cargo`);

--
-- Restrições para tabelas `hotel_quarto`
--
ALTER TABLE `hotel_quarto`
  ADD CONSTRAINT `fk_quarto_config` FOREIGN KEY (`tipo`) REFERENCES `hotel_quarto_preco` (`tipo`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
