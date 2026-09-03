/**
 * ICONS.JS - CENTRAL DE ÍCONES DA APLICAÇÃO YISRAEL DATE
 * TODOS os ícones do sistema são exclusivamente definidos e exportados deste ficheiro.
 */

export const ICONS = {
    // 1. Navegação Principal & Abas
    house: 'fa-solid fa-house',
    menorah: 'fa-solid fa-menorah',
    privacy: 'fa-solid fa-shield-halved',
    chat: 'fa-solid fa-comments',
    account: 'fa-solid fa-circle-user',

    // 2. Controles, Ações & Modais
    location: 'fa-solid fa-location-dot',
    locationDot: 'fa-solid fa-location-dot',
    themeDark: 'fa-solid fa-circle-half-stroke',
    close: 'fa-solid fa-xmark',
    chevronRight: 'fa-solid fa-chevron-right',
    chevronLeft: 'fa-solid fa-chevron-left',
    trash: 'fa-solid fa-trash-can',
    search: 'fa-solid fa-magnifying-glass',
    check: 'fa-solid fa-check',
    lightbulb: 'fa-solid fa-lightbulb',
    sliders: 'fa-solid fa-sliders',
    rotateLeft: 'fa-solid fa-rotate-left',
    rotateRight: 'fa-solid fa-rotate-right',
    swap: 'fa-solid fa-arrow-right-arrow-left',
    spinner: 'fa-solid fa-circle-notch fa-spin',
    crosshairs: 'fa-solid fa-crosshairs',
    star: 'fa-solid fa-star',
    crown: 'fa-solid fa-crown',
    pcDrawer: 'fa-solid fa-layer-group',

    // 3. Leituras Bíblicas & Estudo Sagrado
    calendarDay: 'fa-solid fa-calendar-day',
    scroll: 'fa-solid fa-scroll',
    torah: 'fa-solid fa-book-open',
    haftara: 'fa-solid fa-feather-pointed',
    ketuvim: 'fa-solid fa-book-bookmark',
    bookOpen: 'fa-solid fa-book-open',

    // 4. Arcos Celestiais & Zmanim
    sun: 'fa-solid fa-sun',
    moon: 'fa-solid fa-moon',
    sunrise: 'fa-solid fa-sun-plant-wilt',
    cloudSun: 'fa-solid fa-cloud-sun',
    cloudMoon: 'fa-solid fa-cloud-moon',
    clock: 'fa-solid fa-clock',
    hourglass: 'fa-solid fa-hourglass-half',
    compass: 'fa-solid fa-compass',
    bell: 'fa-solid fa-bell',

    // 6. Festas & Símbolos Sagrados de Israel
    starOfDavid: 'fa-solid fa-star-of-david',
    candles: 'fa-solid fa-fire-flame-curved',
    wineGlass: 'fa-solid fa-wine-glass',
    breadSlice: 'fa-solid fa-bread-slice',
    seedling: 'fa-solid fa-seedling',
    bullhorn: 'fa-solid fa-bullhorn',
    handsPraying: 'fa-solid fa-hands-praying',
    campground: 'fa-solid fa-campground',
    peopleGroup: 'fa-solid fa-people-group',
    wheatAwn: 'fa-solid fa-wheat-awn',
    scale: 'fa-solid fa-scale-balanced'
};

/**
 * Retorna a classe FontAwesome para uma chave de ícone
 */
export function getIconClass(key) {
    if (!key) return ICONS.starOfDavid;
    return ICONS[key] || ICONS.starOfDavid;
}

/**
 * Retorna o ícone representativo de um evento / festa judaica
 */
export function getEventIcon(category, name, styleAttr = "color: var(--accent-color); font-size: 14px;") {
    const style = styleAttr ? ` style="${styleAttr}"` : '';
    const cat = (category || '').toLowerCase().replace(/[\s_-]/g, '');
    const nm = (name || '').toLowerCase();

    // 1. Leituras Semanais e Shabbat (incluindo Shabbatot especiais)
    if (cat === 'parashat' || nm.includes('parasha')) {
        return `<i class="${ICONS.scroll}" data-icon="scroll"${style}></i>`;
    }
    if (nm.includes('shabbat')) {
        return `<i class="${ICONS.candles}" data-icon="candles"${style}></i>`;
    }

    // 2. Festas Maiores & Bíblicas da Torá
    if (cat === 'pesach' || nm.includes('pessach') || nm.includes('pesach')) return `<i class="${ICONS.wineGlass}" data-icon="wineGlass"${style}></i>`;
    if (cat === 'matzot' || nm.includes('matzot')) return `<i class="${ICONS.breadSlice}" data-icon="breadSlice"${style}></i>`;
    if (cat === 'shavuot' || nm.includes('shavuot')) return `<i class="${ICONS.seedling}" data-icon="seedling"${style}></i>`;
    if (cat === 'yomteruah' || nm.includes('teruah')) return `<i class="${ICONS.bullhorn}" data-icon="bullhorn"${style}></i>`;
    if (cat === 'yomkippur' || nm.includes('kippur')) return `<i class="${ICONS.handsPraying}" data-icon="handsPraying"${style}></i>`;
    if (cat === 'sukkot' || nm.includes('sukkot')) return `<i class="${ICONS.campground}" data-icon="campground"${style}></i>`;
    if (cat === 'sheminiatzeret' || cat === 'shmini' || nm.includes('shemini') || nm.includes('shmini') || nm.includes('atzeret')) return `<i class="${ICONS.peopleGroup}" data-icon="peopleGroup"${style}></i>`;
    if (cat === 'roshchodesh' || nm.includes('rosh chodesh') || nm.includes('rosh chodashim')) return `<i class="${ICONS.moon}" data-icon="moon"${style}></i>`;
    if (nm.includes('sheny') || nm.includes('sheni')) return `<i class="${ICONS.rotateRight}" data-icon="rotateRight"${style}></i>`;
    if (cat === 'omer' || nm.includes('omer')) return `<i class="${ICONS.wheatAwn}" data-icon="wheatAwn"${style}></i>`;

    // 3. Toda festa rabínica só tem a Magen David (Estrela de David)
    return `<i class="${ICONS.starOfDavid}" data-icon="starOfDavid"${style}></i>`;
}

/**
 * Aplica os ícones oficiais de icons.js a todos os nós do DOM com data-icon
 */
export function applyIconsToDOM(root = document) {
    if (!root || !root.querySelectorAll) return;
    const elements = root.querySelectorAll('[data-icon]');
    elements.forEach(el => {
        const iconKey = el.getAttribute('data-icon');
        const iconClass = getIconClass(iconKey);
        if (iconClass) {
            const extraClasses = Array.from(el.classList).filter(c => !c.startsWith('fa-'));
            const targetClass = `${iconClass} ${extraClasses.join(' ')}`.trim();
            if (el.className !== targetClass) {
                el.className = targetClass;
            }
        }
    });
}

