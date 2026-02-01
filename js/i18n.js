const translations = {
    pt: {
        "search.placeholder": "Pesquisar...",
        "loading.text": "Sincronizando...",
        "error.title": "Algo não correu bem...",
        "error.generic": "Não conseguimos carregar as informações.",
        "btn.retry": "Tentar de Novo",
        "label.location": "Local Atual",
        "label.sunset": "Sol Poente",
        "label.parashah": "Porção Semanal",
        "label.hebrew_date": "Data Hebraica",
        "desc.location": "Posição Geográfica",
        "label.shabbat_in": "Repouso Santo",
        "label.next_holiday": "Próxima Festa",
        "desc.next_holiday": "Próxima Ocorrência",
        "label.current_holiday": "Festa Atual",
        "label.prophets": "Olhar Profético",
        "label.torah": "Leitura Biblica",
        "desc.current_holiday": "Momento Litúrgico",
        "desc.countdown": "Contagem Regressiva",
        "desc.sunset": "Ocaso Solar",
        "desc.hebrew_date": "Tempo Lunisolar",
        "desc.parashah": "Ciclo Anual",
        "desc.torah": "Lei Escrita",
        "desc.haftarah": "Lição Anexa",
        "msg.loading": "A preparar tudo...",
        "msg.no_holidays": "Nenhuma festividade próxima",
        "msg.check_calendar": "Consulte o tempo completo",
        "msg.no_holiday_today": "Sem Festividade",
        "msg.shabbat": "Shabbat",
        "msg.shabbat_shalom": "Shabbat Shalom",
        "msg.sep_torah": " - ",
        "msg.sep_haftarah": " + ",
        "status.unknown_location": "Onde estás?",
        "status.check_sefer": "Verificar Sefer",
        "err.gps_denied": "Precisamos da tua permissão para saber onde estás e mostrar o horário certo.",
        "err.gps_unavailable": "Não conseguimos encontrar a tua localização agora.",
        "err.gps_timeout": "A busca pela localização demorou demasiado.",
        "err.gps_generic": "Não conseguimos saber onde estás.",
        "err.search_empty": "Escreve o nome de uma cidade para pesquisar!",
        "err.city_not_found": "Não encontrámos essa cidade. Verifica o nome!",
        "err.network": "Parece que estás sem conexão. Verifica o Wi-Fi!",
        "err.generic_retry": "Algo falhou. Tenta outra vez!",
        "err.generic_reload": "Aconteceu algo inesperado. Recarrega a página!",
        "err.service_unavailable": "O serviço está a descansar um pouco. Tenta daqui a segundos!"
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
            if (el.tagName === 'INPUT') {
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
