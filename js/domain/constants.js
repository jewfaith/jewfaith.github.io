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
    'Malachi': 'Malachi',
    'Psalms': 'Tehilim',
    'Proverbs': 'Mishlei',
    'Job': 'Iyov',
    'Song of Solomon': 'Shir HaShirim',
    'Song of Songs': 'Shir HaShirim',
    'Ruth': 'Ruth',
    'Lamentations': 'Eichah',
    'Ecclesiastes': 'Kohelet',
    'Esther': 'Esther',
    'Daniel': 'Daniel',
    'Ezra': 'Ezra',
    'Nehemiah': 'Nechemia',
    'II Chronicles': 'II Divrei Hayamim',
    'I Chronicles': 'I Divrei Hayamim',
    '2 Chronicles': 'II Divrei Hayamim',
    '1 Chronicles': 'I Divrei Hayamim',
    'Chronicles': 'Divrei Hayamim'
};

export const HEBREW_MONTHS_PT = {
    "Aviv": "Aviv",
    "Ziv": "Ziv",
    "Etanim": "Etanim",
    "Bul": "Bul",
    "Nisan": "Aviv",
    "Iyyar": "Ziv",
    "Sivan": "Sivan",
    "Tammuz": "Tamuz",
    "Av": "Av",
    "Elul": "Elul",
    "Tishrei": "Etanim",
    "Cheshvan": "Bul",
    "Kislev": "Kislev",
    "Tevet": "Tevet",
    "Sh'vat": "Shevat",
    "Shvat": "Shevat",
    "Adar I": "Adar I",
    "Adar II": "Adar II",
    "Adar": "Adar"
};

export const FESTIVAL_CATS = [
    'pesach', 'matzot', 'shavuot', 'yomteruah', 'roshhashana', 'yomkippur',
    'sukkot', 'sheminiatzeret', 'simchattorah'
];

export const FESTIVAL_TORAH_READINGS = {
    'pesach': ['Shemot 12:21-51'],
    'matzot': [
        'Shemot 12:21-51',
        'Vayikra 22:26-23:44',
        'Bamidbar 28:19-25',
        'Bamidbar 28:19-25',
        'Bamidbar 28:19-25',
        'Bamidbar 28:19-25',
        'Shemot 13:17-15:26',
        'Devarim 15:19 - 16:17'
    ],
    'shavuot': [
        'Shemot 19:1-20:23',
        'Devarim 15:19 - 16:17'
    ],
    'yomteruah': [
        'Bereshit 21:1-34',
        'Bereshit 22:1-24'
    ],
    'roshhashana': [
        'Bereshit 21:1-34',
        'Bereshit 22:1-24'
    ],
    'yomkippur': ['Vayikra 16:1-34'],
    'sukkot': [
        'Vayikra 22:26-23:44',
        'Vayikra 22:26-23:44',
        'Bamidbar 29:17-22',
        'Bamidbar 29:20-25',
        'Bamidbar 29:23-28',
        'Bamidbar 29:26-31',
        'Bamidbar 29:26-34',
    ],
    'sheminiatzeret': [
        'Devarim 14:22 - 16:17',
        'Devarim 33:1 - 34:12'
    ],
};

export const FESTIVAL_HAFTARA_READINGS = {
    'pesach': ['Yehoshua 5:2 - 6:1'],
    'matzot': [
        'Yehoshua 5:2 - 6:1',
        'II Melachim 23:1-9,21-25',
        'Yechezkel 37:1-14',
        'Yechezkel 37:1-14',
        'Yechezkel 37:1-14',
        'Yechezkel 37:1-14',
        'II Shmuel 22:1-51',
        'Yeshayahu 10:32 - 12:6',
    ],
    'shavuot': [
        'Yechezkel 1:1-28, 3:12',
        'Chavakuk 2:20 - 3:19'
    ],
    'yomteruah': [
        'I Shmuel 1:1-2:10',
        'Yirmiyahu 31:1-19'
    ],
    'roshhashana': [
        'I Shmuel 1:1-2:10',
        'Yirmiyahu 31:1-19'
    ],
    'yomkippur': ['Yeshayahu 57:14-58:14'],
    'sukkot': [
        'Zecharia 14:1-21',
        'I Melachim 8:2-21',
        'Yechezkel 38:18-39:7',
        'Yechezkel 38:18-39:7',
        'Yechezkel 38:18-39:7',
        'Yechezkel 38:18-39:7',
        'Yechezkel 38:18-39:7',
    ],
    'sheminiatzeret': [
        'I Melachim 8:54-66',
        'Yehoshua 1:1-18'
    ],
};

