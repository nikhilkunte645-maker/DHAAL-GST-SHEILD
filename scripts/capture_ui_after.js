import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('artifacts/ui-after');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log('📸 Capturing comprehensive real-browser screenshots of DHAAL...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Helper for capturing
  const shoot = async (name, vp, hash, setup) => {
    await page.setViewport(vp);
    await page.goto(`http://localhost:4173/?demo=1${hash}`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 400));
    if (setup) {
      await setup(page);
      await new Promise((r) => setTimeout(r, 400));
    }
    const outPath = path.join(SCREENSHOT_DIR, name);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`✅ Saved: ${name} (${vp.width}x${vp.height})`);
  };

  const desktopVp = { width: 1440, height: 900 };
  const mobileVp = { width: 390, height: 844 };

  // 1. Dashboard Desktop (Step 3 Reconciliation & Overview)
  await shoot('1-dashboard-desktop.png', desktopVp, '#explain');

  // 2. Dashboard Mobile (Step 3 Reconciliation & Overview)
  await shoot('2-dashboard-mobile.png', mobileVp, '#explain');

  // 3. Notice Upload Desktop
  await shoot('3-notice-upload-desktop.png', desktopVp, '#upload');

  // 4. Notice Upload Mobile
  await shoot('4-notice-upload-mobile.png', mobileVp, '#upload');

  // 5. Notice Review Desktop (Step 2 Confirm & Notice Scan)
  await shoot('5-notice-review-desktop.png', desktopVp, '#confirm');

  // 6. Reconciliation Desktop (Step 3 Table & Summary)
  await shoot('6-reconciliation-desktop.png', desktopVp, '#explain');

  // 7. Reconciliation Mobile
  await shoot('7-reconciliation-mobile.png', mobileVp, '#explain');

  // 8. Deadline / Explainer Desktop (Step 3 Scroll into explainer)
  await shoot('8-deadline-explainer-desktop.png', desktopVp, '#explain', async (p) => {
    await p.evaluate(() => {
      window.scrollBy(0, 500);
    });
  });

  // 9. Evidence Checklist Desktop (Step 4)
  await shoot('9-evidence-checklist-desktop.png', desktopVp, '#evidence');

  // 10. Legal Draft & Verifier (Step 5)
  await shoot('10-legal-draft-verifier-desktop.png', desktopVp, '#draft');

  // 11. CA-Ready Brief Desktop (Step 6)
  await shoot('11-ca-ready-brief-desktop.png', desktopVp, '#brief');

  // 12. Mobile Navigation Drawer
  await shoot('12-mobile-navigation-drawer.png', mobileVp, '#upload', async (p) => {
    // Click burger menu button
    const menuBtn = await p.$('button[aria-label="Toggle navigation menu"]');
    if (menuBtn) {
      await menuBtn.click();
    }
  });

  // 13. PDF Dossier Preview
  await shoot('13-pdf-preview-desktop.png', desktopVp, '#brief', async (p) => {
    await p.evaluate(() => {
      const el = document.getElementById('printable-dossier');
      if (el) el.scrollIntoView();
    });
  });

  await browser.close();
  console.log('\n🎉 All 13 mandatory screenshots captured successfully in artifacts/ui-after/!');
}

captureScreenshots().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
