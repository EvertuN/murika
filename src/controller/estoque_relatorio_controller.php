<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../core/Logger.php'; // Adicionar Logger

// Check if this is an API call or direct access
$isApi = isset($_GET['acao']) || isset($_POST['acao']);

if ($isApi) {
    header('Content-Type: application/json');
    $acao = $_POST['acao'] ?? $_GET['acao'] ?? '';
    
    switch($acao) {
        case 'gerar_relatorio':
            gerarRelatorio();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Ação inválida']);
    }
} else {
    // Direct access - render the report
    renderizarRelatorio();
}

function gerarRelatorio() {
    if (!isAuthenticated()) {
        echo json_encode(['success' => false, 'message' => 'Usuário não autenticado']);
        return;
    }
    
    $data = $_GET['data'] ?? date('Y-m-d');
    $turno = $_GET['turno'] ?? '1';
    
    // Validate inputs
    if (!in_array($turno, ['1', '2'])) {
        echo json_encode(['success' => false, 'message' => 'Turno inválido']);
        return;
    }
    
    // Generate report URL
    $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
    $reportUrl = $baseUrl . dirname($_SERVER['PHP_SELF']) . "/estoque_relatorio_controller.php?data=$data&turno=$turno";
    
    echo json_encode([
        'success' => true,
        'url' => $reportUrl,
        'message' => 'Relatório gerado com sucesso'
    ]);
}

