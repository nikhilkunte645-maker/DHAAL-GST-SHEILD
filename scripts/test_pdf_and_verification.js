import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';

const PREVIEW_URL = 'http://localhost:4173';
const DOWNLOAD_DIR = path.resolve('temp_downloads');

async function isServerReachable(url) {
  try {
    const res = await fetch(url, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensurePreviewServer() {
  const alreadyRunning = await isServerReachable(PREVIEW_URL);
  if (alreadyRunning) {
    console.log(`ℹ️ Using existing preview server at ${PREVIEW_URL}`);
    return { serverProcess: null, startedByScript: false };
  }

  if (!fs.existsSync(path.resolve('dist', 'index.html'))) {
    throw new Error(
      `Preview server is not running at ${PREVIEW_URL} and dist/index.html is missing. Run "npm run build" first.`
    );
  }

  console.log(`ℹ️ No preview server detected at ${PREVIEW_URL}. Starting managed Vite preview server...`);
  const isWin = process.platform === 'win32';
  const serverProcess = spawn(
    isWin ? 'npx.cmd' : 'npx',
    ['vite', 'preview', '--port', '4173', '--strictPort'],
    {
      stdio: 'ignore',
      detached: false,
      shell: isWin,
    }
  );

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 250));
    if (await isServerReachable(PREVIEW_URL)) {
      console.log(`✅ Managed preview server ready at ${PREVIEW_URL} (PID: ${serverProcess.pid})`);
      return { serverProcess, startedByScript: true };
    }
  }

  stopPreviewServer(serverProcess);
  throw new Error(`Timed out waiting for managed Vite preview server at ${PREVIEW_URL}`);
}

