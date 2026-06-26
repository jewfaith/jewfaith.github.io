export const BOOK_MAP = {
    'Genesis': 'Bereshit',
    'Exodus': 'Shemot',
    'Leviticus': 'Vayikra',
    'Numbers': 'Bamidbar',
    'Deuteronomy': 'Devarim',
    'Joshua': 'Yehoshua',
    'Judges': 'Shoftim',
    'II Samuel': 'II Shmuel',
    'I Samuel': 'I Shmuel',
    '2 Samuel': 'II Shmuel',
    '1 Samuel': 'I Shmuel',
    'II Kings': 'II Melachim',
    'I Kings': 'I Melachim',
    '2 Kings': 'II Melachim',
    '1 Kings': 'I Melachim',
    'Isaiah': 'Yeshayahu',
    'Jeremiah': 'Yirmiyahu',
    'Ezekiel': 'Yechezkel',
    'Hosea': 'Hoshea',
    'Joel': 'Yoel',
    'Amos': 'Amos',
    'Obadiah': 'Ovadia',
    'Jonah': 'Yona',
    'Micah': 'Micha',
    'Nahum': 'Nachum',
    'Habakkuk': 'Chavakuk',
    'Zephaniah': 'Tzefania',
    'Haggai': 'Chagai',
    'Zechariah': 'Zecharia',
    'Malachi': 'Malachi'
};

export const FESTIVAL_CATS = [
    'pesach', 'matzot', 'shavuot', 'roshhashana', 'yomkippur',
    'sukkot', 'sheminiatzeret', 'simchattorah'
];

export const FESTIVAL_TORAH_READINGS = {
    'pesach': ['Shemot 12:21-51'],       // 14 Nissan – korban Pessach
    'matzot': [
        'Shemot 12:21-51',        // Dia 1 – 15 Nissan
        'Vayikra 22:26-23:44',    // Dia 2 – 16 Nissan
        'Bamidbar 28:19-25',      // Dia 3 – Chol HaMoed 1
        'Bamidbar 28:19-25',      // Dia 4 – Chol HaMoed 2
        'Bamidbar 28:19-25',      // Dia 5 – Chol HaMoed 3
        'Bamidbar 28:19-25',      // Dia 6 – Chol HaMoed 4
        'Shemot 13:17-15:26',     // Dia 7 – Shvi\\'i shel Pessach
        'Devarim 15:19 - 16:17'   // Dia 8 – Acharon shel Pessach
    ],
    'shavuot': [
        'Shemot 19:1-20:23',
        'Devarim 15:19 - 16:17'
    ],
    'roshhashana': [
        'Bereshit 21:1-34',
        'Bereshit 22:1-24'
    ],
    'yomkippur': ['Vayikra 16:1-34'],
    'sukkot': [
        'Vayikra 22:26-23:44',    // Dia 1
        'Vayikra 22:26-23:44',    // Dia 2
        'Bamidbar 29:17-22',      // Dia 3 – Chol HaMoed 1
        'Bamidbar 29:20-25',      // Dia 4 – Chol HaMoed 2
        'Bamidbar 29:23-28',      // Dia 5 – Chol HaMoed 3
        'Bamidbar 29:26-31',      // Dia 6 – Chol HaMoed 4
        'Bamidbar 29:26-34',      // Dia 7 – Hoshana Raba
    ],
    'sheminiatzeret': [
        'Devarim 14:22 - 16:17',
        'Devarim 33:1 - 34:12'
    ],
};

