<div class="section active" id="estoque_inicio">

    <!-- Cabeçalho -->
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="page-title mb-0">
            Estoque do Dia
        </h2>
        <div class="d-flex gap-2">
            <button class="btn-action btn-action-primary" data-bs-toggle="modal" data-bs-target="#modalGerarRelatorio">
                <i class="fas fa-file-alt"></i> Gerar Relatório
            </button>
            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalNovaMovimentacao">
                <i class="fas fa-plus"></i> Nova Movimentação
            </button>
        </div>
    </div>

    <!-- Cards de Resumo -->
    <!-- <div class="row mb-4">
        <div class="col-md-3 mb-3">
            <div class="card text-center" style="border-left: 4px solid #28a745;">
                <div class="card-body p-3">
                    <i class="fas fa-arrow-down text-success fa-2x mb-2"></i>
                    <h6 class="mb-1">Entradas Hoje</h6>
                    <h3 class="mb-0 text-success" id="entradasHoje">0</h3>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="card text-center" style="border-left: 4px solid #dc3545;">
                <div class="card-body p-3">
                    <i class="fas fa-arrow-up text-danger fa-2x mb-2"></i>
                    <h6 class="mb-1">Saídas Hoje</h6>
                    <h3 class="mb-0 text-danger" id="saidasHoje">0</h3>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="card text-center" style="border-left: 4px solid var(--primary-color);">
                <div class="card-body p-3">
                    <i class="fas fa-boxes fa-2x mb-2" style="color: var(--primary-color);"></i>
                    <h6 class="mb-1">Itens Recepção</h6>
                    <h3 class="mb-0" style="color: var(--primary-color);" id="itensRecepcao">0</h3>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="card text-center" style="border-left: 4px solid #17a2b8;">
                <div class="card-body p-3">
                    <i class="fas fa-snowflake text-info fa-2x mb-2"></i>
                    <h6 class="mb-1">Itens Frigobar</h6>
                    <h3 class="mb-0 text-info" id="itensFrigobar">0</h3>
                </div>
            </div>
        </div>
    </div> -->

    <!-- Estoques Lado a Lado -->
    <div class="row">

        <!-- Estoque Recepção -->
        <div class="col-lg-6 mb-4">
            <div class="card">
                <h4>
                    Estoque
                </h4>
                <div class="mb-3">
                    <input type="text" class="form-control" placeholder="Buscar item..." id="buscaRecepcao">
                </div>
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th class="text-center">Qtd</th>
                                <th class="text-center">Mín</th>
                                <th class="text-center">Status</th>
                                <th class="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="tabelaRecepcao">
                            <tr>
                                <td colspan="5" class="text-center">Carregando...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Estoque Frigobar -->
        <div class="col-lg-6 mb-4">
            <div class="card">
                <h4>
                    Frigobar
                </h4>
                <div class="mb-3">
                    <input type="text" class="form-control" placeholder="Buscar item..." id="buscaFrigobar">
                </div>
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th class="text-center">Qtd</th>
                                <th class="text-center">Mín</th>
                                <th class="text-center">Status</th>
                                <th class="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="tabelaFrigobar">
                            <tr>
                                <td colspan="5" class="text-center">Carregando...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Histórico de Movimentações -->
    <!-- <div class="card">
        <h4>
            <i class="fas fa-history"></i> Últimas Movimentações
        </h4>
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead>
                    <tr>
                        <th>Data/Hora</th>
                        <th>Tipo</th>
                        <th>Item</th>
                        <th>Local</th>
                        <th class="text-center">Qtd</th>
                        <th>Responsável</th>
                    </tr>
                </thead>
                <tbody id="tabelaHistorico">
                    <tr>
                        <td colspan="6" class="text-center">Carregando...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div> -->

</div>

<!-- Modal Nova Movimentação -->
<div class="modal fade" id="modalNovaMovimentacao" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Nova Movimentação</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div id="mensagem-movimentacao"></div>
                <form id="formMovimentacao">
                    <div class="mb-3">
                        <label class="form-label">Tipo de Movimentação *</label>
                        <select name="tipo" class="form-select" required>
                            <option value="">Selecione...</option>
                            <option value="entrada">Entrada (Compra/Reposição)</option>
                            <option value="saida">Saída (Consumo/Uso)</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Local *</label>
                        <select name="local" class="form-select" id="selectLocal" required>
                            <option value="">Selecione...</option>
                            <option value="0">Estoque</option>
                            <option value="1">Frigobar</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Item *</label>
                        <select name="id_item" class="form-select" id="selectItem" required>
                            <option value="">Selecione primeiro o local...</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Quantidade *</label>
                        <input type="number" name="quantidade" class="form-control" min="1" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Observação</label>
                        <textarea name="observacao" class="form-control" rows="2" placeholder="Opcional..."></textarea>
                    </div>

                    <button type="submit" class="btn btn-primary w-100">
                        <i class="fas fa-save"></i> Registrar Movimentação
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Modal Gerar Relatório -->
<div class="modal fade" id="modalGerarRelatorio" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fas fa-file-alt"></i> Gerar Relatório de Turno</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div id="mensagem-relatorio"></div>
                <form id="formRelatorio">
                    <div class="mb-3">
                        <label class="form-label">Data do Relatório *</label>
                        <input type="date" name="data" class="form-control" id="dataRelatorio" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Turno *</label>
                        <select name="turno" class="form-select" required>
                            <option value="">Selecione...</option>
                            <option value="1">Turno 1 (06:00 - 18:00)</option>
                            <option value="2">Turno 2 (18:00 - 06:00)</option>
                        </select>
                    </div>

                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> O relatório será aberto em uma nova janela e poderá ser impresso ou salvo como PDF.
                    </div>

                    <button type="submit" class="btn btn-primary w-100">
                        <i class="fas fa-file-alt"></i> Gerar Relatório
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>