import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve('docs/screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const screens = [
    { name: '1_landing_upload', step: 1, hash: '#upload' },
    { name: '2_extraction_pause_confirmation', step: 2, hash: '#confirm' },
    { name: '3_explainer_deadlines', step: 3, hash: '#explain' },
    { name: '4_evidence_checklist', step: 4, hash: '#evidence' },
    { name: '5_draft_verifier', step: 5, hash: '#draft' },
    { name: '6_ca_ready_brief', step: 6, hash: '#brief' },
  ];

  console.log('Navigating to http://localhost:3000/#upload ...');
  await page.goto('http://localhost:3000/#upload', { waitUntil: 'networkidle0' });

  // Desktop (1440 x 900)
  for (const s of screens) {
    console.log(`Capturing Desktop: ${s.name}`);
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    
    // Set step in store directly so all steps can be viewed
    await page.evaluate((targetStep) => {
      // Access zustand store or trigger hash
      window.location.hash = targetStep === 1 ? '#upload' :
        targetStep === 2 ? '#confirm' :
        targetStep === 3 ? '#explain' :
        targetStep === 4 ? '#evidence' :
        targetStep === 5 ? '#draft' : '#brief';
    }, s.step);

    // Also update zustand state maxStep to 6 so any step is accessible
    await page.evaluate((targetStep) => {
      try {
        const store = window.__DHAAL_STORE__;
        if (store) {
          store.setState({ maxStep: 6, step: targetStep });
        }
      } catch (e) {}
    }, s.step);

    await new Promise((r) => setTimeout(r, 800));

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `desktop_${s.name}.png`),
      fullPage: true,
    });
  }

  // Mobile (390 x 844)
  for (const s of screens) {
    console.log(`Capturing Mobile: ${s.name}`);
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });

    await page.evaluate((targetStep) => {
      window.location.hash = targetStep === 1 ? '#upload' :
        targetStep === 2 ? '#confirm' :
        targetStep === 3 ? '#explain' :
        targetStep === 4 ? '#evidence' :
        targetStep === 5 ? '#draft' : '#brief';
    }, s.step);

    await new Promise((r) => setTimeout(r, 800));

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `mobile_${s.name}.png`),
      fullPage: true,
    });
  }

  await browser.close();
  console.log('All screenshots captured successfully in docs/screenshots!');
}

run().catch(console.error);
