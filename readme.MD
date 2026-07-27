# Murika

Sistema web para operação hoteleira, reunindo reservas, hospedagem, estoque, cadastros, financeiro, funcionários e administração em uma única aplicação.

O backend é executado em PHP com MySQL. A interface utiliza React, Next.js e TypeScript, com navegação responsiva e controle de acesso por perfil.

## Funcionalidades

### Reservas

- Cadastro e consulta de reservas.
- Seleção de quarto, cliente, empresa, origem e período.
- Composição do valor por diária.
- Alteração de todas as diárias ou de uma diária específica.
- Total calculado exclusivamente pela soma das diárias.
- Pagamento inicial na mesma operação ou criação com pagamento pendente.
- Registro de pagamentos, consumos, alterações de status e extensão da estadia.
- Histórico de ações e auditoria.

### Cadastros

- Itens e categorias de estoque.
- Quartos e tipos de quarto.
- Preços padrão por tipo de acomodação.
- Formas de pagamento.
- Clientes e empresas.
- Funcionários e cargos.

### Estoque

- Saldo atual e estoque mínimo.
- Entradas, saídas, descartes e consumos de hóspedes.
- Histórico de movimentações.
- Correções auditadas.
- Relatórios por período.

### Financeiro e administração

- Dashboard financeiro.
- Indicadores de reservas, quartos, estoque e pagamentos.
- Usuários com perfis de acesso.
- Logs administrativos e operacionais.
- Configurações de sessão, segurança, reservas, estoque e relatórios.

## Tecnologias

- PHP 8.1 e Apache
- MySQL 8
- React 18
- Next.js 15
- TypeScript
- Bootstrap 5
- Docker e Docker Compose

## Credencial inicial

Uma instalação nova cria automaticamente o seguinte administrador:

```text
Email: admin@gmail.com
Senha: admin123
```

Essa credencial é destinada ao primeiro acesso. Altere a senha em **Configurações → Usuários** antes de disponibilizar o sistema em uma rede pública.

## Início rápido

### Pré-requisitos

- Docker com Docker Compose
- Node.js 22 e npm para desenvolvimento do frontend

### 1. Configure o ambiente

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Edite o `.env` e substitua as senhas de exemplo do banco.

### 2. Inicie o backend e o banco

```powershell
docker compose --env-file .env -f composes/dev/docker-compose.yml up -d --build
```

Serviços disponíveis:

|    Serviço    |         Endereço         |
| ------------- | ------------------------ |
| Aplicação PHP | `http://localhost:8000`  |
| MySQL         | `localhost:6000`         |
| phpMyAdmin    | `http://localhost:5000`  |

O MySQL importa `murika.sql` automaticamente somente quando o volume é criado pela primeira vez.

### 3. Inicie o frontend em desenvolvimento

```powershell
cd frontend
npm install
npm run dev
```

A interface com atualização automática ficará disponível em:

```text
http://localhost:5173
```

## Banco de dados

O arquivo `murika.sql` contém:

- estrutura completa das tabelas;
- chaves, índices e relacionamentos;
- configurações operacionais padrão;
- tipos de quarto iniciais;
- formas de pagamento iniciais;
- usuário administrador inicial.

O `murika.sql` é a fonte única para instalações novas. Bancos criados por versões antigas devem ser atualizados manualmente, sempre com revisão do schema e backup dos dados.

### Recriar o banco local

O comando abaixo apaga o volume e todos os dados do banco local:

```powershell
docker compose --env-file .env -f composes/dev/docker-compose.yml down -v
docker compose --env-file .env -f composes/dev/docker-compose.yml up -d --build
```

Após a recriação, utilize `admin@gmail.com` e `admin123`.

## Desenvolvimento

### Comandos do frontend

```powershell
cd frontend

# Servidor de desenvolvimento
npm run dev

# Reinicia removendo o cache de desenvolvimento
npm run dev:reset

# Verificação de estilo
npm run lint

# Verificação do TypeScript
npm run typecheck

# Build de produção
npm run build

# Lint, TypeScript e build
npm run check
```

