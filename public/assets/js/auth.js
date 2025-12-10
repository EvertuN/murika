// Classe para gerenciar usuários
class UsuarioCORE extends COREManager {
    constructor(config) {
        super(config);
        // Carregar lista de cargos para o select
        this.carregarCargosSelect();
    }

    carregarCargosSelect() {
        fetchAPI('/api/cargo?acao=listar')
            .then(response => response.json())
            .then(data => {
                const options = (data.success ? data.data : []).map(cargo =>
                    `<option value="${cargo.id_cargo}">${cargo.cargo}</option>`
                ).join('');

                const selectCadastro = document.getElementById('selectCargoCadastro');
                if (selectCadastro) selectCadastro.innerHTML = '<option value="">Nenhum (Apenas Sistema)</option>' + options;

                const selectEdit = document.getElementById('editCargoUsuario');
                if (selectEdit) selectEdit.innerHTML = '<option value="">Nenhum</option>' + options;
            })
            .catch(err => console.error('Erro ao carregar cargos:', err));
    }

    criarLinhaTabela(item) {
        const ativoBadge = item.ativo == 1 
            ? '<span class="badge bg-success">Sim</span>' 
            : '<span class="badge bg-danger">Não</span>';
        
        const tipoBadge = item.tipo === 'admin'
            ? '<span class="badge bg-primary">Admin</span>'
            : '<span class="badge bg-secondary">Usuário</span>';

        const cargoVinculado = item.nome_cargo 
            ? `<br><small class="text-muted"><i class="fas fa-briefcase"></i> ${item.nome_cargo}</small>`
            : '';

        const funcionarioCheck = item.id_funcionario
            ? ' <i class="fas fa-user-check text-success" title="Funcionário Vinculado"></i>'
            : '';

        return `
            <tr>
                <td>${item.nome} ${funcionarioCheck} ${cargoVinculado}</td>
                <td>${item.usuario}</td>
                <td>${tipoBadge}</td>
                <td class="text-center">${ativoBadge}</td>
                <td>
                    <button class="btn btn-sm editbtn" onclick="abrirEditarUsuario('${item.id}', '${item.nome.replace(/'/g, "&#39;")}', '${item.usuario.replace(/'/g, "&#39;")}', '${item.tipo}', ${item.ativo}, '${item.id_cargo || ''}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm deletebtn" onclick="usuarioCORE.deletar('${item.id}', 'Deseja realmente deletar o usuário ${item.nome.replace(/'/g, "&#39;")}?')">
                        <i class="fas fa-trash"></i> Deletar
                    </button>
                </td>
            </tr>
        `;
    }
}

