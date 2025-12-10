<!-- CADASTRAR USUÁRIO -->
<div id="cadastrar_usuario" class="section">
    <div class="card">
        <h4>Cadastrar Novo Usuário</h4>
        
        <div id="mensagem-usuario"></div>
        
        <form id="formCadastroUsuario">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Nome *</label>
                    <input type="text" class="form-control" name="nome" 
                           placeholder="Ex: João Silva" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Usuário *</label>
                    <input type="text" class="form-control" name="usuario" 
                           placeholder="Ex: joao.silva" required>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Senha *</label>
                    <input type="password" class="form-control" name="senha" 
                           placeholder="Senha do usuário" required>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Tipo *</label>
                    <select name="tipo" class="form-select" required>
                        <option value="usuario">Usuário</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Cargo (Gera Funcionário)</label>
                    <select name="id_cargo" class="form-select" id="selectCargoCadastro">
                        <option value="">Nenhum (Apenas Sistema)</option>
                    </select>
                    <small class="text-muted">Cria automaticamente vinculação com RH</small>
                </div>
            </div>
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Cadastrar Usuário
            </button>      
            <button type="button" class="btn btn-secondary" data-section="lista_usuario">
                <i class="fas fa-list"></i> Ver Todos Usuários
            </button>
        </form>
    </div>
</div>

<!-- Modal Editar Usuário -->
<div class="modal fade" id="modalEditarUsuario" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Editar Usuário</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="formEditarUsuario">
                    <input type="hidden" name="id" id="editUsuarioId">

                    <div class="mb-3">
                        <label class="form-label">Nome *</label>
                        <input type="text" name="nome" id="editNomeUsuario" class="form-control" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Usuário *</label>
                        <input type="text" name="usuario" id="editUsuarioUsuario" class="form-control" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Cargo (Atualiza Funcionário)</label>
                        <select name="id_cargo" id="editCargoUsuario" class="form-select">
                            <option value="">Nenhum</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Tipo *</label>
                        <select name="tipo" id="editTipoUsuario" class="form-select" required>
                            <option value="usuario">Usuário</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" name="ativo" value="1" id="editAtivoUsuario">
                            <label class="form-check-label" for="editAtivoUsuario">
                                Usuário Ativo
                            </label>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Nova Senha (opcional)</label>
                        <input type="password" name="senha" id="editSenhaUsuario" class="form-control" 
                               placeholder="Deixe em branco para não alterar">
                    </div>

                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Salvar Alterações
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- LISTA DE USUÁRIOS -->
<div id="lista_usuario" class="section">
    <div class="card">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h4>Lista de Usuários</h4>
            <button class="btn btn-primary" data-section="cadastrar_usuario">
                <i class="fas fa-plus"></i> Novo Usuário
            </button>
        </div>
        
        <div id="mensagem-lista-usuario"></div>
        
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Usuário</th>
                        <th>Tipo</th>
                        <th class="text-center">Ativo</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="tabelaUsuarios">
                    <tr>
                        <td colspan="5" class="text-center">
                            <i class="fas fa-spinner fa-spin"></i> Carregando...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

