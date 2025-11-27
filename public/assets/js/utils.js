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