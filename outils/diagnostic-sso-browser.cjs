/* Diagnostic de transport public : aucune authentification, aucun cookie ni contenu enregistré. */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ locale: 'fr-FR', timezoneId: 'Europe/Paris' });
    const hosts = [
      ['sso-occitanie', 'https://sso.mon-ent-occitanie.fr/oidc/.well-known'],
      ['cas-occitanie', 'https://cas.mon-ent-occitanie.fr/'],
      ['educonnect', 'https://educonnect.education.gouv.fr/'],
    ];
    for (const [name, url] of hosts) {
      try {
        const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
        console.log('BROWSER_HTTP', name, resp ? resp.status() : 'no-response', 'FINAL_HOST', new URL(page.url()).hostname);
      } catch (err) {
        const msg = String(err.message || '').split('\n')[0];
        const code = (msg.match(/net::[A-Z_]+/) || ['UNKNOWN'])[0];
        console.log('BROWSER_HTTP', name, 'ERROR', code);
      }
    }
  } finally { await browser.close(); }
})().catch(err => { console.log('BROWSER_DIAG_ERROR', err.name); process.exit(1); });
