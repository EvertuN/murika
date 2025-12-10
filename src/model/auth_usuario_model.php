<?php
class UsuarioModel {
    private $conn;
    private $table = 'auth_users';

    public function __construct($db) {
        $this->conn = $db;
    }

    // Listar todos os usuários
    public function listar() {
        // Incluir nome do cargo e funcionário
        $query = "SELECT u.id, u.nome, u.usuario, u.tipo, u.ativo, u.id_funcionario, f.nome as nome_funcionario, f.id_cargo, c.cargo as nome_cargo 
                 FROM " . $this->table . " u 
                 LEFT JOIN hotel_funcionarios f ON u.id_funcionario = f.id_funcionario 
                 LEFT JOIN hotel_cargo c ON f.id_cargo = c.id_cargo
                 ORDER BY u.nome ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Buscar usuário por ID
    public function buscarPorId($id) {
        $query = "SELECT u.id, u.nome, u.usuario, u.tipo, u.ativo, u.id_funcionario, f.id_cargo 
                  FROM " . $this->table . " u 
                  LEFT JOIN hotel_funcionarios f ON u.id_funcionario = f.id_funcionario
                  WHERE u.id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Cadastrar novo usuário e funcionario automaticamente
    public function cadastrar($nome, $usuario, $senha, $tipo, $id_cargo = null) {
        $this->conn->beginTransaction();
        
        try {
            $id_funcionario = null;

            // Se um cargo foi selecionado, cria o funcionário automaticamente
            if (!empty($id_cargo)) {
                $queryFunc = "INSERT INTO hotel_funcionarios (nome, id_cargo) VALUES (:nome, :id_cargo)";
                $stmtFunc = $this->conn->prepare($queryFunc);
                $stmtFunc->bindParam(':nome', $nome);
                $stmtFunc->bindParam(':id_cargo', $id_cargo);
                $stmtFunc->execute();
                
                $id_funcionario = $this->conn->lastInsertId();
            }

            // Gerar UUID v4
            $id = $this->uuidv4();
            $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
            
            $query = "INSERT INTO " . $this->table . " (id, nome, usuario, senha, tipo, ativo, id_funcionario) VALUES (:id, :nome, :usuario, :senha, :tipo, 1, :id_funcionario)";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':nome', $nome);
            $stmt->bindParam(':usuario', $usuario);
            $stmt->bindParam(':senha', $senhaHash);
            $stmt->bindParam(':tipo', $tipo);
            $stmt->bindParam(':id_funcionario', $id_funcionario);
            
            $stmt->execute();
            
            $this->conn->commit();
            return ['success' => true, 'id' => $id];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    // Atualizar usuário
    public function editar($id, $nome, $usuario, $tipo, $ativo, $senha = null, $id_cargo = null) {
        $this->conn->beginTransaction();
        
        try {
            // Se tiver senha
            if ($senha) {
                $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
                $query = "UPDATE " . $this->table . " SET nome = :nome, usuario = :usuario, tipo = :tipo, ativo = :ativo, senha = :senha WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':senha', $senhaHash);
            } else {
                $query = "UPDATE " . $this->table . " SET nome = :nome, usuario = :usuario, tipo = :tipo, ativo = :ativo WHERE id = :id";
                $stmt = $this->conn->prepare($query);
            }
            
            $stmt->bindParam(':nome', $nome);
            $stmt->bindParam(':usuario', $usuario);
            $stmt->bindParam(':tipo', $tipo);
            $stmt->bindParam(':ativo', $ativo);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            // Buscar id_funcionario vinculado
            $queryBusca = "SELECT id_funcionario FROM " . $this->table . " WHERE id = :id";
            $stmtBusca = $this->conn->prepare($queryBusca);
            $stmtBusca->bindParam(':id', $id);
            $stmtBusca->execute();
            $dados = $stmtBusca->fetch(PDO::FETCH_ASSOC);
            $id_funcionario = $dados['id_funcionario'] ?? null;
            
            // Se tem funcionário vinculado e cargo foi informado, atualiza o cargo/nome do funcionário
            if ($id_funcionario && !empty($id_cargo)) {
                $queryFunc = "UPDATE hotel_funcionarios SET nome = :nome, id_cargo = :id_cargo WHERE id_funcionario = :id_funcionario";
                $stmtFunc = $this->conn->prepare($queryFunc);
                $stmtFunc->bindParam(':nome', $nome);
                $stmtFunc->bindParam(':id_cargo', $id_cargo);
                $stmtFunc->bindParam(':id_funcionario', $id_funcionario);
                $stmtFunc->execute();
            }
            // Se NÃO tem funcionário, mas cargo foi informado (ex: usuário antigo), cria o funcionário agora
            elseif (!$id_funcionario && !empty($id_cargo)) {
                $queryFunc = "INSERT INTO hotel_funcionarios (nome, id_cargo) VALUES (:nome, :id_cargo)";
                $stmtFunc = $this->conn->prepare($queryFunc);
                $stmtFunc->bindParam(':nome', $nome);
                $stmtFunc->bindParam(':id_cargo', $id_cargo);
                $stmtFunc->execute();
                
                $novo_id_funcionario = $this->conn->lastInsertId();
                
                // Vincula ao usuário
                $queryLink = "UPDATE " . $this->table . " SET id_funcionario = :id_funcionario WHERE id = :id";
                $stmtLink = $this->conn->prepare($queryLink);
                $stmtLink->bindParam(':id_funcionario', $novo_id_funcionario);
                $stmtLink->bindParam(':id', $id);
                $stmtLink->execute();
            }
            
            $this->conn->commit();
            return true;
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }

    // Deletar usuário (Soft Delete)
    public function deletar($id) {
        $query = "UPDATE " . $this->table . " SET ativo = 0 WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    // Verificar se usuário existe
    public function existe($usuario, $excluirId = null) {
        if ($excluirId) {
            $query = "SELECT COUNT(*) FROM " . $this->table . " WHERE usuario = :usuario AND id != :excluirId";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':usuario', $usuario);
            $stmt->bindParam(':excluirId', $excluirId);
        } else {
            $query = "SELECT COUNT(*) FROM " . $this->table . " WHERE usuario = :usuario";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':usuario', $usuario);
        }
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    // Alterar senha do usuário logado
    public function alterarSenha($userId, $senhaAtual, $novaSenha) {
        // Buscar senha atual
        $query = "SELECT senha FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($senhaAtual, $user['senha'])) {
            return ['success' => false, 'message' => 'Senha atual incorreta'];
        }

        $senhaHash = password_hash($novaSenha, PASSWORD_DEFAULT);
        $update = $this->conn->prepare("UPDATE " . $this->table . " SET senha = :senha WHERE id = :id");
        $update->bindParam(':senha', $senhaHash);
        $update->bindParam(':id', $userId);
        
        if ($update->execute()) {
            return ['success' => true, 'message' => 'Senha alterada com sucesso'];
        }
        return ['success' => false, 'message' => 'Erro ao alterar senha'];
    }

    // Gerar UUID v4
    private function uuidv4() {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // set version to 0100
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // set bits 6-7 to 10
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}

