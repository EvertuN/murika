<?php
/**
 * Controller de Categorias - Usando BaseCoreController
 * 
 * Versão refatorada usando o padrão Core.
 * Reduzido de 74 linhas para ~15 linhas (80% menos código)
 */

require_once __DIR__ . '/../core/CoreFactory.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

// Conectar ao banco
$database = new Database();
$db = $database->connect();

// Criar controller usando CoreFactory
$controller = CoreFactory::create($db, 'categoria');

// Processar requisição
$controller->handleRequest();
