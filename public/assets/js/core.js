class COREManager {
    constructor(config) {
        this.apiEndpoint = config.apiEndpoint;
        this.formCadastroId = config.formCadastroId;
        this.formEditId = config.formEditId;
        this.mensagemCadastroId = config.mensagemCadastroId || 'mensagem-cadastro';
        this.mensagemListaId = config.mensagemListaId || 'mensagem-lista';
        this.tabelaId = config.tabelaId;
        this.modalEditId = config.modalEditId;
        this.isAdmin = config.isAdmin || false;
        
        // Sistema genérico de relacionamentos
        this.relationships = config.relationships || [];
        
        // Compatibilidade com código legado (selectCategoriaId)
        if (config.selectCategoriaId) {
            this.relationships.push({
                endpoint: '/api/categoria',
                selectId: config.selectCategoriaId,
                selectEditId: config.selectCategoriaEditId,
                valueField: 'id_categoria',
                labelField: 'nome_categoria'
            });
        }

        this.init();
    }

    init() {
        this.setupFormCadastro();
        this.setupFormEdit();
        this.carregarDados();
        this.carregarRelacionamentos();
    }
    
    carregarRelacionamentos() {
        if (!this.relationships || this.relationships.length === 0) return;
        
        this.relationships.forEach(rel => {
            fetchAPI(`${rel.endpoint}?acao=listar`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        this.popularSelects(data.data, rel);
                    }
                })
                .catch(err => console.error(`Erro ao carregar relacionamento ${rel.endpoint}:`, err));
        });
    }
    
    popularSelects(data, rel) {
        const options = data.map(item => 
            `<option value="${item[rel.valueField]}">${item[rel.labelField]}</option>`
        ).join('');
        
        if (rel.selectId) {
            const select = document.getElementById(rel.selectId);
            if (select) select.innerHTML = '<option value="">Selecione...</option>' + options;
            
            // Observer para recarregar quando o elemento for inserido no DOM
            this.setupObserver(rel.selectId, options);
        }
        
        if (rel.selectEditId) {
            const selectEdit = document.getElementById(rel.selectEditId);
            if (selectEdit) selectEdit.innerHTML = '<option value="">Selecione...</option>' + options;
        }
    }
    
    setupObserver(elementId, options) {
        const observer = new MutationObserver(() => {
            const select = document.getElementById(elementId);
            if (select && select.innerHTML.indexOf('option') === -1) {
                select.innerHTML = '<option value="">Selecione...</option>' + options;
                // Observer pode continuar ativo se o elemento for removido e recriado
            }
        });
        
        observer.observe(document.body, {childList: true, subtree: true});
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
                    ${this.isAdmin ? `
                    <button class="btn btn-sm btn-dark" onclick="editarCategoria(${item.id_categoria}, '${item.nome_categoria.replace(/'/g, "&#39;")}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="categoriaCORE.deletar(${item.id_categoria})">
                        <i class="fas fa-trash"></i> Deletar
                    </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }
}

class ItemCORE extends COREManager {
    createMinimoCell(item, valor, local, label) {
        const localValue = local === 'recepcao' ? '0' : '1';
        
        // Se for frigobar e item não controla frigobar, mostrar traço
        if (local === 'frigobar' && item.controla_frigobar != 1) {
            return '<td class="text-center text-muted">-</td>';
        }

        if (this.isAdmin) {
            return `
                <td class="text-center" style="cursor: pointer;" onclick="itemCORE.editarMinimo(this, ${item.id_item}, '${localValue}', ${valor})" title="Clique para editar ${label}">
                    ${valor} <i class="fas fa-pencil-alt text-muted small ms-1" style="font-size: 0.7em;"></i>
                </td>
            `;
        } else {
            return `<td class="text-center">${valor}</td>`;
        }
    }

    criarLinhaTabela(item) {
        return `
            <tr>
                <td>${item.id_item}</td>
                <td>${item.nome}</td>
                <td>${item.nome_categoria || 'Sem categoria'}</td>
                ${this.createMinimoCell(item, item.min_recepcao, 'recepcao', 'Mín Recepção')}
                ${this.createMinimoCell(item, item.min_frigobar, 'frigobar', 'Mín Frigobar')}
                <td class="text-center">${item.controla_frigobar == 1 ? 'Sim' : 'Não'}</td>
                <td>
                    ${this.isAdmin ? `
                    <button class="btn btn-sm btn-dark" onclick="abrirEditarItem(${item.id_item}, '${item.nome.replace(/'/g, "&#39;")}', ${item.id_categoria}, ${item.controla_frigobar})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="itemCORE.deletar(${item.id_item})">
                        <i class="fas fa-trash"></i> Deletar
                    </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }

    editarMinimo(element, idItem, localValue, valorAtual) {
        if (element.querySelector('input')) return;
        const originalContent = element.innerHTML;
        
        element.innerHTML = `
            <div class="input-group input-group-sm" style="width: 80px; margin: 0 auto;">
                <input type="number" class="form-control" value="${valorAtual}" min="0">
                <button class="btn btn-success btn-sm" type="button" onclick="event.stopPropagation(); itemCORE.salvarMinimo(${idItem}, '${localValue}', this.previousElementSibling.value, this.parentNode.parentNode)">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        `;
        const input = element.querySelector('input');
        input.focus();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); this.salvarMinimo(idItem, localValue, input.value, element); }
            else if (e.key === 'Escape') { e.preventDefault(); element.innerHTML = originalContent; }
        });
    }

    salvarMinimo(idItem, localValue, novoValor, elementTd) {
        const minimo = parseInt(novoValor);
        if (isNaN(minimo) || minimo < 0) {
            alert('Valor inválido');
            this.carregarDados(); // Revert
            return;
        }

        const formData = new FormData();
        formData.append('acao', 'atualizar_minimo');
        formData.append('id_item', idItem);
        formData.append('local', localValue);
        formData.append('minimo', minimo);

        // Usando o endpoint de movimentação porque é lá que está a lógica de atualizar_minimo
        fetchAPI('/api/movimentacao', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.carregarDados(); // Reload table
            } else {
                alert(data.message || 'Erro ao atualizar');
                this.carregarDados(); // Revert
            }
        })
        .catch(err => console.error(err));
    }
}

// Variáveis globais para acesso às instâncias
let categoriaCORE;
let itemCORE;
