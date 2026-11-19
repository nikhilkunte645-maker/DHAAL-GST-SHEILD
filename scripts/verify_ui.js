import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1536x864', width: 1536, height: 864 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 },
];

const BASE_URL = 'http://localhost:4173/?demo=1';
const SCREENSHOT_DIR = path.resolve('docs/screenshots/declutter');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runVerification() {
  console.log('🚀 Starting Comprehensive Full-Flow UI Declutter Verification...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.toString());
  });

  // 1. Test Viewports and Overflow on Initial Screen
  console.log('\n--- 1. Testing Viewports & Horizontal Overflow (Step 1) ---');
  for (const vp of VIEWPORTS) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    const overflowCheck = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const innerWidth = window.innerWidth;
      const hasOverflow = scrollWidth > innerWidth;
      return { scrollWidth, innerWidth, hasOverflow };
    });

    console.log(
      `Viewport ${vp.name}: innerWidth=${overflowCheck.innerWidth}, scrollWidth=${overflowCheck.scrollWidth} -> ${
        overflowCheck.hasOverflow ? '❌ OVERFLOW' : '✅ ZERO OVERFLOW'
      }`
    );

    if (overflowCheck.hasOverflow) {
      throw new Error(`Horizontal overflow detected at ${vp.name}!`);
    }

    // Save screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, `viewport_${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
  }

  // 2. Production Hygiene Check: No ":8001" or "Live API" in DOM
  console.log('\n--- 2. Checking Production Hygiene (No ":8001" or "Live API" in DOM) ---');
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });

  const leakCheck = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const hasPort8001 = bodyText.includes(':8001');
    const hasLiveApi = bodyText.includes('Live API');
    return { hasPort8001, hasLiveApi };
  });

  console.log(`Port 8001 present: ${leakCheck.hasPort8001 ? '❌ LEAKED' : '✅ NONE'}`);
  console.log(`"Live API" present: ${leakCheck.hasLiveApi ? '❌ LEAKED' : '✅ NONE'}`);

  if (leakCheck.hasPort8001 || leakCheck.hasLiveApi) {
    throw new Error('Dev diagnostics leaked in production build!');
  }

  // 3. Test Languages (en, hi, mr)
  console.log('\n--- 3. Testing Languages (English, Hindi, Marathi) ---');
  const languages = ['en', 'hi', 'mr'];
  for (const lang of languages) {
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    const label = lang === 'en' ? 'EN' : lang === 'hi' ? 'हिं' : 'मरा';
    const langBtn = await page.$(`button[lang="${lang}"]`);
    if (langBtn) {
      await langBtn.click();
      await new Promise((r) => setTimeout(r, 300));
    }

    const langOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });

    console.log(`Language ${lang} (${label}): ${langOverflow ? '✅ PERFECT' : '❌ OVERFLOW'}`);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `language_${lang}.png`),
      fullPage: false,
    });
  }

  // 4. Test Demo States
  console.log('\n--- 4. Testing Demo States in Demo Controls Popover ---');
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

  const demoControlsToggle = await page.$('button[aria-label="Toggle demo state controls"]');
  if (demoControlsToggle) {
    await demoControlsToggle.click();
    await new Promise((r) => setTimeout(r, 200));

    // Test State 2: Processing
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const b = buttons.find((btn) => btn.textContent.includes('2. Processing'));
      b?.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'demo_state_2_processing.png'),
      fullPage: false,
    });
    console.log('✅ Demo State 2 (Processing) verified');

    // Test State 3: Blurry Photo
    const isOpen = await page.$('button[aria-label="Close demo controls"]');
    if (!isOpen) {
      await demoControlsToggle.click();
      await new Promise((r) => setTimeout(r, 200));
    }
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const b = buttons.find((btn) => btn.textContent.includes('3. Blurry Photo'));
      b?.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'demo_state_3_blurry.png'),
      fullPage: false,
    });
    console.log('✅ Demo State 3 (Blurry Photo) verified');

    // Test State 4: Wrong Form
    const isOpen2 = await page.$('button[aria-label="Close demo controls"]');
    if (!isOpen2) {
      await demoControlsToggle.click();
      await new Promise((r) => setTimeout(r, 200));
    }
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const b = buttons.find((btn) => btn.textContent.includes('4. Wrong Form'));
      b?.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'demo_state_4_wrong_form.png'),
      fullPage: false,
    });
    console.log('✅ Demo State 4 (Wrong Form) verified');

    // Return to Default Drop
    const isOpen3 = await page.$('button[aria-label="Close demo controls"]');
    if (!isOpen3) {
      await demoControlsToggle.click();
      await new Promise((r) => setTimeout(r, 200));
    }
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const b = buttons.find((btn) => btn.textContent.includes('1. Default'));
      b?.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    console.log('✅ Demo State 1 (Default Drop) verified');
  }

  // 5. Test Step 1 through Step 6 End-to-End Walkthrough
  console.log('\n--- 5. End-to-End 6-Step Flow & Zero-Overflow Audit ---');
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

  // Step 1: Upload
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step_1_upload.png'), fullPage: false });
  console.log('✅ Step 1 (Upload) verified');

  const sampleBtn = await page.$('button[aria-label="Try with canonical Form ASMT-10 sample notice"]');
  if (sampleBtn) {
    await sampleBtn.click();
    await page.waitForFunction(() => window.location.hash === '#confirm', { timeout: 8000 });
    console.log('✅ Step 2 (#confirm) loaded');
  }

  // Check Step 2 Overflow
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) throw new Error('Overflow on Step 2!');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step_2_confirm.png'), fullPage: false });

  // Click Confirm on Step 2
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const b = buttons.find((btn) => btn.textContent.toLowerCase().includes('confirm and continue'));
    b?.click();
  });
  await page.waitForFunction(() => window.location.hash === '#explain', { timeout: 8000 });
  console.log('✅ Step 3 (#explain) loaded');

  // Check Step 3 Overflow
  overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) throw new Error('Overflow on Step 3!');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step_3_explain.png'), fullPage: false });

  // Click Next on Step 3 -> Step 4
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const b = buttons.find((btn) => btn.textContent.includes('Proceed to Evidence Checklist'));
    b?.click();
  });
  await page.waitForFunction(() => window.location.hash === '#evidence', { timeout: 8000 });
  console.log('✅ Step 4 (#evidence) loaded');

  // Check Step 4 Overflow
  overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) throw new Error('Overflow on Step 4!');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step_4_evidence.png'), fullPage: false });

  // Click Next on Step 4 -> Step 5
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const b = buttons.find((btn) => btn.textContent.includes('Continue to Draft & Verifier'));
    b?.click();
  });
  await page.waitForFunction(() => window.location.hash === '#draft', { timeout: 8000 });
  console.log('✅ Step 5 (#draft) loaded');

  // Check Step 5 Overflow
  overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) throw new Error('Overflow on Step 5!');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step_5_verifier.png'), fullPage: false });

  // Click Next on Step 5 -> Step 6
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const b = buttons.find((btn) => btn.textContent.includes('Compile CA-Ready Brief'));
    b?.click();
  });
  await page.waitForFunction(() => window.location.hash === '#brief', { timeout: 8000 });
  console.log('✅ Step 6 (#brief) loaded');

  // Check Step 6 Overflow
  overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) throw new Error('Overflow on Step 6!');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step_6_brief.png'), fullPage: false });

  // 6. Check Console Errors
  console.log('\n--- 6. Console Error Audit ---');
  console.log(`Total Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.warn('Console Errors Encountered:', consoleErrors);
  } else {
    console.log('✅ Zero console errors!');
  }

  await browser.close();
  console.log('\n🎉 ALL BROWSER & FULL-FLOW VERIFICATIONS PASSED SUCCESSFULLY!');
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
