<!-- ALTERAR SENHA -->
<div id="alterar_senha" class="section">
    <div class="card">
        <h4>Alterar Senha</h4>
        
        <div id="mensagem-senha"></div>
        
        <form id="formAlterarSenha">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Senha Atual *</label>
                    <input type="password" class="form-control" name="senha_atual" 
                           placeholder="Digite sua senha atual" required>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Nova Senha *</label>
                    <input type="password" class="form-control" name="nova_senha" 
                           placeholder="Digite a nova senha" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Confirmar Nova Senha *</label>
                    <input type="password" class="form-control" name="confirmar_senha" 
                           placeholder="Confirme a nova senha" required>
                </div>
            </div>
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-key"></i> Alterar Senha
            </button>
        </form>
    </div>
</div>

