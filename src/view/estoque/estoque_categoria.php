<!-- CADASTRAR CATEGORIA -->
<div id="cadastrar_categoria_item" class="section">
    <!-- <h2 class="page-title">Nova Categoria de Item</h2> -->
    <div class="card">
        <h4>Cadastrar Nova Categoria</h4>
        
        <div id="mensagem-categoria"></div>
        
        <form id="formCadastroCategoria">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Nome da Categoria</label>
                    <input type="text" class="form-control" name="nome_categoria" 
                           placeholder="Ex: Bebidas" required>
                </div>
            </div>
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Cadastrar Categoria
            </button>      
            <button type="button" class="btn btn-secondary" data-section="lista_categoria_item">
                <i class="fas fa-list"></i> Ver Todas Categorias
            </button>
        </form>
    </div>
</div>


<!-- Modal Editar Categoria -->
<div class="modal fade" id="modalEditarCategoria" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Editar Categoria</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="formEditarCategoria">
                    <input type="hidden" name="id" id="editCategoriaId">

                    <div class="mb-3">
                        <label class="form-label">Nome da Categoria *</label>
                        <input type="text" name="nome_categoria" id="editNomeCategoria" class="form-control" required>
                    </div>

                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Salvar Alterações
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- LISTA DE CATEGORIAS -->
<div id="lista_categoria_item" class="section">
    <!-- <h2 class="page-title">Categorias Cadastradas</h2> -->
    <div class="card">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h4>Categorias</h4>
            <button class="btn btn-primary" data-section="cadastrar_categoria_item">
                <i class="fas fa-plus"></i> Nova Categoria
            </button>
        </div>
        
        <div id="mensagem-lista"></div>
        
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome da Categoria</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="tabelaCategorias">
                    <tr>
                        <td colspan="3" class="text-center">
                            <i class="fas fa-spinner fa-spin"></i> Carregando...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>