const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'js', 'main.js');
const code = fs.readFileSync(filePath, 'utf8');

const marker = 'const isAfterSunset = sunsetTime > 0 && new Date().getTime() > sunsetTime;';
if (!code.includes(marker)) {
    console.error('fix.js: could not find the expected marker in js/main.js.');
    process.exit(1);
}

const expected = 'const converterUrl = `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1&strict=1${isAfterSunset ? \"&gs=on\" : \"\"}`;';
if (code.includes(expected)) {
    console.log('fix.js: js/main.js already contains the expected converter block.');
    process.exit(0);
}

const replacement = ```${marker}
        const converterUrl = \`https://www.hebcal.com/converter?cfg=json&gy=\${year}&gm=\${month}&gd=\${day}&g2h=1&strict=1\${isAfterSunset ? '&gs=on' : ''}\`;
        const [hdateData, hebcalData] = await Promise.all([
            hebcalFetch(converterUrl).catch(() => null),
            hebcalPromise
        ]);

        if (overrideName) {
            locationName = overrideName;
        } else if (locData && locData.address) {
            const addr = locData.address;
            const city = addr.city || addr.town || addr.village || addr.state;
            if (addr.country) locationName = city ? '\${city}, \${addr.country}' : addr.country;
            else locationName = city || "Jerusalem";
            if (addr.country_code) isIsrael = (addr.country_code.toLowerCase() === 'il');
        }

        if (!hebcalData || !hebcalData.items) {
            throw new Error('Hebcal fetch failed');
        }```;

fs.writeFileSync(filePath, code.replace(marker, replacement), 'utf8');
console.log('fix.js patched js/main.js successfully.');
