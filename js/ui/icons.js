/**
 * ICONS.JS - CENTRAL DE ÍCONES DA APLICAÇÃO YISRAEL DATE
 * TODOS os ícones do sistema são exclusivamente definidos e exportados deste ficheiro.
 */

export const ICONS = {
    // 1. Navegação Principal & Abas
    house: 'fa-solid fa-house',
    menorah: 'fa-solid fa-menorah',
    privacy: 'fa-solid fa-shield-halved',
    menu: 'fa-solid fa-bars',
    more: 'fa-solid fa-bars',
    info: 'fa-solid fa-circle-info',
    circleInfo: 'fa-solid fa-circle-info',
    'circle-info': 'fa-solid fa-circle-info',
    calendar: 'fa-solid fa-calendar-days',
    calendarDays: 'fa-solid fa-calendar-days',
    'calendar-days': 'fa-solid fa-calendar-days',
    calendarDay: 'fa-solid fa-calendar-day',
    'calendar-day': 'fa-solid fa-calendar-day',
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
    shuffle: 'fa-solid fa-shuffle',

    // 3. Leituras Bíblicas & Estudo Sagrado
    calendarDay: 'fa-solid fa-calendar-day',
    scroll: 'fa-solid fa-scroll',
    torah: 'fa-solid fa-book-open',
    book: 'fa-solid fa-book-open',
    haftara: 'fa-solid fa-feather-pointed',
    feather: 'fa-solid fa-feather-pointed',
    ketuvim: 'fa-solid fa-book-bookmark',
    bookOpen: 'fa-solid fa-book-open',
    heart: 'fa-solid fa-heart',
    flame: 'fa-solid fa-fire-flame-curved',

    // Literatura Judaica (Sefaria)
    buildingColumns: 'fa-solid fa-building-columns',
    'building-columns': 'fa-solid fa-building-columns',
    usersBetweenLines: 'fa-solid fa-users-between-lines',
    'users-between-lines': 'fa-solid fa-users-between-lines',
    gavel: 'fa-solid fa-gavel',
    gem: 'fa-solid fa-gem',
    handHoldingHeart: 'fa-solid fa-hand-holding-heart',
    'hand-holding-heart': 'fa-solid fa-hand-holding-heart',
    infinity: 'fa-solid fa-infinity',

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
export function getEventIcon(category, name, extraClass = "event-icon-accent") {
    const cls = extraClass ? ` ${extraClass}` : '';
    const cat = (category || '').toLowerCase().replace(/[\s_-]/g, '');
    const nm = (name || '').toLowerCase();

    // 1. Leituras Semanais e Shabbat (incluindo Shabbatot especiais)
    if (cat === 'parashat' || nm.includes('parasha')) {
        return `<i class="${ICONS.scroll}${cls}" data-icon="scroll"></i>`;
    }
    if (nm.includes('shabbat')) {
        return `<i class="${ICONS.candles}${cls}" data-icon="candles"></i>`;
    }

    // 2. Festas Maiores & Bíblicas da Torá
    if (cat === 'pesach' || nm.includes('pessach') || nm.includes('pesach')) return `<i class="${ICONS.wineGlass}${cls}" data-icon="wineGlass"></i>`;
    if (cat === 'matzot' || nm.includes('matzot')) return `<i class="${ICONS.breadSlice}${cls}" data-icon="breadSlice"></i>`;
    if (cat === 'shavuot' || nm.includes('shavuot')) return `<i class="${ICONS.seedling}${cls}" data-icon="seedling"></i>`;
    if (cat === 'yomteruah' || nm.includes('teruah')) return `<i class="${ICONS.bullhorn}${cls}" data-icon="bullhorn"></i>`;
    if (cat === 'yomkippur' || nm.includes('kippur')) return `<i class="${ICONS.handsPraying}${cls}" data-icon="handsPraying"></i>`;
    if (cat === 'sukkot' || nm.includes('sukkot')) return `<i class="${ICONS.campground}${cls}" data-icon="campground"></i>`;
    if (cat === 'sheminiatzeret' || cat === 'shmini' || nm.includes('shemini') || nm.includes('shmini') || nm.includes('atzeret')) return `<i class="${ICONS.peopleGroup}${cls}" data-icon="peopleGroup"></i>`;
    if (cat === 'roshchodesh' || nm.includes('rosh chodesh') || nm.includes('rosh chodashim')) return `<i class="${ICONS.moon}${cls}" data-icon="moon"></i>`;
    if (nm.includes('sheny') || nm.includes('sheni')) return `<i class="${ICONS.rotateRight}${cls}" data-icon="rotateRight"></i>`;
    if (cat === 'omer' || nm.includes('omer')) return `<i class="${ICONS.wheatAwn}${cls}" data-icon="wheatAwn"></i>`;

    // 3. Toda festa rabínica só tem a Magen David (Estrela de David)
    return `<i class="${ICONS.starOfDavid}${cls}" data-icon="starOfDavid"></i>`;
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

