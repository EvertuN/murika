// Gerenciador de Estoque
class EstoqueManager {
    constructor() {
        this.apiEndpoint = '/api/movimentacao.php';
        this.init();
    }

    init() {
        this.carregarResumo();
        this.carregarEstoqueRecepcao();
        this.carregarEstoqueFrigobar();
        this.carregarHistorico();
        this.setupFormMovimentacao();
        this.setupBusca();
        this.setupTabs();
    }

    setupFormMovimentacao() {
        const form = document.getElementById('formMovimentacao');
        if (!form) return;

        const selectLocal = document.getElementById('selectLocal');
        const selectItem = document.getElementById('selectItem');

        // Quando o local mudar, carregar itens
        if (selectLocal) {
            selectLocal.addEventListener('change', (e) => {
                this.carregarItensPorLocal(e.target.value);
            });
        }

        // Submissão do formulário
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.registrarMovimentacao(form);
        });
    }

    setupBusca() {
        const buscaRecepcao = document.getElementById('buscaRecepcao');
        const buscaFrigobar = document.getElementById('buscaFrigobar');

        if (buscaRecepcao) {
            buscaRecepcao.addEventListener('input', (e) => {
                this.filtrarTabela('tabelaRecepcao', e.target.value);
            });
        }

        if (buscaFrigobar) {
            buscaFrigobar.addEventListener('input', (e) => {
                this.filtrarTabela('tabelaFrigobar', e.target.value);
            });
        }
    }

    setupTabs() {
        const recepcaoTab = document.getElementById('recepcao-tab');
        const frigobarTab = document.getElementById('frigobar-tab');

        if (recepcaoTab) {
            recepcaoTab.addEventListener('shown.bs.tab', () => {
                this.carregarEstoqueRecepcao();
            });
        }

        if (frigobarTab) {
            frigobarTab.addEventListener('shown.bs.tab', () => {
                this.carregarEstoqueFrigobar();
            });
        }
    }

    filtrarTabela(tabelaId, termo) {
        const tabela = document.getElementById(tabelaId);
        if (!tabela) return;

        const linhas = tabela.querySelectorAll('tr');
        const termoLower = termo.toLowerCase();

        linhas.forEach(linha => {
            const texto = linha.textContent.toLowerCase();
            linha.style.display = texto.includes(termoLower) ? '' : 'none';
        });
    }

    carregarResumo() {
        fetch(`${this.apiEndpoint}?acao=resumo`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('entradasHoje').textContent = data.data.entradas_hoje;
                    document.getElementById('saidasHoje').textContent = data.data.saidas_hoje;
                    document.getElementById('itensRecepcao').textContent = data.data.itens_recepcao;
                    document.getElementById('itensFrigobar').textContent = data.data.itens_frigobar;
                }
            })
            .catch(error => {
                console.error('Erro ao carregar resumo:', error);
            });
    }

    carregarEstoqueRecepcao() {
        fetch(`${this.apiEndpoint}?acao=listar_estoque&local=recepcao`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.renderizarTabelaEstoque('tabelaRecepcao', data.data);
                }
            })
            .catch(error => {
                console.error('Erro ao carregar estoque recepção:', error);
            });
    }

    carregarEstoqueFrigobar() {
        fetch(`${this.apiEndpoint}?acao=listar_estoque&local=frigobar`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.renderizarTabelaEstoque('tabelaFrigobar', data.data);
                }
            })
            .catch(error => {
                console.error('Erro ao carregar estoque frigobar:', error);
            });
    }

    renderizarTabelaEstoque(tabelaId, itens) {
        const tbody = document.getElementById(tabelaId);
        if (!tbody) return;

        if (itens.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum item encontrado</td></tr>';
            return;
        }

        // Determinar o local baseado na tabela
        const local = tabelaId === 'tabelaRecepcao' ? 'recepcao' : 'frigobar';
        const localValue = local === 'recepcao' ? '0' : '1';

        tbody.innerHTML = itens.map(item => {
            const statusClass = item.status === 'OK' ? 'bg-success' : 'bg-warning';
            const statusText = item.status === 'OK' ? 'OK' : 'Baixo';
            
            return `
                <tr class="item-row">
                    <td>${this.escapeHtml(item.nome)}</td>
                    <td class="text-center"><span class="badge bg-primary">${item.quantidade_atual}</span></td>
                    <td class="text-center">${item.quantidade_minima}</td>
                    <td class="text-center"><span class="badge ${statusClass}">${statusText}</span></td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-success" title="Entrada" onclick="estoqueManager.abrirModalMovimentacao(${item.id_item}, 'entrada', '${localValue}')">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="btn btn-danger" title="Saída" onclick="estoqueManager.abrirModalMovimentacao(${item.id_item}, 'saida', '${localValue}')">
                                <i class="fas fa-minus"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    carregarHistorico() {
        fetch(`${this.apiEndpoint}?acao=listar_historico&limite=50`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.renderizarHistorico(data.data);
                }
            })
            .catch(error => {
                console.error('Erro ao carregar histórico:', error);
            });
    }

    renderizarHistorico(movimentacoes) {
        const tbody = document.getElementById('tabelaHistorico');
        if (!tbody) return;

        if (movimentacoes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma movimentação encontrada</td></tr>';
            return;
        }

        tbody.innerHTML = movimentacoes.map(mov => {
            const tipoClass = mov.tipo === 'entrada' ? 'badge-entrada' : 'badge-saida';
            const tipoText = mov.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA';
            const sinal = mov.tipo === 'entrada' ? '+' : '-';
            const localNome = mov.local || 'Recepção';

            return `
                <tr>
                    <td>${mov.data_formatada}</td>
                    <td><span class="badge ${tipoClass} tipo-badge">${tipoText}</span></td>
                    <td>${this.escapeHtml(mov.nome_item)}</td>
                    <td>${this.escapeHtml(localNome)}</td>
                    <td class="text-center">${sinal}${mov.quantidade}</td>
                    <td>${this.escapeHtml(mov.responsavel || 'Sistema')}</td>
                </tr>
            `;
        }).join('');
    }

    carregarItensPorLocal(local) {
        const selectItem = document.getElementById('selectItem');
        if (!selectItem) return;

        if (!local || local === '') {
            selectItem.innerHTML = '<option value="">Selecione primeiro o local...</option>';
            return;
        }

        fetch(`${this.apiEndpoint}?acao=listar_itens_por_local&local=${local}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data.length > 0) {
                    const options = data.data.map(item => 
                        `<option value="${item.id_item}">${this.escapeHtml(item.nome)}</option>`
                    ).join('');
                    selectItem.innerHTML = '<option value="">Selecione o item...</option>' + options;
                } else {
                    selectItem.innerHTML = '<option value="">Nenhum item encontrado para este local</option>';
                }
            })
            .catch(error => {
                console.error('Erro ao carregar itens:', error);
                selectItem.innerHTML = '<option value="">Erro ao carregar itens</option>';
            });
    }

    abrirModalMovimentacao(idItem, tipo, localValue) {
        const modal = new bootstrap.Modal(document.getElementById('modalNovaMovimentacao'));
        const form = document.getElementById('formMovimentacao');
        
        if (form) {
            form.reset();
            document.querySelector('select[name="tipo"]').value = tipo;
            document.getElementById('selectLocal').value = localValue;
            this.carregarItensPorLocal(localValue);
            
            // Aguardar um pouco para o select carregar os itens
            setTimeout(() => {
                document.getElementById('selectItem').value = idItem;
            }, 300);
        }
        
        modal.show();
    }

    registrarMovimentacao(form) {
        const formData = new FormData(form);
        formData.append('acao', 'registrar');
        formData.append('responsavel', 'Usuário'); // TODO: Pegar do sistema de autenticação

        fetch(this.apiEndpoint, {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Fechar modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('modalNovaMovimentacao'));
                    modal.hide();
                    
                    // Recarregar dados
                    this.carregarResumo();
                    this.carregarEstoqueRecepcao();
                    this.carregarEstoqueFrigobar();
                    this.carregarHistorico();
                    
                    // Mostrar mensagem de sucesso
                    this.mostrarMensagem(data.message, 'success');
                } else {
                    this.mostrarMensagem(data.message, 'danger');
                }
            })
            .catch(error => {
                console.error('Erro ao registrar movimentação:', error);
                this.mostrarMensagem('Erro ao processar requisição', 'danger');
            });
    }

    mostrarMensagem(mensagem, tipo) {
        // Criar ou atualizar elemento de mensagem
        let alertDiv = document.getElementById('alert-mensagem');
        if (!alertDiv) {
            alertDiv = document.createElement('div');
            alertDiv.id = 'alert-mensagem';
            alertDiv.className = 'alert alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
            alertDiv.style.zIndex = '9999';
            document.body.appendChild(alertDiv);
        }

        alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        alertDiv.innerHTML = `
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (alertDiv && alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar quando o DOM estiver pronto
let estoqueManager;
document.addEventListener('DOMContentLoaded', function() {
    estoqueManager = new EstoqueManager();
});

