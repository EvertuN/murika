<?php
class UsuarioModel {
    private $conn;
    private $table = 'auth_users';

    public function __construct($db) {
        $this->conn = $db;
    }

    // Listar todos os usuários
    public function listar() {
        $query = "SELECT id, nome, usuario, tipo, ativo FROM " . $this->table . " ORDER BY nome ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Buscar usuário por ID
    public function buscarPorId($id) {
        $query = "SELECT id, nome, usuario, tipo, ativo FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Cadastrar novo usuário
    public function cadastrar($nome, $usuario, $senha, $tipo) {
        // Gerar UUID v4
        $id = $this->uuidv4();
        
        $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
        
        $query = "INSERT INTO " . $this->table . " (id, nome, usuario, senha, tipo, ativo) VALUES (:id, :nome, :usuario, :senha, :tipo, 1)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':nome', $nome);
        $stmt->bindParam(':usuario', $usuario);
        $stmt->bindParam(':senha', $senhaHash);
        $stmt->bindParam(':tipo', $tipo);
        
        if($stmt->execute()) {
            return ['success' => true, 'id' => $id];
        }
        return ['success' => false];
    }

    // Atualizar usuário
    public function editar($id, $nome, $usuario, $tipo, $ativo, $senha = null) {
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
        
        return $stmt->execute();
    }

    // Deletar usuário
    public function deletar($id) {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
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

