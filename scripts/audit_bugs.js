import puppeteer from 'puppeteer';

const VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1536x864', width: 1536, height: 864 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 },
];

const STEPS = [
  { step: 1, hash: '#upload' },
  { step: 2, hash: '#confirm' },
  { step: 3, hash: '#explain' },
  { step: 4, hash: '#evidence' },
  { step: 5, hash: '#draft' },
  { step: 6, hash: '#brief' },
];

const LANGUAGES = ['en', 'hi', 'mr'];

async function auditBugs() {
  console.log('🔍 INITIATING DEEP RECON & BUG AUDIT...');
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

  const findings = {
    overflows: [],
    consoleErrors: [],
    smallTouchTargets: [],
    devanagariLineHeightIssues: [],
    duplicateFactAnomalies: [],
    productionLeaks: [],
  };

  // 1. Audit Viewports x Steps Overflow
  console.log('\n--- 1. Testing All Steps (1-6) Across All Viewports (7) ---');
  for (const vp of VIEWPORTS) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(`http://localhost:4173/?demo=1`, { waitUntil: 'networkidle0' });

    for (const s of STEPS) {
      await page.evaluate((hash) => {
        window.location.hash = hash;
      }, s.hash);
      await new Promise((r) => setTimeout(r, 250));

      const overflow = await page.evaluate(() => {
        const sw = document.documentElement.scrollWidth;
        const iw = window.innerWidth;
        const bodySw = document.body.scrollWidth;
        return {
          hasOverflow: sw > iw || bodySw > iw,
          sw,
          iw,
          bodySw,
        };
      });

      if (overflow.hasOverflow) {
        findings.overflows.push({
          viewport: vp.name,
          step: s.step,
          hash: s.hash,
          scrollWidth: overflow.sw,
          innerWidth: overflow.iw,
        });
        console.log(`❌ OVERFLOW on Step ${s.step} at ${vp.name}: scrollWidth=${overflow.sw} > innerWidth=${overflow.iw}`);
      } else {
        // console.log(`✅ Step ${s.step} at ${vp.name}: OK`);
      }
    }
    console.log(`Verified all 6 steps at ${vp.name}`);
  }

  // 2. Audit Languages x Devanagari Line Height
  console.log('\n--- 2. Testing Devanagari Typography & Line Height in hi & mr ---');
  await page.setViewport({ width: 1366, height: 768 });
  for (const lang of ['hi', 'mr']) {
    await page.goto(`http://localhost:4173/?demo=1#explain`, { waitUntil: 'networkidle0' });
    const langBtn = await page.$(`button[lang="${lang}"]`);
    if (langBtn) await langBtn.click();
    await new Promise((r) => setTimeout(r, 300));

    const check = await page.evaluate(() => {
      const devanagariElements = Array.from(document.querySelectorAll('[lang="hi"], [lang="mr"], p, span, h1, h2, h3'))
        .filter((el) => /[\u0900-\u097F]/.test(el.textContent || ''));

      const issues = [];
      for (const el of devanagariElements) {
        const computed = window.getComputedStyle(el);
        const fontSize = parseFloat(computed.fontSize);
        const lineHeight = parseFloat(computed.lineHeight);
        const ratio = lineHeight / fontSize;
        if (ratio < 1.6 && computed.lineHeight !== 'normal') {
          issues.push({
            tag: el.tagName,
            text: (el.textContent || '').slice(0, 30),
            ratio,
            fontSize,
            lineHeight,
          });
        }
      }
      return issues;
    });

    if (check.length > 0) {
      console.log(`⚠️ Warning: Found ${check.length} Devanagari elements with tight line-height in ${lang}`);
      findings.devanagariLineHeightIssues.push(...check);
    } else {
      console.log(`✅ Devanagari typography line-height in ${lang} is well-proportioned`);
    }
  }

  // 3. Audit Mobile Touch Targets on 390x844
  console.log('\n--- 3. Testing Interactive Touch Targets on Mobile (390x844) ---');
  await page.setViewport({ width: 390, height: 844 });
  for (const s of STEPS) {
    await page.goto(`http://localhost:4173/?demo=1${s.hash}`, { waitUntil: 'networkidle0' });
    const smallTargets = await page.evaluate((stepNum) => {
      const interactives = Array.from(document.querySelectorAll('button, a, input, select, textarea, [role="button"]'));
      const small = [];
      for (const el of interactives) {
        // Skip hidden elements
        if (el.offsetParent === null) continue;

        // If it's a checkbox or radio nested inside a label, the label provides the touch area
        if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) {
          const parentLabel = el.closest('label');
          if (parentLabel) {
            const labelRect = parentLabel.getBoundingClientRect();
            if (labelRect.height >= 36 && labelRect.width >= 36) {
              continue;
            }
          }
        }

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        // WCAG standard recommendation is 44x44 (or 36x36 for compact table controls)
        if (rect.height < 36 || rect.width < 36) {
          small.push({
            step: stepNum,
            tag: el.tagName,
            ariaLabel: el.getAttribute('aria-label') || el.innerText || el.title || el.className,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }
      return small;
    }, s.step);

    if (smallTargets.length > 0) {
      findings.smallTouchTargets.push(...smallTargets);
      console.log(`⚠️ Step ${s.step} has ${smallTargets.length} controls < 36px touch size on mobile`);
    } else {
      console.log(`✅ Step ${s.step} all controls meet touch target threshold`);
    }
  }

  // 4. Audit Duplicate Facts Per Step
  console.log('\n--- 4. Auditing Duplicate Facts Per Screen ---');
  await page.setViewport({ width: 1366, height: 768 });
  for (const s of STEPS) {
    await page.goto(`http://localhost:4173/?demo=1${s.hash}`, { waitUntil: 'networkidle0' });
    const factCounts = await page.evaluate(() => {
      const text = document.body.innerText;
      const countOccurrences = (term) => (text.match(new RegExp(term, 'gi')) || []).length;
      return {
        section61: countOccurrences('Section 61'),
        sandbox: countOccurrences('Sandbox'),
        sharmaGarments: countOccurrences('Sharma Garments'),
        codeVerified: countOccurrences('Code-Verified') + countOccurrences('numbers checked by code'),
      };
    });
    console.log(`Step ${s.step} facts count: Section 61: ${factCounts.section61}, Sandbox: ${factCounts.sandbox}, Sharma Garments: ${factCounts.sharmaGarments}, Code-Verified: ${factCounts.codeVerified}`);
    if (factCounts.codeVerified > 1 || factCounts.sandbox > 2) {
      findings.duplicateFactAnomalies.push({ step: s.step, ...factCounts });
    }
  }

  // 5. Check Production Leak
  console.log('\n--- 5. Checking Production Leaks (:8001 / Live API) ---');
  await page.goto(`http://localhost:4173/`, { waitUntil: 'networkidle0' });
  const leak = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      has8001: text.includes(':8001'),
      hasLiveApi: text.includes('Live API'),
    };
  });
  console.log(`Port :8001 present: ${leak.has8001}, Live API present: ${leak.hasLiveApi}`);
  if (leak.has8001 || leak.hasLiveApi) {
    findings.productionLeaks.push(leak);
  }

  // 6. Report Console Errors
  findings.consoleErrors = consoleErrors.filter((e) => !e.includes('net::ERR_CONNECTION_REFUSED'));
  console.log(`\nUncaught/Unexpected Console Errors: ${findings.consoleErrors.length}`);

  await browser.close();

  console.log('\n================ AUDIT SUMMARY ================');
  console.log(`Total Horizontal Overflows: ${findings.overflows.length}`);
  console.log(`Total Small Touch Targets (<36px on mobile): ${findings.smallTouchTargets.length}`);
  console.log(`Total Devanagari Line Height Warnings: ${findings.devanagariLineHeightIssues.length}`);
  console.log(`Total Duplicate Fact Anomalies: ${findings.duplicateFactAnomalies.length}`);
  console.log(`Total Production Leaks: ${findings.productionLeaks.length}`);
  console.log(`Total Non-network Console Errors: ${findings.consoleErrors.length}`);

  if (findings.smallTouchTargets.length > 0) {
    console.log('\nSample Small Touch Targets:');
    console.log(JSON.stringify(findings.smallTouchTargets.slice(0, 8), null, 2));
  }
}

auditBugs().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
