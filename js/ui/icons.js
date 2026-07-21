export function getEventIcon(category, name, styleAttr = "color: var(--accent-color); font-size: 14px;") {
    const style = styleAttr ? ` style="${styleAttr}"` : '';
    switch (category) {
        case 'parashat': return `<i class="fa-solid fa-leaf"${style}></i>`;
        case 'pesach': return `<i class="fa-solid fa-person-walking-luggage"${style}></i>`;
        case 'matzot': return `<i class="fa-solid fa-bread-slice"${style}></i>`;
        case 'shavuot': return `<i class="fa-solid fa-seedling"${style}></i>`;
        case 'roshhashana': return `<i class="fa-solid fa-bell"${style}></i>`;
        case 'yomkippur': return `<i class="fa-solid fa-hourglass-half"${style}></i>`;
        case 'sukkot': return `<i class="fa-solid fa-house-chimney"${style}></i>`;
        case 'sheminiatzeret': return `<i class="fa-solid fa-circle-notch"${style}></i>`;
        case 'simchattorah': return `<i class="fa-solid fa-book-open"${style}></i>`;
        case 'roshchodesh': return `<i class="fa-solid fa-moon"${style}></i>`;
        case 'omer': return `<i class="fa-solid fa-wheat-awn"${style}></i>`;
        default: return `<i class="fa-solid fa-star-of-david"${style}></i>`;
    }
}
