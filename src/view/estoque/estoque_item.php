<!-- Formulário de Cadastro de Item -->
<div id="cadastrar_item" class="section">
    <div class="card">
        <h4>Cadastrar Novo Item</h4>

        <div id="mensagem-item"></div>

        <form id="formCadastroItem">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Nome do Item *</label>
                    <input type="text" name="nome" class="form-control" placeholder="Ex: Toalha de banho" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Categoria *</label>
                    <select name="id_categoria" id="selectCategoria" class="form-select" required>
                        <option value="">Selecione...</option>
                    </select>
                </div>
            </div>

            <div class="row">
                <div class="col-md-12 mb-3">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="controla_frigobar" value="1" id="frigobarCheck">
                        <label class="form-check-label" for="frigobarCheck">
                            Este item é de frigobar
                        </label>
                    </div>
                </div>
            </div>

            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Cadastrar Item
            </button>
            <button type="button" class="btn btn-secondary" data-section="lista_item">
                <i class="fas fa-list"></i> Ver Todas Itens
            </button>
        </form>
    </div>
</div>

<!-- Lista de Itens -->
<div id="lista_item" class="section">
    <div class="card">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>Itens</h4>
                <button class="btn btn-primary" data-section="cadastrar_item">
                    <i class="fas fa-plus"></i> Adicionar Item
                </button>
            </div>

            <div id="mensagem-lista-item"></div>

            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Categoria</th>
                            <th class="text-center">Mín Rec.</th>
                            <th class="text-center">Mín Frig.</th>
                            <th class="text-center">Frigobar</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="tabelaItens">
                        <tr>
                            <td colspan="5" class="text-center">Carregando...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
    </div>
</div>

<!-- Modal Editar Item -->
<div class="modal fade" id="modalEditarItem" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Editar Item</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="formEditarItem">
                    <input type="hidden" name="id" id="editItemId">

                    <div class="mb-3">
                        <label class="form-label">Nome do Item *</label>
                        <input type="text" name="nome" id="editNomeItem" class="form-control" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Categoria *</label>
                        <select name="id_categoria" id="editSelectCategoria" class="form-select" required>
                            <option value="">Selecione...</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" name="controla_frigobar" value="1" id="editFrigobarCheck">
                            <label class="form-check-label" for="editFrigobarCheck">
                                Este item é de frigobar
                            </label>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Salvar Alterações
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>