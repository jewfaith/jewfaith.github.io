export function getEventIcon(category, name, styleAttr = "color: var(--accent-color); font-size: 14px;") {
    const style = styleAttr ? ` style="${styleAttr}"` : '';
    const cat = (category || '').toLowerCase().replace(/[\s_-]/g, '');
    const nm = (name || '').toLowerCase();

    // 1. Festas Maiores / Bíblicas (Checagens Específicas)
    if (cat === 'pesach' || nm.includes('pessach') || nm.includes('pesach')) return `<i class="fa-solid fa-suitcase-rolling"${style}></i>`;
    if (cat === 'matzot' || nm.includes('matzot')) return `<i class="fa-solid fa-bread-slice"${style}></i>`;
    if (cat === 'shavuot' || nm.includes('shavuot')) return `<i class="fa-solid fa-seedling"${style}></i>`;
    if (cat === 'yomteruah' || nm.includes('teruah')) return `<i class="fa-solid fa-bell"${style}></i>`;
    if (cat === 'yomkippur' || nm.includes('kippur')) return `<i class="fa-solid fa-hands-praying"${style}></i>`;
    if (cat === 'sukkot' || nm.includes('sukkot')) return `<i class="fa-solid fa-house-chimney"${style}></i>`;
    if (cat === 'sheminiatzeret' || cat === 'shmini' || nm.includes('shemini') || nm.includes('shmini') || nm.includes('atzeret')) return `<i class="fa-solid fa-people-group"${style}></i>`;

    // 2. Contagem e Calendário
    if (cat === 'omer' || nm.includes('omer')) return `<i class="fa-solid fa-wheat-awn"${style}></i>`;
    if (cat === 'roshchodesh' || nm.includes('rosh chodesh') || nm.includes('rosh chodashim')) return `<i class="fa-solid fa-moon"${style}></i>`;

    // 3. Leituras Semanais e Shabbat
    if (cat === 'parashat' || nm.includes('shabbat')) return `<i class="fa-solid fa-leaf"${style}></i>`;
    return `<i class="fa-solid fa-star-of-david"${style}></i>`;
}
