import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://oet.bamf.de/ords/oetut/f?p=514:1::::::';

async function main() {
  const n = parseInt(process.argv[2] || '1', 10) || 1;
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.getByRole('button', { name: /Zum Fragenkatalog/i }).click();
    await page.waitForURL(/p=514:30/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Ensure we are on question n
    try {
      const combo = page.getByRole('combobox', { name: /Aufgabe|wählen/i }).or(page.locator('select').first());
      await combo.selectOption({ label: String(n) }).catch(() => combo.selectOption({ value: String(n) }));
      await page.waitForTimeout(1000);
    } catch {
      // ignore
    }

    const html = await page.content();
    const filePath = join(__dirname, `debug-question-${n}.html`);
    writeFileSync(filePath, html, 'utf8');
    console.log('Wrote debug HTML to', filePath);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

