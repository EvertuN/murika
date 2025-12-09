// Classes específicas para Funcionários e Cargos
class FuncionarioCORE extends COREManager {
    createRow(item) {
        // Implementação simplificada usando o método padrão ou customizado
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
    
    // Alias para manter compatibilidade
    criarLinhaTabela(item) {
        return this.createRow(item);
    }
}

class CargoCORE extends COREManager {
    createRow(item) {
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
    
    // Alias para manter compatibilidade
    criarLinhaTabela(item) {
        return this.createRow(item);
    }
}

// Variáveis globais
let funcionarioCORE;
let cargoCORE;

// Funções globais de edição
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
