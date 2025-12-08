<div id="historico" class="section">
    <div class="card">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4>Histórico de Movimentações</h4>
            <div class="d-flex gap-2">
                <input type="date" id="dataHistorico" class="form-control" style="width: 160px;">
                <select id="turnoHistorico" class="form-select" style="width: 180px;">
                    <option value="">Todos os Turnos</option>
                    <option value="1">06:00 - 18:00</option>
                    <option value="2">18:00 - 06:00</option>
                </select>
            </div>
        </div>
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
    </table>
</div>
<div class="d-flex justify-content-between align-items-center mt-3" id="paginacaoContainer" style="display: none !important;">
    <button class="btn btn-outline-primary btn-sm" id="btnPaginaAnterior" disabled>
        <i class="fas fa-chevron-left"></i> Anterior
    </button>
    <span id="infoPaginacao" class="text-muted">Página 1</span>
    <button class="btn btn-outline-primary btn-sm" id="btnPaginaProximo" disabled>
        Próximo <i class="fas fa-chevron-right"></i>
    </button>
</div>
    </div>
</div>