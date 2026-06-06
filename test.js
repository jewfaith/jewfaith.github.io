fetch('https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&year=now&month=x&ss=on&mf=on&c=on&geo=none&m=50&s=on').then(r=>r.json()).then(data => {
    const biblicalMapping = {
        'Parashat': { name: 'Yom Shabbat' },
        'Pesach Sheni': { name: 'Pessach Sheni' },
        'Pesach': { name: 'Yom Pessach' },
        'Matzot': { name: 'Chag Matzot' },
        'Shavuot': { name: 'Yom Shavuot' },
        'Rosh Hashana': { name: 'Yom Teruah' },
        'Yom Kippur': { name: 'Yom Kippur' },
        'Sukkot': { name: 'Chag Sukkot' },
        'Shemini Atzeret': { name: 'Shemini Atzeret' },
        'Rosh Chodesh': { name: 'Rosh Chodesh' },
        'Omer': { name: 'Sefirat Omer' },
        'Simchat Torah': { name: 'Simchat Torah' }
    };
    const traditionalMapping = {
        'Chanukah': 'Chag Hanukkah',
        'Purim': 'Yom Purim',
        'Tzom Tammuz': 'Tzom Tammuz',
        "Tish'a B'Av": 'Tisha BAv',
        'Tzom Gedaliah': 'Tzom Gedaliah',
        "Asara B'Tevet": 'Tzom Tevet'
    };
    
    const validCategories = ['holiday', 'parashat', 'fast', 'omer', 'roshchodesh'];
    const filteredItems = data.items.filter(item => validCategories.includes(item.category));
    
    const results = [];
    filteredItems.forEach(item => {
        const cleanTitle = item.title.replace(/[\u2018\u2019]/g, "'");
        let itemName = item.title;
        let isBiblical = false;
        let isTraditional = false;
        
        for (const key in biblicalMapping) {
            if (cleanTitle.includes(key)) {
                if (key === 'Rosh Hashana' && (cleanTitle.includes('LaBehemot') || cleanTitle.includes('LaIlanot'))) continue;
                itemName = biblicalMapping[key].name;
                isBiblical = true;
                break;
            }
        }
        
        if (!isBiblical) {
            const sortedKeys = Object.keys(traditionalMapping).sort((a, b) => b.length - a.length);
            for (const key of sortedKeys) {
                if (cleanTitle.includes(key)) {
                    itemName = traditionalMapping[key];
                    isTraditional = true;
                    break;
                }
            }
        }
        
        if (!isBiblical && !isTraditional) {
            results.push(`[MISSING] ${item.date.split('T')[0]} | ${item.title}`);
        } else {
            results.push(`[MAPPED]  ${item.date.split('T')[0]} | ${item.title.padEnd(25)} -> ${itemName}`);
        }
    });
    console.log([...new Set(results)].join('\n'));
});
