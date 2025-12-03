<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - MURIKA</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="<?php echo BASE_URL; ?>/assets/css/main.css">
    <link rel="icon" type="image/x-icon" href="<?php echo BASE_URL; ?>/assets/image/icon.svg">
    <style>
        body {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
        }
        .login-container {
            width: 100%;
            max-width: 400px;
            padding: 2rem;
        }
        .login-card {
            background: var(--card-bg);
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            padding: 2.5rem;
            border: 1px solid var(--border-color);
        }
        .login-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        .login-header i {
            font-size: 3.5rem;
            color: var(--primary-color);
            margin-bottom: 1rem;
        }
        .login-header h2 {
            color: var(--primary-color);
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        .login-header p {
            color: var(--text-color);
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <i class="fas fa-hotel"></i>
                <h2>MURIKA</h2>
                <p>Sistema de Gestão de Hotel</p>
            </div>
            
            <?php if (isset($_GET['msg'])): ?>
                <?php if ($_GET['msg'] === 'logout'): ?>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> Você foi desconectado com sucesso.
                    </div>
                <?php elseif ($_GET['msg'] === 'expirou'): ?>
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i> Sua sessão expirou. Faça login novamente.
                    </div>
                <?php endif; ?>
            <?php endif; ?>
            
            <?php if (isset($erro)): ?>
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> <?php echo htmlspecialchars($erro); ?>
                </div>
            <?php endif; ?>
            
            <form method="POST" id="formLogin">
                <div class="mb-3">
                    <label class="form-label">Usuário</label>
                    <input type="text" name="usuario" class="form-control" required autofocus>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">Senha</label>
                    <input type="password" name="senha" class="form-control" required>
                </div>
                
                <button type="submit" class="btn btn-primary w-100">
                    <i class="fas fa-sign-in-alt"></i> Entrar
                </button>
            </form>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
</body>
</html>