O build do Next.js é exportado e copiado para:

```text
public/dist
public/_next
```

## Produção

Crie o `.env` de produção com senhas próprias e execute:

```bash
docker compose --env-file .env -f composes/prod/docker-compose.yml up -d --build
```

Por padrão, a aplicação de produção responde em:

```text
http://localhost:3010
```

Em uma implantação pública, configure domínio, proxy reverso e TLS fora do repositório. Nunca mantenha `admin123` como senha do administrador em produção.

## Perfis de acesso

| Perfil | Acesso principal |
| --- | --- |
| `admin` | Acesso completo, cadastros administrativos, usuários, logs e configurações |
| `recepcao` | Reservas, clientes, empresas e operações permitidas de estoque |
| `financeiro` | Dashboard financeiro e consultas operacionais em modo de leitura |

As permissões são validadas no backend. Ocultar uma opção no frontend não substitui a autorização da API.

## Organização do projeto

```text
murika/
├── backend/
│   ├── config/        # banco, autenticação e segurança
│   ├── controller/    # endpoints e regras de negócio
│   ├── core/          # infraestrutura compartilhada
│   ├── model/         # acesso a dados
│   ├── security/      # regras de autorização
│   └── service/       # serviços de domínio
├── frontend/
│   ├── src/app/       # páginas e rotas Next.js
│   ├── src/core/      # shell, layout e hooks globais
│   ├── src/modules/   # módulos por domínio
│   ├── src/router/    # mapeamento de seções e URLs
│   ├── src/shared/    # componentes e serviços reutilizáveis
│   └── src/styles/    # estilos globais
├── public/            # front controller e frontend exportado
├── composes/          # composições Docker de desenvolvimento e produção
├── murika.sql         # schema e dados iniciais
├── Dockerfile.dev
└── Dockerfile.prod
```

## Variáveis de ambiente

As principais opções estão documentadas em `.env.example`:

| Variável | Finalidade |
| --- | --- |
| `APP_ENV` | Ambiente da aplicação |
| `APP_TIMEZONE` | Fuso horário usado pelo PHP |
| `APP_PORT` | Porta HTTP do container PHP |
| `DB_HOST` | Host do MySQL |
| `DB_NAME` | Nome do banco |
| `DB_USERNAME` | Usuário do banco |
| `DB_PASSWORD` | Senha do usuário do banco |
| `DB_ROOT_PASSWORD` | Senha root do MySQL |
| `NEXT_DEV_PUBLIC_URL` | Endereço do Next.js em desenvolvimento |
| `MURIKA_API_PROXY_TARGET` | Destino do proxy de API do frontend |

Não versione o arquivo `.env` nem credenciais reais.

## Regras importantes

- Valores de reservas são calculados pela soma das diárias no frontend e novamente validados no backend.
- Exclusões e alterações sensíveis geram registros de auditoria.
- Cadastros em uso não podem ser removidos quando isso quebraria relacionamentos.
- O backend é a fonte de verdade para autenticação, permissões e regras financeiras.
- Alterações de banco devem ser feitas com backup quando houver dados reais.

## Solução de problemas

### O frontend não refletiu uma alteração

```powershell
cd frontend
npm run dev:reset
```

Para a imagem de produção, reconstrua os containers:

```bash
docker compose --env-file .env -f composes/prod/docker-compose.yml up -d --build
```

### A credencial inicial não apareceu

O MySQL não importa novamente o schema quando o volume já existe. Para um ambiente local descartável, recrie o volume conforme a seção **Recriar o banco local**. Em um banco com dados importantes, crie ou atualize o administrador manualmente e não apague o volume.

### O login foi bloqueado

Aguarde o período configurado ou utilize um administrador para desbloquear o usuário em **Configurações → Usuários**.

### O banco não iniciou

Verifique as credenciais no `.env` e os logs:

```powershell
docker compose --env-file .env -f composes/dev/docker-compose.yml logs db
```
