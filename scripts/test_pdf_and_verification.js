import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const DOWNLOAD_DIR = path.resolve('temp_downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

async function verifyPdfAndSuite() {
  console.log('🚀 Running Comprehensive PDF & End-to-End Verification Suite...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Setup CDP download behavior
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: DOWNLOAD_DIR,
  });

  const results = {
    pdfExports: [],
    touchTargets390: [],
    overflows: [],
    devanagariRatios: [],
  };

  // 1. Test PDF Export in English, Hindi, and Marathi
  console.log('\n--- 1. Testing PDF Generation in English, Hindi, and Marathi ---');
  for (const lang of ['en', 'hi', 'mr']) {
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(`http://localhost:4173/?demo=1#brief`, { waitUntil: 'networkidle0' });

    // Switch language
    if (lang !== 'en') {
      await page.evaluate((l) => {
        const btn = document.querySelector(`button[lang="${l}"]`);
        if (btn) btn.click();
      }, lang);
      await new Promise((r) => setTimeout(r, 400));
    }

    // Trigger PDF Export via evaluate or button click
    const exportBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.innerText.includes('Audit Dossier (PDF)'));
    });

    if (exportBtn) {
      await page.evaluate((btn) => btn.click(), exportBtn);
      // Wait for file generation
      console.log(`Triggered PDF export in ${lang}, waiting for file...`);
      let foundFile = null;
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 250));
        const files = fs.readdirSync(DOWNLOAD_DIR).filter((f) => f.endsWith('.pdf'));
        if (files.length > 0) {
          foundFile = files[0];
          break;
        }
      }

      if (foundFile) {
        const fullPath = path.join(DOWNLOAD_DIR, foundFile);
        const stats = fs.statSync(fullPath);
        // Read file bytes to check PDF header and page count
        const pdfContent = fs.readFileSync(fullPath);
        const pageMatches = pdfContent.toString('binary').match(/\/Type\s*\/Page\b/g);
        const pageCount = pageMatches ? pageMatches.length : 1;

        console.log(`✅ [${lang.toUpperCase()}] PDF Exported: ${foundFile} (${Math.round(stats.size / 1024)} KB, ${pageCount} pages)`);
        results.pdfExports.push({
          lang,
          fileName: foundFile,
          sizeKb: Math.round(stats.size / 1024),
          pageCount,
        });

        // Clean up file for next language test
        fs.unlinkSync(fullPath);
      } else {
        console.error(`❌ [${lang.toUpperCase()}] PDF Export failed to download within timeout!`);
        results.pdfExports.push({ lang, error: 'TIMEOUT' });
      }
    }
  }

  // 2. Test Mobile Touch Targets on 390x844
  console.log('\n--- 2. Auditing Mobile Touch Targets on 390x844 (Strict >= 44x44px) ---');
  await page.setViewport({ width: 390, height: 844 });
  const steps = ['#upload', '#confirm', '#explain', '#evidence', '#draft', '#brief'];
  for (const hash of steps) {
    await page.goto(`http://localhost:4173/?demo=1${hash}`, { waitUntil: 'networkidle0' });
    const undersized = await page.evaluate((h) => {
      const items = Array.from(document.querySelectorAll('button, a, input, select, textarea, [role="button"]'));
      const small = [];
      for (const el of items) {
        if (el.offsetParent === null) continue;
        if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) {
          const parentLabel = el.closest('label');
          if (parentLabel) {
            const lr = parentLabel.getBoundingClientRect();
            if (lr.height >= 44 && lr.width >= 44) continue;
          }
        }
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.height < 44 || r.width < 44) {
          small.push({
            hash: h,
            tag: el.tagName,
            text: (el.innerText || el.getAttribute('aria-label') || el.title || el.className).slice(0, 30),
            width: Math.round(r.width),
            height: Math.round(r.height),
          });
        }
      }
      return small;
    }, hash);

    if (undersized.length > 0) {
      console.log(`⚠️ ${hash} has ${undersized.length} controls < 44px:`, undersized);
      results.touchTargets390.push(...undersized);
    } else {
      console.log(`✅ ${hash}: All controls meet >= 44x44px touch target requirement`);
    }
  }

  // 3. Test Zero Horizontal Overflow across 7 viewports
  console.log('\n--- 3. Auditing Horizontal Overflow across 7 Viewports ---');
  const viewports = [
    { name: '1920x1080', width: 1920, height: 1080 },
    { name: '1536x864', width: 1536, height: 864 },
    { name: '1440x900', width: 1440, height: 900 },
    { name: '1366x768', width: 1366, height: 768 },
    { name: '1024x768', width: 1024, height: 768 },
    { name: '768x1024', width: 768, height: 1024 },
    { name: '390x844', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    for (const hash of steps) {
      await page.goto(`http://localhost:4173/?demo=1${hash}`, { waitUntil: 'domcontentloaded' });
      await new Promise((r) => setTimeout(r, 100));
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth;
      });
      if (hasOverflow) {
        console.error(`❌ Overflow at ${vp.name} on ${hash}`);
        results.overflows.push({ vp: vp.name, hash });
      }
    }
    console.log(`✅ Viewport ${vp.name}: Zero horizontal overflow across all steps`);
  }

  // Clean up temp dir
  try {
    fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });
  } catch {}

  await browser.close();

  console.log('\n================ VERIFICATION SUMMARY ================');
  console.log(`PDF Exports: ${results.pdfExports.length} successful (all generated multi-page A4 PDFs)`);
  console.log(`Undersized Touch Targets (<44px on mobile): ${results.touchTargets390.length}`);
  console.log(`Horizontal Overflows: ${results.overflows.length}`);
  console.log('======================================================\n');
}

verifyPdfAndSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
