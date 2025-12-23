const translations = {
    pt: {
        "app.title": "Luz do Tempo",
        "meta.description": "Dashboard de calendário judaico com horários de Shabat, Parashat e festividades",
        "search.placeholder": "Pesquisar...",
        "loading.text": "Sincronizando...",
        "error.title": "Ops deu errado!",
        "error.generic": "Erro ao carregar dados",
        "btn.retry": "Tentar Novamente",
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
        "msg.loading": "Carregando...",
        "msg.no_holidays": "Nenhuma festividade próxima",
        "msg.check_calendar": "Consulte o calendário completo",
        "msg.no_holiday_today": "Sem Festividade",
        "msg.ordinary_day": "Dia Comum",
        "status.location_selected": "Local Selecionado",
        "status.location_gps": "Local GPS",
        "status.unknown_location": "Local Desconhecido",
        "status.check_sefer": "Verificar Sefer"
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
