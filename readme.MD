# 🏨 Murika Hotel Management System

> **O melhor, maior e mais humilde sistema de gestão hoteleira.** 
> Simplifique sua operação com controle total de estoque, funcionários e segurança.

---

## 📋 Sobre o Projeto

O **Murika** é uma solução completa desenvolvida para modernizar a administração de hotéis. Focado na experiência do usuário e na integridade dos dados, o sistema oferece uma interface limpa e intuitiva para controlar desde o estoque do frigobar até o gerenciamento de acessos da equipe.

Construído com tecnologias robustas e modernas, o Murika garante performance, segurança e auditoria completa de todas as ações.

## ✨ Principais Funcionalidades

### 🔐 Autenticação & Segurança
*   **Login Seguro:** Proteção de rotas e sessões criptografadas.
*   **Controle de Acesso (ACL):** Perfis distintos para **Administradores** e **Usuários** comuns.
*   **Auditoria Completa (Logs):**
    *   **Logs de Acesso:** Rastreamento de quem entrou e saiu do sistema (IP, Data/Hora).
    *   **Logs de Sistema:** Histórico detalhado ("dedo-duro") de quem criou, editou ou apagou qualquer registro.

### 📦 Gestão de Estoque Inteligente
*   **Controle Duplo:** Gestão separada para **Recepção** e **Frigobar**.
*   **Status Visual:** Indicadores coloridos (Badges) para estoque "OK" ou "Baixo".
*   **Edição Rápida:** Altere o estoque mínimo diretamente na lista de itens, sem recarregar a página.
*   **Movimentações:** Registro rápido de Entrada/Saída com cálculo automático de saldo.

### 👥 Gestão de Pessoas (RH)
*   **Vinculação Automática:** Ao criar um usuário no sistema, um funcionário é automaticamente gerado no RH.
*   **Cargos Dinâmicos:** Gerenciamento flexível de funções e atribuições.
*   **Perfil do Usuário:** Cada colaborador tem seu acesso personalizado.

### 📊 Relatórios e Dashboard
*   **Dashboard em Tempo Real:** Visão geral de itens críticos e movimentações do dia.
*   **Relatórios de Turno:** Geração de relatórios PDF para fechamento de caixa e controle de turno.
*   **Histórico Completo:** Linha do tempo de todas as operações realizadas.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi desenvolvido utilizando uma stack moderna e containerizada:

*   **Backend:** PHP 8+ (Vanilla/No-Framework) com padrão MVC e PDO.
*   **Banco de Dados:** MySQL 8.0.
*   **Frontend:**
    *   HTML5 & CSS3 (Variáveis CSS, Flexbox).
    *   Bootstrap 5 (Layout responsivo e Componentes).
    *   JavaScript ES6+ (Fetch API, Classes, Assincronismo).
*   **Infraestrutura:** Docker & Docker Compose.

---

## 🚀 Como Executar o Projeto

Simples, rápido e containerizado.

### Pré-requisitos
*   [Docker](https://www.docker.com/) instalado.

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/EvertuN/murika.git
    cd murika
    ```

2.  **Inicie os containers:**
    ```bash
    docker-compose up -d
    ```
    *Isso irá subir o PHP, MySQL e PHPMyAdmin.*

3.  **Acesse o Sistema:**
    *   **Aplicação:** [http://localhost:8000](http://localhost:8000)
    *   **PHPMyAdmin:** [http://localhost:5000](http://localhost:5000)

### 🔑 Credenciais Padrão (Ambiente Dev)

| Serviço | Usuário | Senha |
| :--- | :--- | :--- |
| **Sistema Murika** | `admin` | `admin123` |
| **Banco de Dados** | `admin` | `admin123` |

---

## 📂 Estrutura do Projeto

```
murika/
├── public/           # Arquivos acessíveis via web (CSS, JS, Imagens)
│   ├── assets/       # Estilos e Scripts refatorados
│   └── index.php     # Ponto de entrada (Router)
├── src/              # Código fonte Backend
│   ├── config/       # Configurações de DB e Auth
│   ├── controller/   # Lógica de controle
│   ├── model/        # Acesso a dados
│   └── view/         # Interface do usuário (HTML/PHP)
└── docker-compose.yml
```

---

## 📝 Status do Projeto
> **Versão Atual:** 1.0 (Estável)
> *   ✅ Módulo de Estoque
> *   ✅ Módulo de RH
> *   ✅ Logs e Auditoria 2.0
> *   ✅ Quick Edit Feature

---

Feito com pelo grande e incontestável Everton Almeida. Estudante de Análise e Desenvolvimento de Sistemas no INSITUTO FEDERAL DE RONDÔNIA (Campus Ariquemes)