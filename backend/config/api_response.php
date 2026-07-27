<?php

function getApiRequestId(): string
{
    static $requestId = null;

    if ($requestId === null) {
        $requestId = bin2hex(random_bytes(8));
    }

    return $requestId;
}

function initializeApiRequest(): void
{
    header('X-Request-ID: ' . getApiRequestId());
}

function buildApiEnvelope(
    bool $success,
    mixed $data = null,
    string $message = '',
    ?string $code = null,
    array $meta = []
): array {
    $payload = ['success' => $success];

    if ($message !== '') {
        $payload['message'] = $message;
    }
    if ($code !== null && $code !== '') {
        $payload['code'] = $code;
    }
    if ($data !== null) {
        $payload['data'] = $data;
    }

    return array_merge($payload, $meta);
}

function apiJsonResponse(
    bool $success,
    mixed $data = null,
    string $message = '',
    int $status = 200,
    ?string $code = null,
    array $meta = []
): array {
    $payload = buildApiEnvelope($success, $data, $message, $code, $meta);
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return $payload;
}

function apiExceptionResponse(
    Throwable $exception,
    string $context,
    string $publicMessage = 'Não foi possível concluir a operação.',
    string $publicCode = 'INTERNAL_ERROR'
): array {
    $resolved = resolveApiException($exception, $context, $publicMessage, $publicCode);

    return apiJsonResponse(
        false,
        null,
        $resolved['message'],
        $resolved['status'],
        $resolved['code'],
        $resolved['meta']
    );
}

function resolveApiException(
    Throwable $exception,
    string $context,
    string $publicMessage = 'Não foi possível concluir a operação.',
    string $publicCode = 'INTERNAL_ERROR'
): array {
    if ($exception instanceof InvalidArgumentException || $exception instanceof DomainException) {
        return [
            'status' => 422,
            'message' => $exception->getMessage(),
            'code' => 'VALIDATION_ERROR',
            'meta' => [],
        ];
    }

    $requestId = getApiRequestId();
    error_log(sprintf(
        '[%s] %s: %s in %s:%d',
        $requestId,
        $context,
        $exception->getMessage(),
        $exception->getFile(),
        $exception->getLine()
    ));

    return [
        'status' => 500,
        'message' => $publicMessage,
        'code' => $publicCode,
        'meta' => ['requestId' => $requestId],
    ];
}
