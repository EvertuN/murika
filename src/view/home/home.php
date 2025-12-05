<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MURIKA - Gestão de Hotel</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="<?php echo BASE_URL; ?>/assets/css/main.css">
    <link rel="stylesheet" href="<?php echo BASE_URL; ?>/assets/css/auth_admin.css">
    <link rel="icon" type="image/x-icon" href="<?php echo BASE_URL; ?>/assets/image/icon.svg">
</head>
<nav class="navbar navbar-expand-lg header">
    <div class="container-fluid px-4">
        <a class="navbar-brand" href="/">
            <i class="fas fa-hotel"></i> MURIKA
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="estoqueDropdown" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-boxes"></i> Estoque
                    </a>
                    <ul class="dropdown-menu">
                        <li>
                            <a class="dropdown-item" href="#" data-section="estoque_inicio">
                                <i class="fas fa-box-open"></i> Estoque do Dia
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item" href="#" data-section="historico">
                                <i class="fas fa-history"></i> Histórico
                            </a>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        <li>
                            <a class="dropdown-item" href="#" data-section="lista_item">
                                <i class="fa-solid fa-table-list"></i> Listar Itens
                            </a>
                        </li>                        <li>
                            <a class="dropdown-item" href="#" data-section="lista_categoria_item">
                                <i class="fa-solid fa-layer-group"></i> Listar Categorias
                            </a>
                        </li>
                    </ul>
                </li>
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <i class="fa-solid fa-circle-plus"></i> Cadastrar
                    </a>
                    <ul class="dropdown-menu">
                        <li>
                            <a class="dropdown-item" href="#" data-section="cadastrar_item">
                                <i class="fa-solid fa-table-list"></i> Item
                            </a>
                        </li>                        <li>
                            <a class="dropdown-item" href="#" data-section="cadastrar_categoria_item">
                                <i class="fa-solid fa-layer-group"></i> Categoria
                            </a>
                        </li>
                    </ul>
                </li>
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user-circle"></i> <?php echo htmlspecialchars($_SESSION['nome'] ?? 'Usuário'); ?>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <!-- <li>
                            <a class="dropdown-item" href="#" data-section="auth_usuario_logs">
                                <i class="fas fa-history"></i> Meus Acessos
                            </a>
                        </li> -->
                        <?php if (isAdmin()): ?>
                        <li>
                            <a class="dropdown-item" href="#" data-section="painel_admin">
                                <i class="fas fa-users"></i> Painel Admin
                            </a>
                        </li>
                        <!-- <li>
                            <a class="dropdown-item" href="#" data-section="auth_admin_logs">
                                <i class="fas fa-clipboard-list"></i> Logs do Sistema
                            </a>
                        </li> -->
                        <?php endif; ?>
                        <!-- <li><hr class="dropdown-divider"></li> -->
                        <li>
                            <a class="dropdown-item" href="/logout">
                                <i class="fas fa-sign-out-alt"></i> Sair
                            </a>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</nav>

<body>
    <!-- Main Content -->
    <div class="main-content">
        <!-- Seção Cadastro -->
        <?php require_once __DIR__ . '/../estoque/estoque_categoria.php'; ?>
        <?php require_once __DIR__ . '/../estoque/estoque_item.php'; ?>

        <!-- Seção Histórico -->
        <?php require_once __DIR__ . '/../estoque/estoque_historico.php'; ?>

        <!-- Seção Inicial do SITE-->
        <?php require_once __DIR__ . '/../estoque/estoque_inicio.php'; ?>

        <!-- Seções do Perfil -->
        <?php require_once __DIR__ . '/../auth/auth_admin_index.php'; ?>
        
        <!-- Seções de Autenticação -->
        <?php require_once __DIR__ . '/../auth/auth_usuario_logs.php'; ?>
        <?php if (isAdmin()): ?>
            <?php require_once __DIR__ . '/../auth/auth_admin_usuarios.php'; ?>
        <?php endif; ?>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
    <script src="<?php echo BASE_URL; ?>/assets/js/navegacao.js"></script>
    <script src="<?php echo BASE_URL; ?>/assets/js/utils.js"></script>
    <script src="<?php echo BASE_URL; ?>/assets/js/estoque.js"></script>
    <script src="<?php echo BASE_URL; ?>/assets/js/core.js"></script>
    <script src="<?php echo BASE_URL; ?>/assets/js/auth.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Inicializa o CRUD de Categoria
            categoriaCORE = new CategoriaCORE({
                apiEndpoint: '/api/categoria',
                formCadastroId: 'formCadastroCategoria',
                formEditId: 'formEditarCategoria',
                tabelaId: 'tabelaCategorias',
                modalEditId: 'modalEditarCategoria',
                mensagemCadastroId: 'mensagem-categoria',
                mensagemListaId: 'mensagem-lista'
            });

            // Inicializa o CRUD de Item
            itemCORE = new ItemCORE({
                apiEndpoint: '/api/item',
                formCadastroId: 'formCadastroItem',
                formEditId: 'formEditarItem',
                tabelaId: 'tabelaItens',
                modalEditId: 'modalEditarItem',
                selectCategoriaId: 'selectCategoria',
                selectCategoriaEditId: 'editSelectCategoria',
                mensagemCadastroId: 'mensagem-item',
                mensagemListaId: 'mensagem-lista-item'
            });

            // Inicializa o CRUD de Usuário (apenas para admin)
            <?php if (isAdmin()): ?>
            usuarioCORE = new UsuarioCORE({
                apiEndpoint: '/api/usuario',
                formCadastroId: 'formCadastroUsuario',
                formEditId: 'formEditarUsuario',
                tabelaId: 'tabelaUsuarios',
                modalEditId: 'modalEditarUsuario',
                mensagemCadastroId: 'mensagem-usuario',
                mensagemListaId: 'mensagem-lista-usuario'
            });
            <?php endif; ?>

            // Inicializa alteração de senha
            setupAlterarSenha();

            // Carregar logs quando a seção for ativada
            document.querySelectorAll('[data-section]').forEach(link => {
                link.addEventListener('click', function() {
                    const sectionId = this.getAttribute('data-section');
                    if (sectionId === 'auth_admin_logs') {
                        carregarLogsAdmin();
                    } else if (sectionId === 'auth_usuario_logs') {
                        carregarLogsUsuario();
                    }
                });
            });
        });

        // Funções de Edição (chamadas pelos botões na tabela)
        function editarCategoria(id, nome) {
            document.getElementById('editCategoriaId').value = id;
            document.getElementById('editNomeCategoria').value = nome;

            const modal = new bootstrap.Modal(document.getElementById('modalEditarCategoria'));
            modal.show();
        }

        function abrirEditarItem(id, nome, idCat, frigobar) {
            document.getElementById('editItemId').value = id;
            document.getElementById('editNomeItem').value = nome;
            document.getElementById('editSelectCategoria').value = idCat;
            document.getElementById('editFrigobarCheck').checked = (frigobar == 1);

            const modal = new bootstrap.Modal(document.getElementById('modalEditarItem'));
            modal.show();
        }
    </script>
</body>
</html>