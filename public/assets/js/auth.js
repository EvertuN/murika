// Classe para gerenciar usuários
class UsuarioCORE extends COREManager {
    criarLinhaTabela(item) {
        const ativoBadge = item.ativo == 1 
            ? '<span class="badge bg-success">Sim</span>' 
            : '<span class="badge bg-danger">Não</span>';
        
        const tipoBadge = item.tipo === 'admin'
            ? '<span class="badge bg-primary">Admin</span>'
            : '<span class="badge bg-secondary">Usuário</span>';

        return `
            <tr>
                <td>${item.nome}</td>
                <td>${item.usuario}</td>
                <td>${tipoBadge}</td>
                <td class="text-center">${ativoBadge}</td>
                <td>
                    <button class="btn btn-sm btn-dark" onclick="abrirEditarUsuario('${item.id}', '${item.nome.replace(/'/g, "&#39;")}', '${item.usuario.replace(/'/g, "&#39;")}', '${item.tipo}', ${item.ativo})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="usuarioCORE.deletar('${item.id}', 'Deseja realmente deletar o usuário ${item.nome.replace(/'/g, "&#39;")}?')">
                        <i class="fas fa-trash"></i> Deletar
                    </button>
                </td>
            </tr>
        `;
    }
}

// Função para abrir modal de edição de usuário
function abrirEditarUsuario(id, nome, usuario, tipo, ativo) {
    document.getElementById('editUsuarioId').value = id;
    document.getElementById('editNomeUsuario').value = nome;
    document.getElementById('editUsuarioUsuario').value = usuario;
    document.getElementById('editTipoUsuario').value = tipo;
    document.getElementById('editAtivoUsuario').checked = (ativo == 1);
    document.getElementById('editSenhaUsuario').value = '';

    const modal = new bootstrap.Modal(document.getElementById('modalEditarUsuario'));
    modal.show();
}

// Gerenciar alteração de senha
function setupAlterarSenha() {
    const form = document.getElementById('formAlterarSenha');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        formData.append('acao', 'alterar_senha');

        fetchAPI('/api/usuario', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                mostrarMensagem('mensagem-senha', data.message, data.success ? 'success' : 'danger');
                if (data.success) {
                    form.reset();
                }
            })
            .catch(error => {
                mostrarMensagem('mensagem-senha', 'Erro ao processar requisição', 'danger');
            });
    });
}

// Carregar logs do admin
function carregarLogsAdmin(page = 1) {
    fetchAPI(`/api/logs?acao=listar_admin&page=${page}`)
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('tabelaLogsAdmin');
            if (!tbody) return;

            if (data.success && data.data.length > 0) {
                tbody.innerHTML = data.data.map(log => {
                    const dataFormatada = new Date(log.created_at).toLocaleString('pt-BR');
                    const acaoBadge = `<span class="badge bg-info">${log.action}</span>`;
                    const usuarioNome = log.user_name || 'Sistema/Visitante';
                    const detalhes = log.details ? JSON.parse(log.details) : {};
                    const detalhesTexto = Object.keys(detalhes).length > 0 
                        ? JSON.stringify(detalhes, null, 2) 
                        : '-';

                    return `
                        <tr>
                            <td>${dataFormatada}</td>
                            <td>${usuarioNome}</td>
                            <td>${acaoBadge}</td>
                            <td>${log.ip}</td>
                            <td><small class="text-muted">${detalhesTexto}</small></td>
                        </tr>
                    `;
                }).join('');

                // Paginação
                const paginacao = document.getElementById('paginacaoLogs');
                if (paginacao && data.pagination) {
                    let pagHTML = '';
                    for (let i = 1; i <= data.pagination.total_pages; i++) {
                        const active = i === data.pagination.current_page ? 'active' : '';
                        pagHTML += `
                            <li class="page-item ${active}">
                                <a class="page-link" href="#" onclick="carregarLogsAdmin(${i}); return false;">${i}</a>
                            </li>
                        `;
                    }
                    paginacao.innerHTML = pagHTML;
                }
            } else {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum log encontrado</td></tr>';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar logs:', error);
            const tbody = document.getElementById('tabelaLogsAdmin');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar logs</td></tr>';
            }
        });
}

// Carregar logs do usuário
function carregarLogsUsuario() {
    fetchAPI('/api/logs?acao=listar_usuario')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('tabelaLogsUsuario');
            if (!tbody) return;

            if (data.success && data.data.length > 0) {
                tbody.innerHTML = data.data.map(log => {
                    const dataFormatada = new Date(log.created_at).toLocaleString('pt-BR');
                    let acaoBadge = '';
                    if (log.action === 'LOGIN_SUCCESS') {
                        acaoBadge = '<span class="badge bg-success">Login</span>';
                    } else if (log.action === 'LOGOUT') {
                        acaoBadge = '<span class="badge bg-secondary">Logout</span>';
                    } else {
                        acaoBadge = `<span class="badge bg-info">${log.action}</span>`;
                    }

                    return `
                        <tr>
                            <td>${dataFormatada}</td>
                            <td>${acaoBadge}</td>
                            <td>${log.ip}</td>
                        </tr>
                    `;
                }).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center">Nenhum log encontrado</td></tr>';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar logs:', error);
            const tbody = document.getElementById('tabelaLogsUsuario');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Erro ao carregar logs</td></tr>';
            }
        });
}

// Variável global para acesso à instância
let usuarioCORE;

