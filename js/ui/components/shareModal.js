/**
 * SHAREMODAL.JS - COMPONENTE DE COMPARTILHAMENTO E NOTIFICAÇÃO TOAST
 * 
 * Centraliza o compartilhamento da aplicação via Web Share API nativa (iOS/Android/macOS)
 * e fallback automático para área de transferência com toast elegante.
 */

let toastTimeout = null;
let isShareInitialized = false;

/**
 * Exibe notificação toast flutuante no topo/centro da tela.
 */
export function showShareToast(message = 'Link copiado com sucesso!') {
    let toast = document.getElementById('app-share-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-share-toast';
        toast.className = 'app-share-toast';
        toast.innerHTML = '<i class="fa-solid fa-check"></i> <span class="toast-msg"></span>';
        document.body.appendChild(toast);
    }

    const msgSpan = toast.querySelector('.toast-msg');
    if (msgSpan) msgSpan.textContent = message;

    toast.classList.add('show');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2400);
}

/**
 * Aciona compartilhamento nativo ou copia URL para a área de transferência.
 */
export async function shareAppUrl() {
    const shareUrl = (typeof window !== 'undefined' && window.location.origin && window.location.origin.startsWith('http') && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1'))
        ? (window.location.origin + window.location.pathname)
        : 'https://jewfaith.github.io';

    const shareData = {
        title: 'Yisrael Date',
        text: 'Yisrael Date — Calendário da Torá, Horários Haláchicos (Zmanim) e Festas Bíblicas',
        url: shareUrl
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
        try {
            await navigator.share(shareData);
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
        }
    }

    // Fallback: cópia direta para a área de transferência
    try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(shareUrl);
        } else if (typeof document !== 'undefined') {
            const textarea = document.createElement('textarea');
            textarea.value = shareUrl;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        showShareToast('Link copiado para a área de transferência!');
    } catch (e) {
        if (typeof prompt === 'function') {
            prompt('Copia o link do Yisrael Date:', shareUrl);
        }
    }
}

/**
 * Inicializa ouvintes de eventos para qualquer elemento com a classe .app-share-trigger.
 */
export function initShareListeners() {
    if (isShareInitialized || typeof document === 'undefined') return;
    isShareInitialized = true;

    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.app-share-trigger');
        if (trigger) {
            e.preventDefault();
            e.stopPropagation();
            shareAppUrl();
        }
    });
}
