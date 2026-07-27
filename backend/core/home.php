<?php
$jsonScriptFlags = JSON_UNESCAPED_UNICODE
    | JSON_HEX_TAG
    | JSON_HEX_AMP
    | JSON_HEX_APOS
    | JSON_HEX_QUOT
    | JSON_UNESCAPED_SLASHES;

$appEnv = strtolower(trim((string) env('APP_ENV', 'production')));
$isFrontendDev = ($appEnv === 'development');
$nextDevUrl = rtrim((string) env('NEXT_DEV_PUBLIC_URL', 'http://localhost:5173'), '/');
$nextExportIndex = dirname(__DIR__, 2) . '/public/dist/index.html';
$pageMode = $pageMode ?? 'app';
$authBootstrap = $authBootstrap ?? getAuthBootstrapData();

// ========================================================
// MODO PRODUCAO: Serve o export estático do Next.js
// Os assets /_next/* já estão em public/_next/ (via sync-dist)
// então o Apache serve eles diretamente pelo .htaccess
// ========================================================
if (file_exists($nextExportIndex)) {
    $html = file_get_contents($nextExportIndex);
    
    if ($html !== false && $html !== '') {
        // Extrai <head> e <body>
        preg_match('/<head[^>]*>([\s\S]*?)<\/head>/i', $html, $headMatch);
        preg_match('/<body[^>]*>([\s\S]*?)<\/body>/i', $html, $bodyMatch);
        
        $headContent = $headMatch[1] ?? '';
        $bodyContent = $bodyMatch[1] ?? '';

        echo "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n";
        echo $headContent;
        echo "\n</head>\n<body>\n";
        
        // Injeta a variável global de autenticação
        echo "<script>\n";
        echo "window.MURIKA_AUTH_BOOTSTRAP = " . json_encode($authBootstrap, $jsonScriptFlags) . ";\n";
        echo "window.MURIKA_AUTH_USER = " . json_encode($authBootstrap['user'] ?? null, $jsonScriptFlags) . ";\n";
        echo "window.MURIKA_AUTH_STATUS = " . json_encode($authBootstrap['status'] ?? 'anonymous', $jsonScriptFlags) . ";\n";
        echo "window.MURIKA_IS_ADMIN = " . json_encode($authBootstrap['isAdmin'] ?? false, $jsonScriptFlags) . ";\n";
        echo "window.MURIKA_CSRF_TOKEN = " . json_encode($authBootstrap['csrfToken'] ?? '', $jsonScriptFlags) . ";\n";
        echo "window.MURIKA_SESSION_TIMEOUT = " . json_encode($authBootstrap['sessionTimeoutSeconds'] ?? 43200, $jsonScriptFlags) . ";\n";
        echo "window.MURIKA_BASE_URL = " . json_encode(BASE_URL, $jsonScriptFlags) . ";\n";
        echo "window.MURIKA_PAGE_MODE = " . json_encode($pageMode, $jsonScriptFlags) . ";\n";
        echo "</script>\n";

        echo $bodyContent;
        echo "\n</body>\n</html>";
        return;
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MURIKA - Gest&atilde;o de Hotel</title>
</head>
<body>
    <div style="font-family: sans-serif; padding: 2rem;">
        Erro ao carregar o frontend compilado. Execute <code>npm run build</code> em <code>frontend/</code>.
    </div>
</body>
</html>
