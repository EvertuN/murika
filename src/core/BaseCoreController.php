<?php
/**
 * BaseCoreController - Controlador CRUD Genérico
 * 
 * Centraliza toda lógica CRUD para eliminar duplicação de código.
 * Suporta validação, relacionamentos, hooks e tratamento de erros padronizado.
 * 
 * @author Everton Almeida / Sistema Murika
 * @version 1.0.3
 */

class BaseCoreController {
    protected $db;
    protected $table;
    protected $primaryKey;
    protected $fields;
    protected $requiredFields;
    protected $relationships;
    protected $orderBy;
    protected $requireAuth;
    protected $requireAdmin;
    protected $logField;
    
    // Armazena dados temporários para logs (ex: nome antes de deletar)
    protected $tempLogData = [];
    
    // Armazena dados antigos para diff (novo Logs 2.0)
    protected $oldData = [];
    
    /**
     * Construtor
     * 
     * @param PDO $db Conexão com banco de dados
     * @param array $config Configuração do controller
     */
    public function __construct($db, array $config) {
        $this->db = $db;
        $this->table = $config['table'] ?? null;
        $this->primaryKey = $config['primaryKey'] ?? 'id';
        $this->fields = $config['fields'] ?? [];
        $this->requiredFields = $config['requiredFields'] ?? [];
        $this->relationships = $config['relationships'] ?? [];
        $this->orderBy = $config['orderBy'] ?? $this->primaryKey;
        $this->requireAuth = $config['requireAuth'] ?? false;
        $this->requireAdmin = $config['requireAdmin'] ?? true;
        // Se logField não for definido, tenta usar o primeiro campo ou 'nome' se existir
        $this->logField = $config['logField'] ?? (in_array('nome', $this->fields) ? 'nome' : ($this->fields[0] ?? null));
        
        // Validar configuração mínima
        if (!$this->table || empty($this->fields)) {
            throw new Exception('Configuração inválida: table e fields são obrigatórios');
        }
        
        // Carregar Logger
        require_once __DIR__ . '/Logger.php';
    }
    
    /**
     * Processa a requisição baseado na ação
     */
    public function handleRequest() {
        header('Content-Type: application/json');
        
        $acao = $_POST['acao'] ?? $_GET['acao'] ?? '';
        
        try {
            switch($acao) {
                case 'cadastrar':
                    return $this->create();
                    
                case 'listar':
                    return $this->read();
                    
                case 'editar':
                    return $this->update();
                    
                case 'deletar':
                    return $this->delete();
                    
                default:
                    return $this->jsonResponse(false, 'Ação inválida');
            }
        } catch (Exception $e) {
            return $this->jsonResponse(false, 'Erro: ' . $e->getMessage());
        }
    }
    
