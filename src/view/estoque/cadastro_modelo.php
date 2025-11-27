        <div id="#########" class="section">
            <h2 class="page-title">Cadastro de Item</h2>
            <div class="card">
                <h4><i class="fas fa-plus-circle"></i> Cadastrar Novo Item</h4>
                <form>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Nome do Item</label>
                            <input type="text" class="form-control" placeholder="Ex: Toalha de banho">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Categoria</label>
                            <select class="form-select">
                                <option selected>Selecione...</option>
                                <option>Roupas de cama</option>
                                <option>Toalhas</option>
                                <option>Produtos de limpeza</option>
                                <option>Amenities</option>
                                <option>Alimentos e Bebidas</option>
                            </select>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Código/SKU</label>
                            <input type="text" class="form-control" placeholder="Ex: TLH-001">
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Quantidade Inicial</label>
                            <input type="number" class="form-control" placeholder="0">
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Unidade</label>
                            <select class="form-select">
                                <option>Unidade</option>
                                <option>Pacote</option>
                                <option>Litro</option>
                                <option>Kg</option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Estoque Mínimo</label>
                            <input type="number" class="form-control" placeholder="0">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Fornecedor</label>
                            <input type="text" class="form-control" placeholder="Nome do fornecedor">
                        </div>
                        <div class="col-12 mb-3">
                            <label class="form-label">Observações</label>
                            <textarea class="form-control" rows="3" placeholder="Informações adicionais..."></textarea>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Cadastrar Item
                    </button>
                </form>
            </div>
        </div>