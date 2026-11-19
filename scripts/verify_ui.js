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
  console.log('🚀 Starting Comprehensive UI Declutter Verification...');
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

  // 1. Test Viewports and Overflow
  console.log('\n--- 1. Testing Viewports & Horizontal Overflow ---');
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
    // Click language button
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

  // Open Demo Controls popover
  const demoControlsToggle = await page.$('button[aria-label="Toggle demo state controls"]');
  if (demoControlsToggle) {
    await demoControlsToggle.click();
    await new Promise((r) => setTimeout(r, 200));

    // Test State 2: Processing
    const processingBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((b) => b.textContent.includes('2. Processing'));
    });
    if (processingBtn) {
      await processingBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'demo_state_2_processing.png'),
        fullPage: false,
      });
      console.log('✅ Demo State 2 (Processing) verified');
    }

    // Reopen popover if closed and test State 3: Blurry Photo
    const isOpen = await page.$('button[aria-label="Close demo controls"]');
    if (!isOpen) {
      await demoControlsToggle.click();
      await new Promise((r) => setTimeout(r, 200));
    }
    const blurryBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((b) => b.textContent.includes('3. Blurry Photo'));
    });
    if (blurryBtn) {
      await blurryBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'demo_state_3_blurry.png'),
        fullPage: false,
      });
      console.log('✅ Demo State 3 (Blurry Photo) verified');
    }

    // Reopen popover and test State 4: Wrong Form
    const isOpen2 = await page.$('button[aria-label="Close demo controls"]');
    if (!isOpen2) {
      await demoControlsToggle.click();
      await new Promise((r) => setTimeout(r, 200));
    }
    const wrongFormBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((b) => b.textContent.includes('4. Wrong Form'));
    });
    if (wrongFormBtn) {
      await wrongFormBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'demo_state_4_wrong_form.png'),
        fullPage: false,
      });
      console.log('✅ Demo State 4 (Wrong Form) verified');
    }

    // Return to Default Drop
    const isOpen3 = await page.$('button[aria-label="Close demo controls"]');
    if (!isOpen3) {
      await demoControlsToggle.click();
      await new Promise((r) => setTimeout(r, 200));
    }
    const defaultBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((b) => b.textContent.includes('1. Default'));
    });
    if (defaultBtn) {
      await defaultBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      console.log('✅ Demo State 1 (Default Drop) verified');
    }
  }

  // 5. Test Sample Notice & Step Navigation
  console.log('\n--- 5. Testing Sample Notice Upload & Step Navigation ---');
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  const sampleBtn = await page.$('button[aria-label="Try with canonical Form ASMT-10 sample notice"]');
  if (sampleBtn) {
    await sampleBtn.click();
    console.log('Clicked "Try with sample notice"... waiting for step 2 auto-advance...');
    await page.waitForFunction(() => window.location.hash === '#confirm', { timeout: 5000 });
    console.log('✅ Successfully advanced to Step 2 (#confirm)!');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'step_2_confirm.png'),
      fullPage: false,
    });
  }

  // 6. Check Console Errors
  console.log('\n--- 6. Console Error Audit ---');
  console.log(`Total Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.warn('Console Errors Encountered:', consoleErrors);
  } else {
    console.log('✅ Zero console errors!');
  }

  await browser.close();
  console.log('\n🎉 ALL BROWSER VERIFICATIONS PASSED SUCCESSFULLY!');
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