    /**
     * CREATE - Cadastrar novo registro
     */
    protected function create() {
        // Coletar dados
        $data = $this->collectData();
        
        // Validar campos obrigatórios
        $validation = $this->validate($data);
        if (!$validation['valid']) {
            return $this->jsonResponse(false, $validation['message']);
        }
        
        // Hook: antes de criar
        if (!$this->beforeCreate($data)) {
            return $this->jsonResponse(false, 'Validação customizada falhou');
        }
        
        try {
            // Preparar query
            $fields = implode(', ', array_keys($data));
            $placeholders = ':' . implode(', :', array_keys($data));
            $sql = "INSERT INTO {$this->table} ($fields) VALUES ($placeholders)";
            
            // Executar
            $stmt = $this->db->prepare($sql);
            foreach ($data as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            $stmt->execute();
            
            $insertId = $this->db->lastInsertId();
            
            // Hook: depois de criar
            $this->afterCreate($insertId, $data);
            
            return $this->jsonResponse(true, 'Cadastrado com sucesso!', ['id' => $insertId]);
            
        } catch (PDOException $e) {
            return $this->jsonResponse(false, 'Erro ao cadastrar: ' . $e->getMessage());
        }
    }
    
    /**
     * READ - Listar registros
     */
    protected function read() {
        try {
            // Construir query base
            $sql = "SELECT ";
            
            // Campos da tabela principal
            $selectFields = [];
            foreach ($this->fields as $field) {
                $selectFields[] = "{$this->table}.$field";
            }
            $selectFields[] = "{$this->table}.{$this->primaryKey}";
            
            // Adicionar campos de relacionamentos
            foreach ($this->relationships as $alias => $rel) {
                $selectFields[] = "{$rel['table']}.{$rel['displayField']} as $alias";
            }
            
            $sql .= implode(', ', $selectFields);
            $sql .= " FROM {$this->table}";
            
            // Adicionar JOINs
            foreach ($this->relationships as $alias => $rel) {
                $joinType = $rel['type'] ?? 'LEFT';
                $sql .= " $joinType JOIN {$rel['table']} ON {$this->table}.{$rel['foreignKey']} = {$rel['table']}.{$rel['primaryKey']}";
            }
            
            // Ordenação
            $sql .= " ORDER BY {$this->table}.{$this->orderBy}";
            
            // Executar
            $stmt = $this->db->query($sql);
            $data = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
            
            return $this->jsonResponse(true, '', ['data' => $data]);
            
        } catch (PDOException $e) {
            return $this->jsonResponse(false, 'Erro ao listar: ' . $e->getMessage());
        }
    }
    
    /**
     * UPDATE - Atualizar registro
     */
    protected function update() {
        // Verificar autenticação/permissões
        if ($this->requireAuth) {
            require_once __DIR__ . '/../config/auth.php';
            requerAutenticacao();
            
            if ($this->requireAdmin && !isAdmin()) {
                return $this->jsonResponse(false, 'Acesso negado. Apenas administradores podem editar.');
            }
        }
        
        // Coletar dados
        $data = $this->collectData();
        $id = intval($_POST['id'] ?? 0);
        
        if ($id <= 0) {
            return $this->jsonResponse(false, 'ID inválido');
        }
        
        // Validar
        $validation = $this->validate($data);
        if (!$validation['valid']) {
            return $this->jsonResponse(false, $validation['message']);
        }

        // SNAPSHOT: Buscar dados atuais para diff
        try {
            $stmtOld = $this->db->prepare("SELECT * FROM {$this->table} WHERE {$this->primaryKey} = :id");
            $stmtOld->execute([':id' => $id]);
            $this->oldData = $stmtOld->fetch(PDO::FETCH_ASSOC) ?: [];
        } catch (Exception $e) {
            // Se falhar o snapshot, segue o fluxo
        }
        
        // Hook: antes de atualizar
        if (!$this->beforeUpdate($id, $data)) {
            return $this->jsonResponse(false, 'Validação customizada falhou');
        }
        
        try {
            // Preparar query
            $setParts = [];
            foreach ($data as $key => $value) {
                $setParts[] = "$key = :$key";
            }
            $setClause = implode(', ', $setParts);
            $sql = "UPDATE {$this->table} SET $setClause WHERE {$this->primaryKey} = :id";
            
            // Executar
            $stmt = $this->db->prepare($sql);
            foreach ($data as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            // Hook: depois de atualizar
            $this->afterUpdate($id, $data);
            
            return $this->jsonResponse(true, 'Atualizado com sucesso!');
            
        } catch (PDOException $e) {
            return $this->jsonResponse(false, 'Erro ao atualizar: ' . $e->getMessage());
        }
    }
    
    /**
     * DELETE - Deletar registro
     */
    protected function delete() {
        // Verificar autenticação/permissões
        if ($this->requireAuth) {
            require_once __DIR__ . '/../config/auth.php';
            requerAutenticacao();
            
            if ($this->requireAdmin && !isAdmin()) {
                return $this->jsonResponse(false, 'Acesso negado. Apenas administradores podem deletar.');
            }
        }
        
        $id = intval($_POST['id'] ?? 0);
        
        if ($id <= 0) {
            return $this->jsonResponse(false, 'ID inválido');
        }
        
        // Hook: antes de deletar
        if (!$this->beforeDelete($id)) {
            return $this->jsonResponse(false, 'Não é possível deletar este registro');
        }
        
        try {
            $sql = "DELETE FROM {$this->table} WHERE {$this->primaryKey} = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            // Hook: depois de deletar
            $this->afterDelete($id);
            
            return $this->jsonResponse(true, 'Deletado com sucesso!');
            
        } catch (PDOException $e) {
            return $this->jsonResponse(false, 'Erro ao deletar: ' . $e->getMessage());
        }
    }
    
    /**
     * Coleta dados do POST baseado nos campos configurados
     */
    protected function collectData() {
        $data = [];
        foreach ($this->fields as $field) {
            if (isset($_POST[$field])) {
                $data[$field] = trim($_POST[$field]);
            }
        }
        return $data;
    }
    
    /**
     * Valida dados
     */
    protected function validate($data) {
        // Verificar campos obrigatórios
        foreach ($this->requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return [
                    'valid' => false,
                    'message' => "Campo '$field' é obrigatório"
                ];
            }
        }
        
        // Validação customizada
        $customValidation = $this->customValidation($data);
        if (!$customValidation['valid']) {
            return $customValidation;
        }
        
        return ['valid' => true];
    }
    
    /**
     * Retorna resposta JSON padronizada
     */
    protected function jsonResponse($success, $message, $data = []) {
        $response = array_merge([
            'success' => $success,
            'message' => $message
        ], $data);
        
        echo json_encode($response);
        return $response;
    }
    
    // ============================================
    // HOOKS - Podem ser sobrescritos em subclasses
    // ============================================
    
    /**
     * Hook: Antes de criar
     * @return bool true para continuar, false para cancelar
     */
    protected function beforeCreate(&$data) {
        return true;
    }
    
    /**
     * Hook: Depois de criar
     */
    protected function afterCreate($id, $data) {
        $name = isset($this->logField) && isset($data[$this->logField]) ? $data[$this->logField] : '';
        Logger::logCrud($this->db, $this->table, 'CREATE', $id, $name);
    }
    
    /**
     * Hook: Antes de atualizar
     * @return bool true para continuar, false para cancelar
     */
    protected function beforeUpdate($id, &$data) {
        return true;
    }
    
    /**
     * Hook: Depois de atualizar
     */
    protected function afterUpdate($id, $data) {
        $name = isset($this->logField) && isset($data[$this->logField]) ? $data[$this->logField] : '';
        
        // Calcular diff
        $diff = [];
        foreach ($data as $key => $value) {
            // Compara valor antigo com novo (apenas se existir no oldData)
            if (isset($this->oldData[$key]) && $this->oldData[$key] != $value) {
                $diff[$key] = [
                    'from' => $this->oldData[$key],
                    'to' => $value
                ];
            }
        }
        
        Logger::logCrud($this->db, $this->table, 'UPDATE', $id, $name, $diff);
    }
    
    /**
     * Hook: Antes de deletar
     * @return bool true para continuar, false para cancelar
     */
    protected function beforeDelete($id) {
        // Tentar buscar o nome antes de deletar para o log
        if ($this->logField) {
            try {
                $stmt = $this->db->prepare("SELECT {$this->logField} FROM {$this->table} WHERE {$this->primaryKey} = :id");
                $stmt->execute([':id' => $id]);
                $res = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($res) {
                    $this->tempLogData['deleted_name'] = $res[$this->logField];
                }
            } catch (Exception $e) {
                // Ignore errors here
            }
        }
        return true;
    }
    
    /**
     * Hook: Depois de deletar
     */
    protected function afterDelete($id) {
        $name = $this->tempLogData['deleted_name'] ?? '';
        Logger::logCrud($this->db, $this->table, 'DELETE', $id, $name);
    }
    
    /**
     * Hook: Validação customizada
     * @return array ['valid' => bool, 'message' => string]
     */
    protected function customValidation($data) {
        return ['valid' => true];
    }
}
