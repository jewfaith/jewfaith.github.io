export function getEventIcon(category, name, styleAttr = "color: var(--accent-color); font-size: 14px;") {
    const style = styleAttr ? ` style="${styleAttr}"` : '';
    const cat = (category || '').toLowerCase().replace(/[\s_-]/g, '');
    const nm = (name || '').toLowerCase();

    if (cat === 'parashat' || nm.includes('shabbat')) return `<i class="fa-solid fa-leaf"${style}></i>`;
    if (cat === 'pesach' || nm.includes('pessach sheni') || nm === 'yom pessach') return `<i class="fa-solid fa-person-walking-luggage"${style}></i>`;
    if (cat === 'matzot' || nm.includes('matzot')) return `<i class="fa-solid fa-bread-slice"${style}></i>`;
    if (cat === 'shavuot' || nm.includes('shavuot')) return `<i class="fa-solid fa-seedling"${style}></i>`;
    if (cat === 'roshhashana' || cat === 'yomteruah' || nm.includes('teruah') || nm.includes('rosh hashana')) return `<i class="fa-solid fa-bell"${style}></i>`;
    if (cat === 'yomkippur' || nm.includes('kippur')) return `<i class="fa-solid fa-person-praying"${style}></i>`;
    if (cat === 'sukkot' || nm.includes('sukkot')) return `<i class="fa-solid fa-house-chimney"${style}></i>`;
    if (cat === 'sheminiatzeret' || cat === 'shminiatzeret' || nm.includes('shemini') || nm.includes('shmini') || nm.includes('atzeret')) return `<i class="fa-solid fa-people-group"${style}></i>`;
    if (cat === 'simchattorah' || nm.includes('simchat torah')) return `<i class="fa-solid fa-scroll"${style}></i>`;
    if (cat === 'roshchodesh' || nm.includes('rosh chodesh')) return `<i class="fa-solid fa-moon"${style}></i>`;
    if (cat === 'omer' || nm.includes('omer')) return `<i class="fa-solid fa-wheat-awn"${style}></i>`;

    return `<i class="fa-solid fa-star-of-david"${style}></i>`;
}
