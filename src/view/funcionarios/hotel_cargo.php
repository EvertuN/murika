<!-- Formulário de Cadastro de Cargo -->
<div id="cadastrar_cargo" class="section">
    <div class="card">
        <h4>Cadastrar Novo Cargo</h4>

        <div id="mensagem-cargo"></div>

        <form id="formCadastroCargo">
            <div class="row">
                <div class="col-md-12 mb-3">
                    <label class="form-label">Nome do Cargo *</label>
                    <input type="text" name="cargo" class="form-control" placeholder="Ex: Recepcionista" required>
                </div>
            </div>

            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Cadastrar Cargo
            </button>
            <button type="button" class="btn btn-secondary" data-section="listar_cargos">
                <i class="fas fa-list"></i> Ver Todos Cargos
            </button>
        </form>
    </div>
</div>

<!-- Lista de Cargos -->
<div id="listar_cargos" class="section">
    <div class="card">
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>Cargos Cadastrados</h4>
                <button class="btn btn-primary" data-section="cadastrar_cargo">
                    <i class="fas fa-plus"></i> Adicionar Cargo
                </button>
            </div>

            <div id="mensagem-lista-cargo"></div>

            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cargo</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="tabelaCargos">
                        <tr>
                            <td colspan="3" class="text-center">Carregando...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Modal Editar Cargo -->
<div class="modal fade" id="modalEditarCargo" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Editar Cargo</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="formEditarCargo">
                    <input type="hidden" name="id" id="editCargoId">

                    <div class="mb-3">
                        <label class="form-label">Nome do Cargo *</label>
                        <input type="text" name="cargo" id="editNomeCargo" class="form-control" required>
                    </div>

                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Salvar Alterações
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>
