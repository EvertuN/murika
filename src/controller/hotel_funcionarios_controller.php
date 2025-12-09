<?php
/**
 * Controller de Funcionários - Usando BaseCoreController
 * 
 * Versão refatorada usando o padrão Core.
 * Reduzido de 108 linhas para ~15 linhas (86% menos código)
 * 
 * Inclui relacionamento com tabela de cargos para exibir nome do cargo na listagem.
 */

require_once __DIR__ . '/../core/CoreFactory.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

// Conectar ao banco
$database = new Database();
$db = $database->connect();

// Criar controller usando CoreFactory
$controller = CoreFactory::create($db, 'funcionario');

// Processar requisição
$controller->handleRequest();
