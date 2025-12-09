/**
 * Sistema de Logout Automático por Turno
 * Sincronizado com horário do servidor (Porto Velho)
 */

document.addEventListener('DOMContentLoaded', function() {
    startShiftTimer();
});

let shiftWarningClosed = false; // Flag para controlar fechamento manual

function startShiftTimer() {
    // 1. Obter hora do servidor injetada no HTML (timestamp em segundos)
    if (typeof window.SERVER_TIME_NOW === 'undefined') {
        console.error('SERVER_TIME_NOW não definido. Logout automático desativado.');
        return;
    }

    const serverTimeMs = window.SERVER_TIME_NOW * 1000;
    const clientTimeMs = new Date().getTime();
    const timeOffset = clientTimeMs - serverTimeMs;

    console.log('⏰ Shift Timer Iniciado. Offset cliente-servidor:', timeOffset, 'ms');

    const SHIFT_CHANGES = [6, 18]; 
    const WARNING_MINUTES = 5; // Aviso 5 min antes

    let warningBadge = document.getElementById('shift-warning-badge');
    if (!warningBadge) {
        warningBadge = createWarningBadge();
    }

    setInterval(() => {
        const now = new Date(new Date().getTime() - timeOffset);
        
        // FORÇAR Fuso Horário Porto Velho (UTC-4)
        // Se usar now.getHours(), pega o fuso do navegador (que pode estar errado)
        // Vamos calcular a hora em PV baseada no UTC
        const pvOffset = -4; 
        const pvHours = (now.getUTCHours() + pvOffset + 24) % 24;
        
        let nextShiftHour = SHIFT_CHANGES.find(h => h > pvHours);
        if (!nextShiftHour) {
            nextShiftHour = SHIFT_CHANGES[0];
        }
        
        // Criar data alvo em UTC para comparação precisa
        // Precisamos saber "quando" será 18:00 (ou 06:00) UTC-4 em timestamp
        // 18:00 PV = 22:00 UTC
        // 06:00 PV = 10:00 UTC
        
        let targetUtcHour = nextShiftHour - pvOffset; // ex: 18 - (-4) = 22
        if (targetUtcHour >= 24) targetUtcHour -= 24;

        const targetDate = new Date(now);
        targetDate.setUTCHours(targetUtcHour, 0, 0, 0); 

        // Se o alvo já passou (ex: agora é 23:00 UTC [19:00 PV], alvo era 22:00 UTC [18:00 PV])
        // Mas o find acima já pegaria o próximo (06:00 -> 10:00 UTC)
        // Só precisa ajustar o dia
        if (targetDate < now) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        const diffMs = targetDate - now; // Diferença em milissegundos reais
        const diffMinutes = diffMs / 1000 / 60;

        // DEBUG
        // console.log(`Diff: ${diffMinutes.toFixed(2)} min | Target: ${nextShiftHour}:00`);

        if (diffMinutes <= 0 && diffMinutes > -1) {
            console.warn('🕒 Fim de turno! Realizando logout...');
            window.location.href = '/logout?msg=turno_encerrado';
        } else if (diffMinutes <= WARNING_MINUTES && !shiftWarningClosed) {
            showWarning(warningBadge, nextShiftHour);
        } else {
            // Se passar para fora da zona de aviso (ex: turno mudou), reseta flag
            if (diffMinutes > WARNING_MINUTES) {
                shiftWarningClosed = false;
            }
            hideWarning(warningBadge);
        }

    }, 1000);
}

function createWarningBadge() {
    const badge = document.createElement('div');
    badge.id = 'shift-warning-badge';
    badge.style.position = 'fixed';
    badge.style.top = '70px';
    badge.style.right = '20px';
    badge.style.zIndex = '9999';
    badge.style.display = 'none';
    badge.className = 'alert alert-warning shadow-lg border-2 border-warning';
    
    // Adicionar botão de fechar
    // Usando estrutura flex simples
    badge.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-clock fa-2x me-3"></i>
            <div class="flex-grow-1 pe-3">
                <h5 class="alert-heading m-0 fw-bold">Fim de Turno</h5>
                <p class="mb-0">O turno será encerrado às <strong id="shift-target-time">--:00</strong></p>
                <p class="mb-0">Você será redirecionado para a tela de login.</p>
            </div>
            <button type="button" class="btn-close" aria-label="Close" onclick="closeShiftWarning()"></button>
        </div>
    `;
    document.body.appendChild(badge);
    return badge;
}

function showWarning(badge, hour) {
    if (badge.style.display !== 'block') {
        badge.style.display = 'block';
        badge.classList.add('animate__animated', 'animate__fadeInRight');
    }
    
    const timeString = `${String(hour).padStart(2, '0')}:00`;
    const targetEl = badge.querySelector('#shift-target-time');
    if (targetEl) targetEl.textContent = timeString;
}

function hideWarning(badge) {
    if (badge.style.display !== 'none') {
        badge.style.display = 'none';
    }
}

// Global function para o onclick
window.closeShiftWarning = function() {
    const badge = document.getElementById('shift-warning-badge');
    if (badge) {
        shiftWarningClosed = true; // Impede reabertura imediata
        badge.style.display = 'none';
    }
};
