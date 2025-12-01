class COREManager {
    constructor(config) {
        this.apiEndpoint = config.apiEndpoint;
        this.formCadastroId = config.formCadastroId;
        this.formEditId = config.formEditId;
        this.mensagemCadastroId = config.mensagemCadastroId || 'mensagem-cadastro';
        this.mensagemListaId = config.mensagemListaId || 'mensagem-lista';
        this.tabelaId = config.tabelaId;
        this.modalEditId = config.modalEditId;
        this.selectCategoriaId = config.selectCategoriaId;
        this.selectCategoriaEditId = config.selectCategoriaEditId;

        this.init();
    }

    init() {
        this.setupFormCadastro();
        this.setupFormEdit();
        this.carregarDados();

        if (this.selectCategoriaId) {
            this.carregarCategoriasSelect();
        }
    }

    setupFormCadastro() {
        const form = document.getElementById(this.formCadastroId);
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarCadastro(form);
        });
    }

    setupFormEdit() {
        const form = document.getElementById(this.formEditId);
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarEdicao(form);
        });
    }

    salvarCadastro(form) {
        const formData = new FormData(form);
        formData.append('acao', 'cadastrar');

        fetchAPI(this.apiEndpoint, {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                mostrarMensagem(this.mensagemCadastroId, data.message, data.success ? 'success' : 'danger');
                if (data.success) {
                    form.reset();
                    this.carregarDados();
                }
            })
            .catch(error => {
                mostrarMensagem(this.mensagemCadastroId, 'Erro ao processar requisição', 'danger');
            });
    }

    salvarEdicao(form) {
        const formData = new FormData(form);
        formData.append('acao', 'editar');

        fetchAPI(this.apiEndpoint, {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                mostrarMensagem(this.mensagemListaId, data.message, data.success ? 'success' : 'danger');
                if (data.success) {
                    this.carregarDados();
                    if (this.modalEditId) {
                        bootstrap.Modal.getInstance(document.getElementById(this.modalEditId)).hide();
                    }
                }
            })
            .catch(error => {
                mostrarMensagem(this.mensagemListaId, 'Erro ao processar requisição', 'danger');
            });
    }

    carregarDados() {
        fetchAPI(`${this.apiEndpoint}?acao=listar`)
            .then(response => response.json())
            .then(data => {
                this.renderizarTabela(data);
            })
            .catch(error => {
                console.error('Erro ao carregar dados:', error);
                const tbody = document.getElementById(this.tabelaId);
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="99" class="text-center text-danger">Erro ao carregar dados</td></tr>';
                }
            });
    }

    renderizarTabela(data) {
        const tbody = document.getElementById(this.tabelaId);
        if (!tbody) return;

        if (data.success && data.data.length > 0) {
            tbody.innerHTML = data.data.map(item => this.criarLinhaTabela(item)).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="99" class="text-center">Nenhum registro encontrado</td></tr>';
        }
    }

    criarLinhaTabela(item) {
        // Método a ser sobrescrito nas classes filhas
        return '';
    }

    carregarCategoriasSelect() {
        fetchAPI('/api/categoria?acao=listar')
            .then(response => response.json())
            .then(data => {
                const options = (data.success ? data.data : []).map(cat =>
                    `<option value="${cat.id_categoria}">${cat.nome_categoria}</option>`
                ).join('');

                if (this.selectCategoriaId) {
                    const select = document.getElementById(this.selectCategoriaId);
                    if (select) select.innerHTML = '<option value="">Selecione...</option>' + options;
                }

                if (this.selectCategoriaEditId) {
                    const selectEdit = document.getElementById(this.selectCategoriaEditId);
                    if (selectEdit) selectEdit.innerHTML = '<option value="">Selecione...</option>' + options;
                }
            })
            .catch(err => console.error('Erro ao carregar categorias:', err));
    }

    deletar(id, confirmMessage = 'Deseja realmente deletar este registro?') {
        if (!confirm(confirmMessage)) return;

        const formData = new FormData();
        formData.append('acao', 'deletar');
        formData.append('id', id);

        fetchAPI(this.apiEndpoint, {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                mostrarMensagem(this.mensagemListaId, data.message, data.success ? 'success' : 'danger');
                if (data.success) {
                    this.carregarDados();
                }
            })
            .catch(error => {
                mostrarMensagem(this.mensagemListaId, 'Erro ao processar requisição', 'danger');
            });
    }
}

// Classes específicas para cada entidade
class CategoriaCORE extends COREManager {
    criarLinhaTabela(item) {
        return `
            <tr>
                <td>${item.id_categoria}</td>
                <td>${item.nome_categoria}</td>
                <td>
                    <button class="btn btn-sm btn-dark" onclick="editarCategoria(${item.id_categoria}, '${item.nome_categoria.replace(/'/g, "&#39;")}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="categoriaCORE.deletar(${item.id_categoria})">
                        <i class="fas fa-trash"></i> Deletar
                    </button>
                </td>
            </tr>
        `;
    }
}

class ItemCORE extends COREManager {
    criarLinhaTabela(item) {
        return `
            <tr>
                <td>${item.id_item}</td>
                <td>${item.nome}</td>
                <td>${item.nome_categoria || 'Sem categoria'}</td>
                <td class="text-center">${item.controla_frigobar == 1 ? 'Sim' : 'Não'}</td>
                <td>
                    <button class="btn btn-sm btn-dark" onclick="abrirEditarItem(${item.id_item}, '${item.nome.replace(/'/g, "&#39;")}', ${item.id_categoria}, ${item.controla_frigobar})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="itemCORE.deletar(${item.id_item})">
                        <i class="fas fa-trash"></i> Deletar
                    </button>
                </td>
            </tr>
        `;
    }
}

// Variáveis globais para acesso às instâncias
let categoriaCORE;
let itemCORE;
