<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="<?php echo BASE_URL; ?>/styles/relatorio.css">
    <title>Relatorio Diario de Estoque</title>
</head>
<body>
    <button class="print-button" onclick="window.print()">Imprimir Relatorio</button>

    <main class="report-container">
        <header class="report-header">
            <h1>Relatorio Diario de Inventario</h1>
        </header>

        <section class="report-section">
            <h2>1. Dados do Turno</h2>
            <div class="header-info">
                <div class="info-item"><strong>DATA:</strong><span>[DATA_DO_SISTEMA]</span></div>
                <div class="info-item"><strong>RECEPCIONISTA:</strong><span>[NOME_DO_FUNCIONARIO]</span></div>
                <div class="info-item"><strong>INICIO DO TURNO:</strong><span>[HORA_INICIO]</span></div>
                <div class="info-item"><strong>FINAL DO TURNO:</strong><span>[HORA_FIM]</span></div>
                <div class="info-item"><strong>DURACAO:</strong><span>[DURACAO_CALCULADA]</span></div>
            </div>
        </section>

        <section class="report-section">
            <h2>2. Detalhe do Inventario Auditado</h2>
            <div class="table-wrap">
                <table class="report-table">
                    <colgroup>
                        <col class="col-item">
                        <col class="col-numeric">
                        <col class="col-numeric">
                        <col class="col-numeric">
                        <col class="col-numeric">
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th class="text-center">Estoque Inicial</th>
                            <th class="text-center">Entrada</th>
                            <th class="text-center">Saida</th>
                            <th class="text-center">Estoque Final</th>
                        </tr>
                    </thead>
                    <tbody>
                        [TABELA_ITENS_DINAMICA]
                    </tbody>
                </table>
            </div>
        </section>

        <section class="report-section">
            <h2>3. Observacoes do Turno</h2>
            <div class="header-info">
                <div class="info-item observacao-item">
                    <strong>Observacoes:</strong>
                    <span>[OBSERVACOES]</span>
                </div>
            </div>
        </section>
    </main>
</body>
</html>

