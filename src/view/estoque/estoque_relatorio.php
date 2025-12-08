<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="<?php echo BASE_URL; ?>/assets/css/relatorio.css">
    <title>Relatório Diário de Estoque - Hotel</title>
</head>
<body>
    <div class="report-container">

        <h1>Relatório Diário de Inventário</h1>

        <h2>1. Dados do Turno</h2>
        <div class="header-info">
            <div><strong>DATA:</strong><span>[DATA_DO_SISTEMA]</span></div>
            <div><strong>RECEPCIONISTA:</strong><span>[NOME_DO_FUNCIONARIO]</span></div>
            <div><strong>INÍCIO DO TURNO:</strong><span>[HORA_INICIO]</span></div>
            <div><strong>FINAL DO TURNO:</strong><span>[HORA_FIM]</span></div>
            <div><strong>DURAÇÃO:</strong><span>[DURACAO_CALCULADA]</span></div>
        </div>

        <h2>2. Detalhe do Inventário Auditado</h2>
        <table>
            <thead>
                <tr>
                    <th style="width: 120px; text-align: center;">ITEM</th>
                    <th style="width: 120px; text-align: center;">ESTOQUE INICIAL</th>
                    <th style="width: 100px; text-align: center;">ENTRADA</th>
                    <th style="width: 100px; text-align: center;">SAÍDA</th>
                    <th style="width: 120px; text-align: center;">ESTOQUE FINAL</th>
                </tr>
            </thead>
            <tbody>
                [TABELA_ITENS_DINAMICA]
                </tbody>
        </table>

        <h2>3. Observações do Turno</h2>
        <div class="header-info">
            <div><strong>Observações:</strong><span>[OBSERVACOES]</span></div>
        </div>

    </div>
</body>
</html>