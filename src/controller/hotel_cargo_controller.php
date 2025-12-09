<?php
/**
 * Controller de Cargos - Usando BaseCoreController
 * 
 * Versão refatorada usando o padrão Core.
 * Reduzido de 108 linhas para ~15 linhas (86% menos código)
 */

require_once __DIR__ . '/../core/CoreFactory.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

// Conectar ao banco
$database = new Database();
$db = $database->connect();

// Criar controller usando CoreFactory
$controller = CoreFactory::create($db, 'cargo');

// Processar requisição
$controller->handleRequest();
