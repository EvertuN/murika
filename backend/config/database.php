<?php
require_once __DIR__ . '/bootstrap.php';

date_default_timezone_set(APP_TIMEZONE);

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $conn;

    public function __construct() {
        $this->host = env('DB_HOST', 'db');
        $this->db_name = env('DB_NAME', 'murika');
        $this->username = env('DB_USERNAME', '');
        $this->password = env('DB_PASSWORD', '');
    }

    public function connect() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("SET time_zone = '-04:00'");
        } catch(PDOException $e) {
            error_log('Database connection error: ' . $e->getMessage());
            throw new RuntimeException('Não foi possível conectar ao banco de dados.', 0, $e);
        }

        return $this->conn;
    }
}
