<!-- Formulário de Cadastro de Funcionário -->
<div id="cadastrar_funcionario" class="section">
    <div class="card">
        <h4>Cadastrar Novo Funcionário</h4>

        <div id="mensagem-funcionario"></div>

        <form id="formCadastroFuncionario">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Nome do Funcionário *</label>
                    <input type="text" name="nome" class="form-control" placeholder="Ex: João Silva" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Cargo *</label>
                    <select name="id_cargo" id="selectCargo" class="form-select" required>
                        <option value="">Selecione...</option>
                    </select>
                </div>
            </div>

            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Cadastrar Funcionário
            </button>
            <button type="button" class="btn btn-secondary" data-section="listar_funcionarios">
                <i class="fas fa-list"></i> Ver Todos Funcionários
            </button>
        </form>
    </div>
</div>

<!-- Lista de Funcionários -->
<div id="listar_funcionarios" class="section">
    <div class="card">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>Funcionários Cadastrados</h4>
                <button class="btn btn-primary" data-section="cadastrar_funcionario">
                    <i class="fas fa-plus"></i> Adicionar Funcionário
                </button>
            </div>

            <div id="mensagem-lista-funcionario"></div>

            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Cargo</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="tabelaFuncionarios">
                        <tr>
                            <td colspan="4" class="text-center">Carregando...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
    </div>
</div>

<!-- Modal Editar Funcionário -->
<div class="modal fade" id="modalEditarFuncionario" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Editar Funcionário</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="formEditarFuncionario">
                    <input type="hidden" name="id" id="editFuncionarioId">

                    <div class="mb-3">
                        <label class="form-label">Nome do Funcionário *</label>
                        <input type="text" name="nome" id="editNomeFuncionario" class="form-control" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Cargo *</label>
                        <select name="id_cargo" id="editSelectCargo" class="form-select" required>
                            <option value="">Selecione...</option>
                        </select>
                    </div>

                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Salvar Alterações
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>