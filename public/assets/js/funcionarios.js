// Classes específicas para Funcionários e Cargos
class FuncionarioCORE extends COREManager {
    constructor(config) {
        // IMPORTANTE: Salvar as propriedades ANTES de chamar super()
        // porque super() chama init() que precisa dessas propriedades
        const selectCargoId = config.selectCargoId;
        const selectCargoEditId = config.selectCargoEditId;
        
        super(config);
        
        // Agora sim atribuir às propriedades da instância
        this.selectCargoId = selectCargoId;
        this.selectCargoEditId = selectCargoEditId;        
        // Carregar cargos após construção completa
        if (this.selectCargoId) {
            setTimeout(() => this.carregarCargosSelect(), 200);
        }
    }

    init() {
        super.init();
        
        // Carregar cargos após super.init() e garantir que DOM está pronto
        if (this.selectCargoId) {
            // Tentar carregar imediatamente
            setTimeout(() => {
                this.carregarCargosSelect();
            }, 100);
            
            // Também recarregar quando a seção de cadastro for exibida
            const observer = new MutationObserver(() => {
                const select = document.getElementById(this.selectCargoId);
                if (select && select.offsetParent !== null) {
                    this.carregarCargosSelect();
                    observer.disconnect();
                }
            });
            
            observer.observe(document.body, {
                attributes: true,
                subtree: true,
                attributeFilter: ['class']
            });
        } else {
        }
    }

    carregarCargosSelect() {
        fetchAPI('/api/cargo?acao=listar')
            .then(response => response.json())
            .then(data => {
                
                if (!data.success) {
                    console.error('Erro ao carregar cargos:', data.message);
                    return;
                }
                
                const options = (data.data || []).map(cargo =>
                    `<option value="${cargo.id_cargo}">${cargo.cargo}</option>`
                ).join('');

                if (this.selectCargoId) {
                    const select = document.getElementById(this.selectCargoId);
                    if (select) {
                        select.innerHTML = '<option value="">Selecione...</option>' + options;
                    } else {
                        console.error('Select cargo cadastro não encontrado:', this.selectCargoId);
                    }
                }

                if (this.selectCargoEditId) {
                    const selectEdit = document.getElementById(this.selectCargoEditId);
                    if (selectEdit) {
                        selectEdit.innerHTML = '<option value="">Selecione...</option>' + options;
                    } else {
                        console.error('Select cargo edição não encontrado:', this.selectCargoEditId);
                    }
                }
            })
            .catch(err => {
                console.error('Erro ao carregar cargos:', err);
            });
    }

    criarLinhaTabela(item) {
        return `
            <tr>
                <td>${item.id_funcionario}</td>
                <td>${item.nome}</td>
                <td>${item.cargo || 'Sem cargo'}</td>
                <td>
                    ${this.isAdmin ? `
                    <button class="btn btn-sm btn-dark" onclick="abrirEditarFuncionario(${item.id_funcionario}, '${item.nome.replace(/'/g, "&#39;")}', ${item.id_cargo})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="funcionarioCORE.deletar(${item.id_funcionario})">
                        <i class="fas fa-trash"></i> Deletar
                    </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }
}

class CargoCORE extends COREManager {
    criarLinhaTabela(item) {
        return `
            <tr>
                <td>${item.id_cargo}</td>
                <td>${item.cargo}</td>
                <td>
                    ${this.isAdmin ? `
                    <button class="btn btn-sm btn-dark" onclick="editarCargo(${item.id_cargo}, '${item.cargo.replace(/'/g, "&#39;")}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="cargoCORE.deletar(${item.id_cargo})">
                        <i class="fas fa-trash"></i> Deletar
                    </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }
}

// Variáveis globais para acesso às instâncias
let funcionarioCORE;
let cargoCORE;

// Funções globais de edição (chamadas pelos botões na tabela)
function abrirEditarFuncionario(id, nome, idCargo) {
    document.getElementById('editFuncionarioId').value = id;
    document.getElementById('editNomeFuncionario').value = nome;
    document.getElementById('editSelectCargo').value = idCargo;

    const modal = new bootstrap.Modal(document.getElementById('modalEditarFuncionario'));
    modal.show();
}

function editarCargo(id, nome) {
    document.getElementById('editCargoId').value = id;
    document.getElementById('editNomeCargo').value = nome;

    const modal = new bootstrap.Modal(document.getElementById('modalEditarCargo'));
    modal.show();
}
