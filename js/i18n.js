const translations = {
    pt: {
        "app.title": "Luz do Tempo",
        "meta.description": "Dashboard de calendário judaico com horários de Shabat, Parashat e festividades",
        "search.placeholder": "Pesquisar...",
        "loading.text": "Sincronizando...",
        "error.title": "Algo não correu bem...",
        "error.generic": "Não conseguimos carregar as informações.",
        "btn.retry": "Tentar de Novo",
        "label.location": "Local Atual",
        "label.shabbat_in": "Repouso Santo",
        "label.next_holiday": "Próxima Festa",
        "desc.next_holiday": "Data da Festa",
        "label.current_holiday": "Festa Atual",
        "label.prophets": "Olhar Profético",
        "label.torah": "Leitura Bíblica",
        "desc.current_holiday": "Celebração Atual",
        "desc.countdown": "Para o Shabbat",
        "desc.sunset": "Sol Poente",
        "desc.hebrew_date": "Ano Judaico",
        "desc.parashah": "Leitura da Semana",
        "desc.torah": "Porção Torá",
        "desc.haftarah": "Porção Haftará",
        "msg.loading": "A preparar tudo...",
        "msg.no_holidays": "Nenhuma festividade próxima",
        "msg.check_calendar": "Consulte o calendário completo",
        "msg.no_holiday_today": "Sem Festividade",
        "msg.ordinary_day": "Dia de rotina, tudo calmo.",
        "status.location_selected": "Local Escolhido",
        "status.location_gps": "Tua Localização",
        "status.unknown_location": "Onde estás?",
        "status.check_sefer": "Verificar Sefer",
        "share.message": "✡️ Or HaZman - Calendário Judaico Completo! Horários de Shabat, Festas e mais. Confira: ",
        "share.title": "Or HaZman - Luz do Tempo",
        "share.text": "✡️ Calendário Judaico Completo! Horários de Shabat, Festas e mais.",
        "msg.copied": "📋 Copiado! Podes colar onde quiseres.",
        "msg.copied_short": "📋 Copiado!",
        "msg.copied_item": "📋 {item} copiado!",
        "err.gps_denied": "📍 Precisamos da tua permissão para saber onde estás e mostrar o horário certo.",
        "err.gps_unavailable": "📍 Não conseguimos encontrar a tua localização agora.",
        "err.gps_timeout": "⏱️ A busca pela localização demorou demasiado.",
        "err.gps_generic": "📍 Não conseguimos saber onde estás.",
        "err.search_empty": "🔍 Escreve o nome de uma cidade para pesquisar!",
        "err.city_not_found": "🌍 Não encontrámos essa cidade. Verifica o nome!",
        "err.network": "📡 Parece que estás sem conexão. Verifica o Wi-Fi!",
        "err.generic_retry": "😅 Algo falhou. Tenta outra vez!",
        "err.generic_reload": "😅 Aconteceu algo inesperado. Recarrega a página!",
        "err.service_unavailable": "😴 O serviço está a descansar um pouco. Tenta daqui a segundos!"
    }
};

const currentLang = 'pt';

function t(key) {
    return translations.pt[key] || key;
}

function updateTexts() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations.pt[key]) {
            if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
                el.placeholder = translations.pt[key];
            } else {
                el.textContent = translations.pt[key];
            }
        }
    });
}

function updateDirection() {
    document.documentElement.lang = 'pt-PT';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateTexts();
    updateDirection();
});