export const KETUVIM_BOOKS = [
    { name: 'Tehilim', chapters: 150, weight: 41 },
    { name: 'Mishlei', chapters: 31, weight: 9 },
    { name: 'Iyov', chapters: 42, weight: 12 },
    { name: 'Shir HaShirim', chapters: 8, weight: 2 },
    { name: 'Ruth', chapters: 4, weight: 1 },
    { name: 'Eichah', chapters: 5, weight: 1 },
    { name: 'Kohelet', chapters: 12, weight: 3 },
    { name: 'Esther', chapters: 10, weight: 3 },
    { name: 'Daniel', chapters: 12, weight: 3 },
    { name: 'Ezra', chapters: 10, weight: 3 },
    { name: 'Nechemia', chapters: 13, weight: 4 },
    { name: 'Divrei Hayamim', chapters: 65, weight: 18 }
];
export const KETUVIM_TOTAL_WEIGHT = KETUVIM_BOOKS.reduce((sum, b) => sum + b.weight, 0);

export const FESTIVAL_TEHILIM = {
    shabbat: ['Tehilim 23', 'Tehilim 92', 'Tehilim 104', 'Tehilim 93'],
    pesach: ['Tehilim 78', 'Tehilim 105', 'Tehilim 107', 'Tehilim 113', 'Tehilim 114', 'Tehilim 115', 'Tehilim 116', 'Tehilim 117', 'Tehilim 118', 'Tehilim 136'],
    matzot: ['Tehilim 66', 'Tehilim 77', 'Tehilim 105', 'Tehilim 106', 'Tehilim 114', 'Tehilim 115', 'Tehilim 116', 'Tehilim 117', 'Tehilim 118'],
    shavuot: ['Tehilim 19', 'Tehilim 68', 'Tehilim 119'],
    roshchodesh: ['Tehilim 81', 'Tehilim 104', 'Tehilim 121', 'Tehilim 150'],
    yomteruah: ['Tehilim 24', 'Tehilim 27', 'Tehilim 47', 'Tehilim 81', 'Tehilim 93', 'Tehilim 98', 'Tehilim 130'],
    roshhashana: ['Tehilim 24', 'Tehilim 27', 'Tehilim 47', 'Tehilim 81', 'Tehilim 93', 'Tehilim 98', 'Tehilim 130'],
    yomkippur: ['Tehilim 25', 'Tehilim 32', 'Tehilim 51', 'Tehilim 86', 'Tehilim 103', 'Tehilim 130'],
    sukkot: ['Tehilim 27', 'Tehilim 42', 'Tehilim 43', 'Tehilim 84', 'Tehilim 113', 'Tehilim 114', 'Tehilim 115', 'Tehilim 116', 'Tehilim 117', 'Tehilim 118'],
    sheminiatzeret: ['Tehilim 8', 'Tehilim 19', 'Tehilim 104', 'Tehilim 119']
};

export const FESTIVAL_TEHILIM_NUMBERS = [
    ...new Set(
        Object.values(FESTIVAL_TEHILIM)
            .flat()
            .map(name => Number(name.replace('Tehilim ', '')))
            .filter(Number.isInteger)
    )
];

const FESTIVAL_TEHILIM_EXCLUDED_NUMBERS = new Set(
    FESTIVAL_TEHILIM_NUMBERS
        .flatMap(number => [number - 1, number, number + 1])
        .filter(number => number >= 1 && number <= 150)
);

export const AVAILABLE_TEHILIM = Array.from({ length: 150 }, (_, i) => i + 1)
    .filter(chapter => !FESTIVAL_TEHILIM_EXCLUDED_NUMBERS.has(chapter));

import { 
    FESTIVAL_DESCRIPTIONS as CANONICAL_FESTIVAL_DESCRIPTIONS,
    getFestivalDescription
} from './festivalDescriptions.js';

/**
 * Objeto canónico de descrições das festividades.
 * Disponível 100% de forma síncrona e instantânea desde o arranque do sistema.
 */
export const FESTIVAL_DESCRIPTIONS = CANONICAL_FESTIVAL_DESCRIPTIONS;
export { getFestivalDescription };

export function loadFestivalDescriptions() {
    return Promise.resolve(FESTIVAL_DESCRIPTIONS);
}



