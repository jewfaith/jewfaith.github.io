const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');
code = code.replace(/const locData = await nomPromise;.*?\.filter\(d => new Date\(/s, 
\// 4. AWAIT CONVERTER
        const converterUrl = \\\https://www.hebcal.com/converter?cfg=json&gy=\\\&gm=\\\&gd=\\\&g2h=1&strict=1\\\\\\;
        const hdateData = await hebcalFetch(converterUrl).catch(() => null);

        // 5. RESOLVE PARALLEL PROMISES
        const locData = await nomPromise;
        if (locData && locData.address) {
            const addr = locData.address;
            const city = addr.city || addr.town || addr.village || addr.state;
            if (addr.country) locationName = city ? \\\\\\, \\\\\\ : addr.country;
            else locationName = city || "Jerusalém";
            if (addr.country_code) isIsrael = (addr.country_code.toLowerCase() === 'il');
        }

        const hebcalData = await hebcalPromise;
        if (!hebcalData || !hebcalData.items) {
            throw new Error('Hebcal fetch failed');
        }

        if (hebcalData && hebcalData.items) {
            const biblicalMapping = {
                'Parashat': { name: 'Yom Shabbat' },
                'Pesach Sheni': { name: 'Pessach Sheni' },
                'Pesach': { name: 'Yom Pessach' },
                'Matzot': { name: 'Chag Matzot' },
                'Shavuot': { name: 'Yom Shavuot' },
                'Rosh Hashana': { name: 'Yom Teruah' },
                'Yom Kippur': { name: 'Yom Kippur' },
                'Sukkot': { name: 'Chag Sukkot' },
                'Shmini Atzeret': { name: 'Shemini Atzeret' },
                'Shemini Atzeret': { name: 'Shemini Atzeret' },
                'Simchat Torah': { name: 'Simchat Torah' },
                'Rosh Chodesh': { name: 'Rosh Chodesh' },
                'Omer': { name: 'Sefirat Omer' }
            };

            const validCategories = ['holiday', 'parashat', 'fast', 'omer', 'roshchodesh'];
            const filteredItems = hebcalData.items.filter(item => validCategories.includes(item.category));

            // Collect unique dates so we can fetch each date's sunset individually
            // Limit to events happening in the next 10 days to keep imminent events hyper-realistic while saving API requests
            const tenDaysFromNow = new Date().getTime() + (10 * 24 * 60 * 60 * 1000);
            const uniqueDates = [...new Set(filteredItems.map(item => item.date.split('T')[0]))]
                .filter(d => new Date(\);
fs.writeFileSync('js/main.js', code);