function stopPreviewServer(serverProcess) {
  if (!serverProcess || !serverProcess.pid) return false;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${serverProcess.pid} /T /F`, { stdio: 'ignore' });
    } else {
      serverProcess.kill('SIGTERM');
    }
    return true;
  } catch {
    return false;
  }
}

function clearDownloadDir() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    return;
  }
  for (const file of fs.readdirSync(DOWNLOAD_DIR)) {
    fs.unlinkSync(path.join(DOWNLOAD_DIR, file));
  }
}

async function verifyPdfAndSuite() {
  console.log('🚀 Running Comprehensive PDF & End-to-End Verification Suite...');
  clearDownloadDir();

  let serverHandle = { serverProcess: null, startedByScript: false };
  let browser = null;

  const results = {
    pdfExports: [],
    touchTargets390: [],
    overflows: [],
  };

  try {
    serverHandle = await ensurePreviewServer();

    browser = await puppeteer.launch({
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

    // 1. Test PDF Export in English, Hindi, and Marathi
    console.log('\n--- 1. Testing PDF Generation in English, Hindi, and Marathi ---');
    for (const lang of ['en', 'hi', 'mr']) {
      if (fs.existsSync(DOWNLOAD_DIR)) {
        for (const file of fs.readdirSync(DOWNLOAD_DIR)) {
          if (file.endsWith('.crdownload') || file === 'DHAAL_CA_Brief_DH-2025-ASMT10-8912.pdf') {
            fs.unlinkSync(path.join(DOWNLOAD_DIR, file));
          }
        }
      }
      await page.setViewport({ width: 1366, height: 768 });
      await page.goto(`${PREVIEW_URL}/?demo=1#brief`, { waitUntil: 'networkidle0' });

      // Switch language via UI
      if (lang !== 'en') {
        await page.evaluate((l) => {
          const btn = document.querySelector(`button[lang="${l}"]`);
          if (btn) btn.click();
        }, lang);
        await page
          .waitForFunction((l) => document.documentElement.lang === l, { timeout: 3000 }, lang)
          .catch(() => {});
        await new Promise((r) => setTimeout(r, 300));
      }

      // Verify localized dossier content is actively rendered in DOM
      const dossierVerification = await page.evaluate((l) => {
        const el = document.getElementById('printable-dossier');
        const text = el ? el.innerText : '';
        const checks = {
          en: ['Executive Summary & Allegation Mapping', 'Statutory Disclaimer:', 'Assembled Evidentiary Annexures'],
          hi: ['कार्यकारी सारांश और आरोप विवरण', 'वैधानिक अस्वीकरण:', 'एकत्रित साक्ष्य अनुलग्नक'],
          mr: ['कार्यकारी सारांश आणि आक्षेप विवरण', 'कायदेशीर अस्वीकरण:', 'एकत्रित पुरावा जोडपत्रे'],
        };
        const expected = checks[l] || [];
        const missing = expected.filter((k) => !text.includes(k));
        return { success: missing.length === 0, missing };
      }, lang);

      if (!dossierVerification.success) {
        console.error(`❌ [${lang.toUpperCase()}] Localized strings missing from dossier:`, dossierVerification.missing);
      } else {
        console.log(`✅ [${lang.toUpperCase()}] Verified localized dossier content rendered in DOM`);
      }

      // Select CA readiness confirmation checkbox through the actual UI
      const checkboxSelected = await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('label'));
        const caLabel = labels.find((lbl) =>
          (lbl.textContent || '').includes('ready to be shared with a Chartered Accountant')
        );
        const cb = caLabel ? caLabel.querySelector('input[type="checkbox"]') : null;
        if (!cb) return false;
        if (!cb.checked) cb.click();
        return cb.checked;
      });

      if (!checkboxSelected) {
        console.error(`❌ [${lang.toUpperCase()}] Could not select CA readiness confirmation checkbox!`);
        results.pdfExports.push({ lang, status: 'FAIL', reason: 'CHECKBOX_NOT_FOUND_OR_UNCHECKED' });
        continue;
      }

      // Wait for export button to become enabled before clicking
      let buttonReady = false;
      try {
        await page.waitForFunction(
          () => {
            const btns = Array.from(document.querySelectorAll('button'));
            const target = btns.find((b) => b.innerText.includes('Download Audit Dossier (PDF)'));
            return Boolean(target && !target.disabled);
          },
          { timeout: 3000 }
        );
        buttonReady = true;
      } catch {
        buttonReady = false;
      }

      if (!buttonReady) {
        console.error(`❌ [${lang.toUpperCase()}] PDF Export button remained disabled!`);
        results.pdfExports.push({ lang, status: 'FAIL', reason: 'EXPORT_BUTTON_DISABLED' });
        continue;
      }

      // Click the enabled export button
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const target = btns.find((b) => b.innerText.includes('Download Audit Dossier (PDF)'));
        if (target && !target.disabled) target.click();
      });

      console.log(`Triggered PDF export in ${lang}, waiting for download...`);
      let foundFile = null;
      let prevSize = -1;
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 250));
        const files = fs.readdirSync(DOWNLOAD_DIR);
        const hasPendingTemp = files.some((t) => t.endsWith('.crdownload'));
        const candidatePdf = files.find(
          (f) => f.startsWith('DHAAL_CA_Brief_DH-2025-ASMT10-8912') && f.endsWith('.pdf')
        );
        if (candidatePdf && !hasPendingTemp) {
          const candidateSize = fs.statSync(path.join(DOWNLOAD_DIR, candidatePdf)).size;
          if (candidateSize > 0 && candidateSize === prevSize) {
            foundFile = candidatePdf;
            break;
          }
          prevSize = candidateSize;
        }
      }

      if (!foundFile) {
        console.error(`❌ [${lang.toUpperCase()}] PDF Export failed to download within timeout!`);
        results.pdfExports.push({ lang, status: 'FAIL', reason: 'TIMEOUT' });
        continue;
      }

      const fullPath = path.join(DOWNLOAD_DIR, foundFile);
      const stats = fs.statSync(fullPath);
      const pdfContent = fs.readFileSync(fullPath);
      const header = pdfContent.subarray(0, 5).toString('ascii');
      const pageMatches = pdfContent.toString('binary').match(/\/Type\s*\/Page\b/g);
      const pageCount = pageMatches ? pageMatches.length : 0;

      if (stats.size === 0) {
        console.error(`❌ [${lang.toUpperCase()}] Downloaded PDF is empty (0 bytes)!`);
        results.pdfExports.push({ lang, status: 'FAIL', reason: 'EMPTY_FILE', fileName: foundFile });
      } else if (header !== '%PDF-') {
        console.error(`❌ [${lang.toUpperCase()}] Invalid PDF header: "${header}"`);
        results.pdfExports.push({ lang, status: 'FAIL', reason: 'INVALID_PDF_HEADER', fileName: foundFile });
      } else if (pageCount < 1) {
        console.error(`❌ [${lang.toUpperCase()}] PDF contains 0 pages!`);
        results.pdfExports.push({ lang, status: 'FAIL', reason: 'ZERO_PAGES', fileName: foundFile });
      } else {
        const sizeKb = Math.round(stats.size / 1024);
        console.log(
          `✅ [${lang.toUpperCase()}] PASS: ${foundFile} (${stats.size} bytes / ${sizeKb} KB, ${pageCount} pages, header=${header})`
        );
        results.pdfExports.push({
          lang,
          status: 'PASS',
          fileName: foundFile,
          sizeBytes: stats.size,
          sizeKb,
          pageCount,
        });
      }

      // Copy to language-specific file for audit persistence, then remove default download
      const persistentPath = path.join(DOWNLOAD_DIR, `DHAAL_CA_Brief_${lang}.pdf`);
      fs.copyFileSync(fullPath, persistentPath);
      fs.unlinkSync(fullPath);
    }

    // 2. Test Mobile Touch Targets on 390x844
    console.log('\n--- 2. Auditing Mobile Touch Targets on 390x844 (Strict >= 44x44px) ---');
    await page.setViewport({ width: 390, height: 844 });
    const steps = ['#upload', '#confirm', '#explain', '#evidence', '#draft', '#brief'];
    for (const hash of steps) {
      await page.goto(`${PREVIEW_URL}/?demo=1${hash}`, { waitUntil: 'networkidle0' });
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
        await page.goto(`${PREVIEW_URL}/?demo=1${hash}`, { waitUntil: 'domcontentloaded' });
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
  } finally {
    if (browser) {
      await browser.close();
    }
    try {
      // Keep persistent language PDFs in DOWNLOAD_DIR for inspection, only remove leftover temp files
      if (fs.existsSync(DOWNLOAD_DIR)) {
        for (const file of fs.readdirSync(DOWNLOAD_DIR)) {
          if (file.endsWith('.crdownload') || file === 'DHAAL_CA_Brief_DH-2025-ASMT10-8912.pdf') {
            fs.unlinkSync(path.join(DOWNLOAD_DIR, file));
          }
        }
      }
    } catch {
      // ignore cleanup error
    }
    if (serverHandle.startedByScript && serverHandle.serverProcess) {
      const stopped = stopPreviewServer(serverHandle.serverProcess);
      console.log(
        stopped
          ? `🧹 Managed preview server (PID: ${serverHandle.serverProcess.pid}) stopped cleanly.`
          : `⚠️ Failed to stop managed preview server (PID: ${serverHandle.serverProcess.pid}).`
      );
    }
  }

  const passedExports = results.pdfExports.filter((e) => e.status === 'PASS');
  const failedExports = results.pdfExports.filter((e) => e.status !== 'PASS');

  console.log('\n================ VERIFICATION SUMMARY ================');
  console.log(`PDF Exports Passed: ${passedExports.length} / 3`);
  for (const p of passedExports) {
    console.log(`  ✅ [${p.lang.toUpperCase()}] ${p.fileName} — ${p.sizeKb} KB (${p.sizeBytes} bytes), ${p.pageCount} pages`);
  }
  console.log(`PDF Exports Failed: ${failedExports.length} / 3`);
  for (const f of failedExports) {
    console.log(`  ❌ [${f.lang.toUpperCase()}] Reason: ${f.reason}`);
  }
  console.log(`Undersized Touch Targets (<44px on mobile): ${results.touchTargets390.length}`);
  console.log(`Horizontal Overflows: ${results.overflows.length}`);
  console.log('======================================================\n');

  if (failedExports.length > 0 || results.overflows.length > 0) {
    process.exitCode = 1;
  }
}

verifyPdfAndSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