function renderizarRelatorio() {
    if (!isAuthenticated()) {
        die('Acesso negado. Faça login para visualizar o relatório.');
    }
    
    $db = new Database();
    $pdo = $db->connect();
    
    $data_filtro = $_GET['data'] ?? date('Y-m-d');
    $turno = $_GET['turno'] ?? '1';
    $id_funcionario = intval($_GET['funcionario'] ?? 0);
    
    // Get employee name
    $nome_funcionario = 'N/A';
    if ($id_funcionario > 0) {
        $stmt = $pdo->prepare("SELECT nome FROM hotel_funcionarios WHERE id_funcionario = :id");
        $stmt->execute([':id' => $id_funcionario]);
        $funcionario = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($funcionario) {
            $nome_funcionario = $funcionario['nome'];
        }
    }
        // Log da geração do relatório (Logs 2.0)
        require_once __DIR__ . '/../core/Logger.php';
        Logger::system($pdo, 'REPORT', 'GENERATE', 'relatorios', null, [
            'msg' => 'Relatório de Estoque Gerado',
            'turno' => $turno,
            'data_filtro' => $data_filtro,
            'funcionario' => $nome_funcionario
        ]);
    
    // Calculate shift time range
    if ($turno === '1') {
        // Turno 1: 06:00 às 18:00
        $data_inicio = "$data_filtro 06:00:00";
        $data_fim = "$data_filtro 18:00:00";
        $hora_inicio = "06:00";
        $hora_fim = "18:00";
        $duracao = "12 horas";
    } else {
        // Turno 2: 18:00 às 06:00 do dia seguinte
        $data_inicio = "$data_filtro 18:00:00";
        $data_fim_calc = date('Y-m-d', strtotime("$data_filtro +1 day"));
        $data_fim = "$data_fim_calc 06:00:00";
        $hora_inicio = "18:00";
        $hora_fim = "06:00";
        $duracao = "12 horas";
    }
    
    // Get all items from database
    $sql = "SELECT i.id_item, i.nome, c.nome_categoria, i.controla_frigobar
            FROM estoque_item i
            LEFT JOIN estoque_categorias_item c ON i.id_categoria = c.id_categoria
            ORDER BY c.nome_categoria, i.nome";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get movements during the shift - AGORA AGRUPADO POR LOCAL
    $sql_mov = "SELECT id_item, tipo, local, SUM(quantidade) as total
                FROM estoque_movimentacao
                WHERE data_movimentacao >= :data_inicio AND data_movimentacao < :data_fim
                GROUP BY id_item, tipo, local";
    $stmt_mov = $pdo->prepare($sql_mov);
    $stmt_mov->execute([':data_inicio' => $data_inicio, ':data_fim' => $data_fim]);
    $movements = $stmt_mov->fetchAll(PDO::FETCH_ASSOC);
    
    // Get detailed movements with observations for the report
    $sql_mov_detalhes = "SELECT 
                            m.id_movimentacao,
                            m.tipo,
                            m.quantidade,
                            m.observacao,
                            m.responsavel,
                            DATE_FORMAT(m.data_movimentacao, '%d/%m/%Y %H:%i') as data_formatada,
                            i.nome as nome_item,
                            m.local
                         FROM estoque_movimentacao m
                         INNER JOIN estoque_item i ON m.id_item = i.id_item
                         WHERE m.data_movimentacao >= :data_inicio AND m.data_movimentacao < :data_fim
                         AND m.observacao IS NOT NULL AND m.observacao != ''
                         ORDER BY m.data_movimentacao ASC";
    $stmt_mov_detalhes = $pdo->prepare($sql_mov_detalhes);
    $stmt_mov_detalhes->execute([':data_inicio' => $data_inicio, ':data_fim' => $data_fim]);
    $movimentos_com_observacao = $stmt_mov_detalhes->fetchAll(PDO::FETCH_ASSOC);
    
    // Organize movements by item AND local
    $movimentos_por_item = [];
    foreach ($movements as $mov) {
        if (!isset($movimentos_por_item[$mov['id_item']])) {
            $movimentos_por_item[$mov['id_item']] = [];
        }
        if (!isset($movimentos_por_item[$mov['id_item']][$mov['local']])) {
            $movimentos_por_item[$mov['id_item']][$mov['local']] = ['entrada' => 0, 'saida' => 0];
        }
        $movimentos_por_item[$mov['id_item']][$mov['local']][$mov['tipo']] = intval($mov['total']);
    }
    
    // Get stock levels for ALL items (using LEFT JOIN to include items without stock records)
    // We need to get stock for both locations (recepcao and frigobar) for all items
    $sql_inicial = "SELECT 
                        i.id_item,
                        'recepcao' as local,
                        COALESCE(eq.quantidade_atual, 0) as quantidade_atual,
                        COALESCE((SELECT SUM(CASE WHEN tipo = 'entrada' THEN quantidade ELSE -quantidade END)
                                 FROM estoque_movimentacao
                                 WHERE id_item = i.id_item 
                                 AND local = 'recepcao'
                                 AND data_movimentacao >= :data_inicio1
                                 AND data_movimentacao < :data_fim1), 0) as variacao
                    FROM estoque_item i
                    LEFT JOIN estoque_quantidade eq ON i.id_item = eq.id_item AND eq.local = 'recepcao'
                    
                    UNION ALL
                    
                    SELECT 
                        i.id_item,
                        'frigobar' as local,
                        COALESCE(eq.quantidade_atual, 0) as quantidade_atual,
                        COALESCE((SELECT SUM(CASE WHEN tipo = 'entrada' THEN quantidade ELSE -quantidade END)
                                 FROM estoque_movimentacao
                                 WHERE id_item = i.id_item 
                                 AND local = 'frigobar'
                                 AND data_movimentacao >= :data_inicio2
                                 AND data_movimentacao < :data_fim2), 0) as variacao
                    FROM estoque_item i
                    LEFT JOIN estoque_quantidade eq ON i.id_item = eq.id_item AND eq.local = 'frigobar'
                    WHERE i.controla_frigobar = 1";
    
    $stmt_inicial = $pdo->prepare($sql_inicial);
    $stmt_inicial->execute([
        ':data_inicio1' => $data_inicio,
        ':data_fim1' => $data_fim,
        ':data_inicio2' => $data_inicio,
        ':data_fim2' => $data_fim
    ]);
    $estoques = $stmt_inicial->fetchAll(PDO::FETCH_ASSOC);
    
    // Organize stock by item and location
    $estoque_por_item = [];
    foreach ($estoques as $est) {
        if (!isset($estoque_por_item[$est['id_item']])) {
            $estoque_por_item[$est['id_item']] = [];
        }
        // Calculate initial stock (current - variation during shift)
        $inicial = intval($est['quantidade_atual']) - intval($est['variacao']);
        $estoque_por_item[$est['id_item']][$est['local']] = [
            'inicial' => $inicial,
            'final' => intval($est['quantidade_atual'])
        ];
    }
    
    // Prepare data for template - INCLUDE ALL ITEMS organized by category
    $dados_por_categoria = [];
    foreach ($items as $item) {
        $id = $item['id_item'];
        $categoria = $item['nome_categoria'] ?? 'SEM CATEGORIA';
        
        // Define scopes to process
        $locais = ['recepcao'];
        if ($item['controla_frigobar'] == 1) {
            $locais[] = 'frigobar';
        }

        foreach ($locais as $local) {
             // Get movements for this specific local
            $entrada = isset($movimentos_por_item[$id][$local]) ? $movimentos_por_item[$id][$local]['entrada'] : 0;
            $saida = isset($movimentos_por_item[$id][$local]) ? $movimentos_por_item[$id][$local]['saida'] : 0;
            
            // Get stock levels
            if (isset($estoque_por_item[$id][$local])) {
                $inicial = $estoque_por_item[$id][$local]['inicial'];
                $final = $estoque_por_item[$id][$local]['final'];
            } else {
                $inicial = 0;
                $final = 0;
            }

            // Custom Categorization Logic
            $db_cat = mb_strtoupper($item['nome_categoria'] ?? '', 'UTF-8');
            $custom_categoria = 'OUTROS';
            
            if (strpos($db_cat, 'BEBIDA') !== false || strpos($db_cat, 'REFRIGERANTE') !== false) {
                if ($local === 'frigobar') {
                    $custom_categoria = 'BEBIDAS (FRIGOBAR)';
                } else {
                    $custom_categoria = 'BEBIDAS (ESTOQUE)';
                }
            } elseif (strpos($db_cat, 'ENXOVAL') !== false || strpos($db_cat, 'CAMA') !== false || strpos($db_cat, 'BANHO') !== false) {
                $custom_categoria = 'ENXOVAIS';
            } else {
                $custom_categoria = 'OUTROS';
            }

            // Determine Item Name Display
            // Remove suffixes if category already specifies location to be cleaner
            $nome_exibicao = $item['nome'];
            
            // Add suffix ONLY if it's in 'OUTROS' and controls frigobar to avoid ambiguity
            // Or if it is a beverage but we want to be super explicit? 
            // The user wanted "separation", implying the headers do the work.
            // keeping names clean for Bebidas.
            if ($custom_categoria === 'OUTROS' && $item['controla_frigobar'] == 1) {
                 $nome_exibicao .= ($local === 'recepcao') ? ' (Estoque)' : ' (Frigobar)';
            }

            // Organize by custom category
            if (!isset($dados_por_categoria[$custom_categoria])) {
                $dados_por_categoria[$custom_categoria] = [];
            }
            
            $dados_por_categoria[$custom_categoria][] = [
                'nome' => $nome_exibicao,
                'inicial' => $inicial,
                'entrada' => $entrada,
                'saida' => $saida,
                'final' => $final
            ];
        }
    }
    
    // Generate dynamic table HTML
    $tabela_html = '';
    foreach ($dados_por_categoria as $categoria => $itens_categoria) {
        // Category header
        $tabela_html .= '<tr class="category-header"><th colspan="5">' . strtoupper(htmlspecialchars($categoria)) . '</th></tr>' . "\n";
        
        // Items in this category
        foreach ($itens_categoria as $item_data) {
            $tabela_html .= '<tr>' . "\n";
            $tabela_html .= '    <td>' . htmlspecialchars($item_data['nome']) . '</td>' . "\n";
            $tabela_html .= '    <td align="center">' . $item_data['inicial'] . '</td>' . "\n";
            $tabela_html .= '    <td align="center">' . $item_data['entrada'] . '</td>' . "\n";
            $tabela_html .= '    <td align="center">' . $item_data['saida'] . '</td>' . "\n";
            $tabela_html .= '    <td class="final-count" align="center">' . $item_data['final'] . '</td>' . "\n";
            $tabela_html .= '</tr>' . "\n";
        }
    }
    
    // Load template
    $template = file_get_contents(__DIR__ . '/../view/estoque/estoque_relatorio.php');
    
    // Calculate BASE_URL
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $base_url = $protocol . '://' . $host;
    
    // Replace BASE_URL in template
    $template = str_replace('<?php echo BASE_URL; ?>', $base_url, $template);
    
    // Replace placeholders - Header info
    $template = str_replace('[DATA_DO_SISTEMA]', date('d/m/Y', strtotime($data_filtro)), $template);
    $template = str_replace('[NOME_DO_FUNCIONARIO]', $nome_funcionario, $template);
    $template = str_replace('[HORA_INICIO]', $hora_inicio, $template);
    $template = str_replace('[HORA_FIM]', $hora_fim, $template);
    $template = str_replace('[DURACAO_CALCULADA]', $duracao, $template);
    
    // Build observations from movements
    $observacoes_html = '';
    if (count($movimentos_com_observacao) > 0) {
        foreach ($movimentos_com_observacao as $mov) {
            $tipo_texto = $mov['tipo'] === 'entrada' ? 'ENTRADA' : 'SAÍDA';
            $local_texto = ucfirst($mov['local']);
            $observacoes_html .= "• {$mov['data_formatada']} - {$tipo_texto} de {$mov['quantidade']} {$mov['nome_item']} ({$local_texto}) - {$mov['responsavel']}: " . htmlspecialchars($mov['observacao']) . "<br>\n";
        }
    } else {
        $observacoes_html = 'Nenhuma observação registrada neste turno.';
    }
    
    $template = str_replace('[OBSERVACOES]', $observacoes_html, $template);
    
    // Replace the dynamic table content
    $template = str_replace('[TABELA_ITENS_DINAMICA]', $tabela_html, $template);
    
    echo $template;
}

function limparNome($nome) {
    // Convert to uppercase and remove special characters
    $nome = strtoupper($nome);
    $nome = str_replace(['Á', 'À', 'Ã', 'Â'], 'A', $nome);
    $nome = str_replace(['É', 'È', 'Ê'], 'E', $nome);
    $nome = str_replace(['Í', 'Ì', 'Î'], 'I', $nome);
    $nome = str_replace(['Ó', 'Ò', 'Õ', 'Ô'], 'O', $nome);
    $nome = str_replace(['Ú', 'Ù', 'Û'], 'U', $nome);
    $nome = str_replace(['Ç'], 'C', $nome);
    $nome = preg_replace('/[^A-Z0-9]/', '_', $nome);
    $nome = preg_replace('/_+/', '_', $nome);
    $nome = trim($nome, '_');
    return $nome;
}
