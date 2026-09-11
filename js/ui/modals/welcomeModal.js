/**
 * WELCOMEMODAL.JS - OBSOLETO / DESATIVADO
 * 
 * O ecrã de boas-vindas foi completamente removido da aplicação.
 * As funções exportadas são preservadas como no-ops seguros para manter
 * compatibilidade retroativa e integridade da cache do Service Worker.
 */

export const WELCOME_STORAGE_KEY = 'yisrael_welcome_last_shown';
export const WELCOME_INTERVAL_MS = 90 * 24 * 60 * 60 * 1000;

export function shouldShowWelcomeModal() {
    return false;
}

export function recordWelcomeModalShown() {}

export function showWelcomeHome() {}

export function dismissWelcomeHome() {}

export const openWelcomeModal = () => {};
export const closeWelcomeModal = () => {};

export function initWelcomeModal() {}

export function checkAndShowWelcomeModal() {}



