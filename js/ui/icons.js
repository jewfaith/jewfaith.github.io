export function getEventIcon(category, name) {
    if (name) {
        const cleanName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        if (cleanName.includes('hanukkah')) return '<i class="fa-solid fa-menorah"></i>';
        if (cleanName.includes('purim')) return '<i class="fa-solid fa-mask"></i>';
        if (cleanName.includes('tammuz')) return '<i class="fa-solid fa-burst"></i>';
        if (cleanName.includes('tisha')) return '<i class="fa-solid fa-fire"></i>';
        if (cleanName.includes('gedaliah')) return '<i class="fa-solid fa-user-slash"></i>';
        if (cleanName.includes('tevet')) return '<i class="fa-solid fa-shield-halved"></i>';
    }
    switch (category) {
        case 'parashat': return '<i class="fa-solid fa-leaf"></i>';
        case 'pesach': return '<i class="fa-solid fa-person-walking-luggage"></i>';
        case 'matzot': return '<i class="fa-solid fa-bread-slice"></i>';
        case 'shavuot': return '<i class="fa-solid fa-seedling"></i>';
        case 'roshhashana': return '<i class="fa-solid fa-bell"></i>';
        case 'yomkippur': return '<i class="fa-solid fa-hourglass-half"></i>';
        case 'sukkot': return '<i class="fa-solid fa-house-chimney"></i>';
        case 'sheminiatzeret': return '<i class="fa-solid fa-circle-notch"></i>';
        case 'simchattorah': return '<i class="fa-solid fa-book-open"></i>';
        case 'roshchodesh': return '<i class="fa-solid fa-moon"></i>';
        case 'omer': return '<i class="fa-solid fa-wheat-awn"></i>';
        default: return '<i class="fa-solid fa-star-of-david"></i>';
    }
}
