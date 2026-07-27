<?php
$loginMessageCode = isset($_GET['msg']) ? (string) $_GET['msg'] : '';
$loginError = isset($_GET['erro']) ? (string) $_GET['erro'] : (isset($erro) ? (string) $erro : '');

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

// ========================================================
// MODO PRODUCAO: Serve o export estático do Next.js
// ========================================================
if (file_exists($nextExportIndex)) {
    $html = file_get_contents($nextExportIndex);

    if ($html !== false && $html !== '') {
        // Extrai <head> e <body> do HTML exportado pelo Next.js
        preg_match('/<head[^>]*>([\s\S]*?)<\/head>/i', $html, $headMatch);
        preg_match('/<body[^>]*>([\s\S]*?)<\/body>/i', $html, $bodyMatch);

        $headContent = $headMatch[1] ?? '';
        $bodyContent = $bodyMatch[1] ?? '';

        echo "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n";
        echo $headContent;
        echo "\n</head>\n<body>\n";

        // Injeta variáveis globais ANTES do React hidratar
        echo "<script>\n";
        echo "window.MURIKA_BASE_URL = " . json_encode(BASE_URL, $jsonScriptFlags) . ";\n";
        echo "window.MURIKA_LOGIN_MESSAGE = " . json_encode($loginMessageCode, $jsonScriptFlags) . ";\n";
        echo "window.MURIKA_LOGIN_ERROR = " . json_encode($loginError, $jsonScriptFlags) . ";\n";
        echo "window.MURIKA_CSRF_TOKEN = " . json_encode(getCsrfToken(), $jsonScriptFlags) . ";\n";
        echo "window.MURIKA_PAGE_MODE = 'login';\n";
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
    <title>Login - MURIKA</title>
</head>
<body>
    <div style="font-family: sans-serif; padding: 2rem;">
        Erro ao carregar o frontend compilado. Execute <code>npm run build</code> em <code>frontend/</code>.
    </div>
</body>
</html>
