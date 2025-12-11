<?php
// Definir timezone padrão da aplicação
date_default_timezone_set('America/Porto_Velho');

class Database {
    private $host = 'host_name';
    private $db_name = 'db_name';
    private $username = 'user_name';
    private $password = 'password_name';
    private $conn;

    public function connect() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            // Garantir que a sessão do MySQL use o mesmo fuso horário da aplicação
            // America/Porto_Velho = UTC-4 (sem horário de verão)
            $this->conn->exec("SET time_zone = '-04:00'");
        } catch(PDOException $e) {
            echo "Erro de conexão: " . $e->getMessage();
        }
        
        return $this->conn;
    }
}
