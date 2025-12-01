function mostrarMensagem(elementId, mensagem, tipo) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    setTimeout(() => { el.innerHTML = ''; }, 5000);
}

// Função helper para fazer requisições seguras à API
function fetchAPI(url, options = {}) {
    const defaultOptions = {
        headers: {
            'X-Murika-Request': 'true',
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    };
    
    // Mesclar headers
    if (options.headers) {
        defaultOptions.headers = { ...defaultOptions.headers, ...options.headers };
    }
    
    // Mesclar outras opções
    const finalOptions = { ...defaultOptions, ...options };
    
    return fetch(url, finalOptions);
}