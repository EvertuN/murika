<?php
/**
 * EmpresaController - Controlador customizado para Empresas
 *
 * Herda do BaseCoreController e aplica sanitizacao de campos mascarados.
 */

require_once __DIR__ . '/../core/BaseCoreController.php';

class EmpresaController extends BaseCoreController {
    protected function beforeCreate(&$data) {
        $this->sanitizeData($data);
        return true;
    }

    protected function beforeUpdate($id, &$data) {
        $this->sanitizeData($data);
        return true;
    }

    protected function customValidation($data) {
        $cnpj = $this->onlyDigits($data['cnpj'] ?? '');
        if ($cnpj === '') {
            return ['valid' => false, 'message' => 'CNPJ e obrigatorio'];
        }

        $excludeId = intval($_POST['id'] ?? 0);
        $existing = $this->findCnpj($cnpj, $excludeId);
        if ($existing) {
            return [
                'valid' => false,
                'message' => intval($existing['is_deleted'] ?? 0) === 1
                    ? 'Empresa ja existe inativada. Contate um administrador para ativar.'
                    : 'CNPJ ja cadastrado'
            ];
        }

        return ['valid' => true];
    }

    private function sanitizeData(&$data) {
        if (isset($data['cnpj'])) {
            $data['cnpj'] = $this->onlyDigits($data['cnpj']);
        }

        if (isset($data['telefone'])) {
            $data['telefone'] = $this->onlyDigits($data['telefone']);
        }
    }

    private function onlyDigits($value) {
        return preg_replace('/\D+/', '', (string)$value);
    }

    private function findCnpj($cnpj, $excludeId = 0) {
        $sql = "SELECT {$this->primaryKey}, is_deleted FROM {$this->table}
                WHERE REPLACE(REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', ''), ' ', '') = :cnpj";

        if ($excludeId > 0) {
            $sql .= " AND {$this->primaryKey} <> :id";
        }

        $sql .= " LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':cnpj', $cnpj);

        if ($excludeId > 0) {
            $stmt->bindValue(':id', $excludeId, PDO::PARAM_INT);
        }

        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
