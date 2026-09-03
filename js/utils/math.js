export const LCG = (seed) => (seed * 9301 + 49297) % 233280;

export function getStringSimilarity(s1, s2) {
    const clean = s => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const a = clean(s1);
    const b = clean(s2);
    if (a === b) return 1.0;
    if (a.length === 0 || b.length === 0) return 0.0;
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            );
        }
    }
    return 1.0 - (dp[a.length][b.length] / Math.max(a.length, b.length));
}