export const FESTIVAL_HAFTARA_READINGS = {
    'pesach': ['Yehoshua 5:2 - 6:1'],    // 14 Nissan
    'matzot': [
        'Yehoshua 5:2 - 6:1',          // Dia 1 – 15 Nissan
        'II Melachim 23:1-9,21-25',    // Dia 2 – 16 Nissan
        'Yechezkel 37:1-14',            // Dia 3 – Chol HaMoed 1
        'Yechezkel 37:1-14',            // Dia 4 – Chol HaMoed 2
        'Yechezkel 37:1-14',            // Dia 5 – Chol HaMoed 3
        'Yechezkel 37:1-14',            // Dia 6 – Chol HaMoed 4
        'II Shmuel 22:1-51',            // Dia 7 – Shvi\\'i shel Pessach
        'Yeshayahu 10:32 - 12:6',       // Dia 8 – Acharon shel Pessach
    ],
    'shavuot': [
        'Yechezkel 1:1-28, 3:12',
        'Chavakuk 2:20 - 3:19'
    ],
    'roshhashana': [
        'I Shmuel 1:1-2:10',
        'Yirmiyahu 31:1-19'
    ],
    'yomkippur': ['Yeshayahu 57:14-58:14'],
    'sukkot': [
        'Zecharia 14:1-21',             // Dia 1
        'I Melachim 8:2-21',            // Dia 2
        'Yechezkel 38:18-39:7',       // Dia 3 – Chol HaMoed 1
        'Yechezkel 38:18-39:7',       // Dia 4 – Chol HaMoed 2
        'Yechezkel 38:18-39:7',       // Dia 5 – Chol HaMoed 3
        'Yechezkel 38:18-39:7',       // Dia 6 – Chol HaMoed 4
        'Yechezkel 38:18-39:7',       // Dia 7 – Hoshana Raba
    ],
    'sheminiatzeret': [
        'I Melachim 8:54-66',
        'Yehoshua 1:1-18'
    ],
};

export const KETUVIM_BOOKS = [
    { name: 'Tehilim', chapters: 150, weight: 67 },
    { name: 'Mishlei', chapters: 31, weight: 15 },
    { name: 'Iyov', chapters: 42, weight: 5 },
    { name: 'Kohelet', chapters: 12, weight: 4 },
    { name: 'Ruth', chapters: 4, weight: 2 },
    { name: 'Esther', chapters: 10, weight: 2 },
    { name: 'Daniel', chapters: 12, weight: 3 },
    { name: 'Ezra', chapters: 10, weight: 1 },
    { name: 'Nechemia', chapters: 13, weight: 1 }
];
export const KETUVIM_TOTAL_WEIGHT = KETUVIM_BOOKS.reduce((sum, b) => sum + b.weight, 0);

export const FESTIVAL_TEHILIM = {
    shabbat: ['Tehilim 23', 'Tehilim 92', 'Mishlei 31', 'Tehilim 104', 'Mishlei 3', 'Tehilim 121', 'Mishlei 4', 'Tehilim 93', 'Mishlei 8', 'Daniel 2'],
    pesach: ['Tehilim 78', 'Tehilim 105', 'Tehilim 107', 'Tehilim 113', 'Tehilim 114', 'Tehilim 115', 'Tehilim 116', 'Tehilim 117', 'Tehilim 118', 'Tehilim 136'],
    matzot: ['Tehilim 66', 'Tehilim 77', 'Tehilim 105', 'Tehilim 106', 'Tehilim 114', 'Tehilim 115', 'Tehilim 116', 'Tehilim 117', 'Tehilim 118', 'Tehilim 136'],
    shavuot: ['Tehilim 19', 'Tehilim 42', 'Tehilim 43', 'Tehilim 68', 'Tehilim 119', 'Tehilim 147', 'Tehilim 148', 'Tehilim 149', 'Tehilim 150', 'Mishlei 8'],
    roshhashana: ['Tehilim 24', 'Tehilim 27', 'Tehilim 47', 'Tehilim 81', 'Tehilim 93', 'Tehilim 98', 'Tehilim 130', 'Tehilim 150', 'Mishlei 1', 'Mishlei 2'],
    yomkippur: ['Tehilim 25', 'Tehilim 32', 'Tehilim 51', 'Tehilim 86', 'Tehilim 103', 'Tehilim 130', 'Tehilim 139', 'Mishlei 1', 'Mishlei 3', 'Mishlei 4'],
    sukkot: ['Tehilim 27', 'Tehilim 42', 'Tehilim 43', 'Tehilim 84', 'Tehilim 113', 'Tehilim 114', 'Tehilim 115', 'Tehilim 116', 'Tehilim 117', 'Tehilim 118'],
    sheminiatzeret: ['Tehilim 8', 'Tehilim 19', 'Tehilim 104', 'Tehilim 119', 'Tehilim 147', 'Tehilim 148', 'Tehilim 149', 'Tehilim 150', 'Mishlei 3', 'Mishlei 8']
};