export const FESTIVAL_NAME_MAPPINGS = {
    'Rosh Chodashim': 'Rosh Chodashim',
    'Yom Pessach': 'Yom Pessach',
    'Passover': 'Yom Pessach',
    'Pesach': 'Yom Pessach',
    'Chag Matzot': 'Chag Matzot',
    'Matzot': 'Chag Matzot',
    'Unleavened Bread': 'Chag Matzot',
    'Pessach Sheni': 'Pessach Sheni',
    'Yom Shavuot': 'Yom Shavuot',
    'Shavuot': 'Yom Shavuot',
    'Pentecost': 'Yom Shavuot',
    'Yom Teruah': 'Yom Teruah',
    "Yom Teru'ah": 'Yom Teruah',
    'Rosh Hashana': 'Rosh Hashana',
    'Rosh Hashanah': 'Rosh Hashana',
    'Rosh Hashana LaBehemot': 'Rosh Hashana LaBehemot',
    'Rosh Hashanah LaBehemot': 'Rosh Hashana LaBehemot',
    'Rosh LaBehemot': 'Rosh Hashana LaBehemot',
    'Yom Kippur': 'Yom Kippur',
    'Kippur': 'Yom Kippur',
    'Chag Sukkot': 'Chag Sukkot',
    'Sukkot': 'Chag Sukkot',
    'Tabernacles': 'Chag Sukkot',
    'Hoshana Rabbah': 'Hoshana Rabbah',
    'Hoshana Raba': 'Hoshana Rabbah',
    'Shemini Atzeret': 'Shemini Atzeret',
    'Simchat Torah': 'Simchat Torah',
    'Chag Hanukkah': 'Chag Hanukkah',
    'Hanukkah': 'Chag Hanukkah',
    'Chanukah': 'Chag Hanukkah',
    'Tu BiShvat': 'Tu BiShvat',
    "Tu B'Shevat": 'Tu BiShvat',
    'Tu Bishevat': 'Tu BiShvat',
    'Tu Bishvat': 'Tu BiShvat',
    "Tu B'Av": "Tu B'Av",
    'Lag BaOmer': 'Lag BaOmer',
    'Leil Selichot': 'Leil Selichot',
    'Elul': 'Elul',
    'Mes de Elul': 'Elul',
    'Mês de Elul': 'Elul',
    'Yom Purim': 'Yom Purim',
    'Purim': 'Yom Purim',
    'Shushan Purim': 'Shushan Purim',
    'Purim Katan': 'Purim Katan',
    'Shushan Purim Katan': 'Shushan Purim Katan',
    "Ta'anit Esther": "Ta'anit Esther",
    'Taanit Esther': "Ta'anit Esther",
    'Fast of Esther': "Ta'anit Esther",
    'Tzom Tammuz': 'Tzom Tammuz',
    'Tzom Tamuz': 'Tzom Tammuz',
    'Fast of Tammuz': 'Tzom Tammuz',
    '17 of Tammuz': 'Tzom Tammuz',
    "Tisha B'Av": "Tisha B'Av",
    'Tzom Gedaliah': 'Tzom Gedaliah',
    'Fast of Gedaliah': 'Tzom Gedaliah',
    'Tzom Tevet': 'Tzom Tevet',
    'Fast of Tevet': 'Tzom Tevet',
    '10 of Tevet': 'Tzom Tevet',
    "Asara B'Tevet": 'Tzom Tevet',
    'Shabbat Shekalim': 'Shabbat Shekalim',
    'Shabbat Zachor': 'Shabbat Zachor',
    'Shabbat Parah': 'Shabbat Parah',
    'Shabbat HaChodesh': 'Shabbat HaChodesh',
    'Shabbat HaGadol': 'Shabbat HaGadol',
    'Shabbat Shirah': 'Shabbat Shirah',
    'Shabbat Chazon': 'Shabbat Chazon',
    'Shabbat Nachamu': 'Shabbat Nachamu',
    'Shabbat Shuvah': 'Shabbat Shuvah',
    'Shabbat': 'Yom Shabbat',
    'Yom Shabbat': 'Yom Shabbat'
};

export const LOCATION_EXPIRATION_DAYS = 90;
export const LOCATION_EXPIRATION_MS = 90 * 24 * 60 * 60 * 1000;

export const RECENT_LOCATIONS_MAX = 3;
export const RECENT_LOCATIONS_EXPIRATION_DAYS = 10;
export const RECENT_LOCATIONS_EXPIRATION_MS = 10 * 24 * 60 * 60 * 1000;

export const LOCATION_SUGGESTIONS_LIMIT = 15;

export const LOCATION_STORAGE_KEYS = Object.freeze({
    ACTIVE_LOCATION: 'exactLocation',
    ACTIVE_TIMESTAMP: 'exactLocation_timestamp',
    RECENT_LOCATIONS: 'yisrael_recent_locations'
});