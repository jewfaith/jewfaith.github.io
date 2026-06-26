export function getEventIcon(category, name) {
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
