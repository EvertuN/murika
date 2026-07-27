<?php
/**
 * ClienteController - Controlador customizado para Clientes
 *
 * Herda do BaseCoreController e adiciona logica de formatacao de dados.
 */

require_once __DIR__ . '/../core/BaseCoreController.php';

class ClienteController extends BaseCoreController {
    protected function beforeCreate(&$data) {
        return $this->formatData($data);
    }

    protected function beforeUpdate($id, &$data) {
        return $this->formatData($data);
    }

    private function formatData(&$data) {
        if (isset($data['telefone'])) {
            $data['telefone'] = $this->onlyDigits($data['telefone']);
        }

        if (($data['tipo_documento'] ?? '') === 'CPF' && isset($data['documento'])) {
            $data['documento'] = $this->onlyDigits($data['documento']);
        }

        if (isset($data['credito'])) {
            if (empty($data['credito'])) {
                $data['credito'] = 0;
            } else {
                $valor = str_replace('.', '', $data['credito']);
                $valor = str_replace(',', '.', $valor);
                $data['credito'] = floatval($valor);
            }
        }
        return true;
    }

    protected function customValidation($data) {
        $tipoDocumento = (string) ($data['tipo_documento'] ?? '');
        $documento = (string) ($data['documento'] ?? '');
        $documentoBusca = $tipoDocumento === 'CPF' ? $this->onlyDigits($documento) : trim($documento);

        if ($tipoDocumento === 'CPF' && !$this->isValidCpf($documentoBusca)) {
            return ['valid' => false, 'message' => 'CPF invalido'];
        }

        $excludeId = intval($_POST['id'] ?? 0);
        $existing = $this->findDocumento($tipoDocumento, $documentoBusca, $excludeId);
        if ($existing) {
            return [
                'valid' => false,
                'message' => intval($existing['is_deleted'] ?? 0) === 1
                    ? 'Cliente ja existe inativado. Contate um administrador para ativar.'
                    : 'Documento ja cadastrado para outro cliente'
            ];
        }

        return ['valid' => true];
    }

    private function onlyDigits($value) {
        return preg_replace('/\D+/', '', (string)$value);
    }

    private function isValidCpf($cpf) {
        $cpf = $this->onlyDigits($cpf);

        if (strlen($cpf) !== 11) {
            return false;
        }

        if (preg_match('/^(\\d)\\1{10}$/', $cpf)) {
            return false;
        }

        for ($t = 9; $t < 11; $t++) {
            $sum = 0;
            for ($i = 0; $i < $t; $i++) {
                $sum += intval($cpf[$i]) * (($t + 1) - $i);
            }

            $digit = ((10 * $sum) % 11) % 10;
            if (intval($cpf[$t]) !== $digit) {
                return false;
            }
        }

        return true;
    }

    private function findDocumento($tipoDocumento, $documento, $excludeId = 0) {
        if ($tipoDocumento === 'CPF') {
            return $this->findDocumentoPorExpressao(
                "tipo_documento = 'CPF' AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(documento, '.', ''), '-', ''), '/', ''), '(', ''), ')', '') = :documento",
                $documento,
                $excludeId
            );
        }

        return $this->findDocumentoPorExpressao(
            'tipo_documento = :tipo_documento AND documento = :documento',
            $documento,
            $excludeId,
            $tipoDocumento
        );
    }

    private function findDocumentoPorExpressao($where, $documento, $excludeId = 0, $tipoDocumento = null) {
        $sql = "SELECT {$this->primaryKey}, is_deleted FROM {$this->table}
                WHERE {$where}";

        if ($excludeId > 0) {
            $sql .= " AND {$this->primaryKey} <> :id";
        }

        $sql .= " LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':documento', $documento);
        if ($tipoDocumento !== null) {
            $stmt->bindValue(':tipo_documento', $tipoDocumento);
        }

        if ($excludeId > 0) {
            $stmt->bindValue(':id', $excludeId, PDO::PARAM_INT);
        }

        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