// Função para abrir modal de edição de usuário
function abrirEditarUsuario(id, nome, usuario, tipo, ativo, idCargo) {
    document.getElementById('editUsuarioId').value = id;
    document.getElementById('editNomeUsuario').value = nome;
    document.getElementById('editUsuarioUsuario').value = usuario;
    document.getElementById('editTipoUsuario').value = tipo;
    document.getElementById('editAtivoUsuario').checked = (ativo == 1);
    document.getElementById('editCargoUsuario').value = idCargo || ''; // Selecionar cargo
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

// Variável global para filtro
let currentLogFilter = 'all';

// Filtrar logs
function filtrarLogsAdmin(type, btn) {
    currentLogFilter = type;
    
    // Atualizar UI dos botões
    const buttons = btn.parentElement.querySelectorAll('button');
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Recarregar logs
    carregarLogsAdmin(1);
}

// Carregar logs do admin
function carregarLogsAdmin(page = 1) {
    const url = `/api/sistema_logs?acao=listar_admin&page=${page}&type=${currentLogFilter}`;
    console.log('Carregando logs:', url);
    
    fetchAPI(url)
        .then(response => {
            // Verificar se a resposta é OK
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Erro API (${response.status}): ${text.substring(0, 200)}`);
                });
            }
            
            // Tentar ler como texto primeiro para debug se falhar o JSON
            return response.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('Falha ao parsear JSON. Resposta recebida:', text);
                    throw new Error('Resposta inválida do servidor (não é JSON)');
                }
            });
        })
        .then(data => {
            const tbody = document.getElementById('tabelaLogsAdmin');
            if (!tbody) return;

            if (data.success && data.data && data.data.length > 0) {
                tbody.innerHTML = data.data.map(log => {
                    const dataFormatada = new Date(log.created_at).toLocaleString('pt-BR');
                    
                    let acaoBadgeClass = 'bg-info';
                    if (log.action.includes('DELETE')) acaoBadgeClass = 'bg-danger';
                    else if (log.action.includes('CREATE')) acaoBadgeClass = 'bg-success';
                    else if (log.action.includes('UPDATE')) acaoBadgeClass = 'bg-warning text-dark';
                    else if (log.action === 'LOGIN_SUCCESS') acaoBadgeClass = 'bg-primary';
                    else if (log.action === 'LOGIN_FAIL') acaoBadgeClass = 'bg-danger';
                    
                    const acaoBadge = `<span class="badge ${acaoBadgeClass}">${log.action}</span>`;
                    const usuarioNome = log.user_name || 'Sistema/Visitante';
                    
                    // Tentar parsear se for JSON, senão usa string pura
                    let detalhesTexto = log.details || '-';
                    try {
                        const detalhesJson = JSON.parse(log.details);
                        detalhesTexto = JSON.stringify(detalhesJson, null, 2); // Pretty print
                    } catch (e) {
                        // Não é JSON, manter texto normal
                    }

                    return `
                        <tr>
                            <td>${dataFormatada}</td>
                            <td>${usuarioNome}</td>
                            <td>${acaoBadge}</td>
                            <td><small class="text-muted text-break">${detalhesTexto}</small></td>
                            <td>${log.ip}</td>
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
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum log encontrado para este filtro</td></tr>';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar logs:', error);
            const tbody = document.getElementById('tabelaLogsAdmin');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Erro: ${error.message}</td></tr>`;
            }
        });
}

// Carregar logs do usuário
function carregarLogsUsuario() {
    fetchAPI('/api/sistema_logs?acao=listar_usuario')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('tabelaLogsUsuario');
            if (!tbody) return;

            if (data.success && data.data && data.data.length > 0) {
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

// Helper para renderizar detalhes do log
function renderDetails(detailsRaw) {
    if (!detailsRaw) return '-';
    
    // Se já for objeto (alguns drivers PDO retornam JSON parseado), use direto
    let data = detailsRaw;
    if (typeof detailsRaw === 'string') {
        data = __parseJSON(detailsRaw);
        if (!data) return detailsRaw; // String não JSON
    }
    
    try {
        if (typeof data === 'string') return data; // Se ainda for string simples
        
        // Envelope msg
        if (data.msg && Object.keys(data).length === 1) return data.msg;

        // Diff (Update)
        if (data.diff) {
            if (Object.keys(data.diff).length === 0) return '<em class="text-muted">Sem alterações</em>';
            
            let html = '<div style="font-size: 0.85em;">';
            if (data.name) html += `<strong>${data.name}</strong><br>`;
            
            html += '<ul class="list-unstyled mb-0">';
            for (const [field, changes] of Object.entries(data.diff)) {
                html += `<li><span class="fw-bold">${field}:</span> <span class="text-danger text-decoration-line-through">${changes.from}</span> &rarr; <span class="text-success">${changes.to}</span></li>`;
            }
            html += '</ul></div>';
            return html;
        }

        // Relatórios
        if (data.turno || data.data_filtro) {
            let parts = [];
            if (data.msg) parts.push(`<strong>${data.msg}</strong>`);
            if (data.turno) parts.push(`Turno: ${data.turno}`);
            if (data.data_filtro) parts.push(`Data: ${data.data_filtro}`);
            if (data.funcionario) parts.push(`Func: ${data.funcionario}`);
            return parts.join('<br>');
        }
        
        // Fallback
        return '<pre class="m-0 text-muted" style="font-size:0.7em; white-space: pre-wrap;">' + JSON.stringify(data, null, 2) + '</pre>';

    } catch (e) {
        return typeof detailsRaw === 'string' ? detailsRaw : JSON.stringify(detailsRaw);
    }
}

function __parseJSON(str) {
    try { return JSON.parse(str); } catch (e) { return null; }
}

// Variável global para acesso à instância
let usuarioCORE;
