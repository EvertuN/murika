<?php
class CategoriaModel {
    private $conn;
    private $table = 'estoque_categorias_item';

    public function __construct($db) {
        $this->conn = $db;
    }

    // Listar todas as categorias
    public function listar() {
        $query = "SELECT * FROM " . $this->table . " ORDER BY nome_categoria ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Buscar categoria por ID
    public function buscarPorId($id) {
        $query = "SELECT * FROM " . $this->table . " WHERE id_categoria = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Cadastrar nova categoria
    public function cadastrar($nome) {
        $query = "INSERT INTO " . $this->table . " (nome_categoria) VALUES (:nome)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nome', $nome);
        
        if($stmt->execute()) {
            return ['success' => true, 'id' => $this->conn->lastInsertId()];
        }
        return ['success' => false];
    }

    // Atualizar categoria
    public function editar($id, $nome) {
        $query = "UPDATE " . $this->table . " SET nome_categoria = :nome WHERE id_categoria = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nome', $nome);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    // Deletar categoria
    public function deletar($id) {
        $query = "DELETE FROM " . $this->table . " WHERE id_categoria = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    // Verificar se categoria existe
    public function existe($nome) {
        $query = "SELECT COUNT(*) FROM " . $this->table . " WHERE nome_categoria = :nome";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nome', $nome);
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }
}