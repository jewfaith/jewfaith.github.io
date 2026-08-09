const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'js', 'main.js');
const code = fs.readFileSync(filePath, 'utf8');

const marker = 'const isAfterSunset = sunsetTime > 0 && new Date().getTime() > sunsetTime;';
const patch = ```${marker}
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
            throw new Error("Hebcal data is missing or request failed.");
        }```;

if (!code.includes(marker)) {
    console.error('restore.js: could not find insertion marker in js/main.js.');
    process.exit(1);
}

if (code.includes('const converterUrl = `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1&strict=1')) {
    console.log('restore.js: js/main.js already contains the expected converter block.');
    process.exit(0);
}

fs.writeFileSync(filePath, code.replace(marker, patch), 'utf8');
console.log('restore.js patched js/main.js successfully.');
