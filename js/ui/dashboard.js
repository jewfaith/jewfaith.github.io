/**
 * DASHBOARD.JS - FACHADA E ORQUESTRADOR CENTRAL DO DASHBOARD
 * 
 * Centraliza e re-exporta as funcionalidades visuais da tela principal,
 * delegando para submódulos de domínio, componentes e visões, garantindo
 * 100% de retrocompatibilidade com todos os importadores existentes.
 */

export {
    formatHebrewInText,
    formatHaftaraTwoWords,
    formatCardTwoWords,
    formatTwoWordParasha,
    formatTwoWordLocation,
    formatLocationCountry,
    formatLocationCityCountry
} from '../domain/formatters.js';

export { createSkeletonCardsHTML } from './components/skeleton.js';

export {
    showDashboardSkeletons,
    updateUIBlocks,
    renderEvents,
    initUtilities
} from './views/dashboardView.js';

export {
    resetSupportRenderCache,
    renderSupportCards
} from './components/supportCard.js';

export {
    showShareToast,
    initShareListeners,
    shareAppUrl
} from './components/shareModal.js';