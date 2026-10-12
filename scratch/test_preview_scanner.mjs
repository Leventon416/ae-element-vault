import http from 'http';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(os.tmpdir(), `chrome_scanner_test_${Date.now()}`);
const port = 9222;

console.log('--- Real Browser Headless Test: Project Scanner Engine ---');

const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  'http://127.0.0.1:4173/'
]);

chromeProcess.on('error', (err) => {
  console.error('Failed to launch Chrome:', err);
  process.exit(1);
});

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function waitForCDP() {
  for (let i = 0; i < 30; i++) {
    try {
      const targets = await getJson(`http://127.0.0.1:${port}/json`);
      const pageTarget = targets.find(t => t.url && t.url.includes('4173'));
      if (pageTarget) return pageTarget;
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('CDP page target not available in time');
}

async function run() {
  try {
    const target = await waitForCDP();
    console.log('Connected to target:', target.title, target.url);

    const ws = new globalThis.WebSocket(target.webSocketDebuggerUrl);
    let idCounter = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    };

    await new Promise((res) => (ws.onopen = res));

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = idCounter++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    // Wait 2s for page hydration
    await new Promise(r => setTimeout(r, 2000));

    // Verify button exists
    const btnExists = await send('Runtime.evaluate', {
      expression: 'Boolean(document.getElementById("scan-ae-project-btn"))',
      returnByValue: true
    });
    console.log('Scan button exists:', btnExists.result?.result?.value);

    // Click "Scan Open AE Project" button
    console.log('Clicking "Scan Open AE Project" button...');
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("scan-ae-project-btn").click()'
    });

    // Wait 800ms for ExtendScript response and UI update
    await new Promise(r => setTimeout(r, 800));

    // Verify badge text
    const badgeText = await send('Runtime.evaluate', {
      expression: 'document.getElementById("detected-comps-badge")?.innerText || "not found"',
      returnByValue: true
    });
    console.log('Detected comps badge text:', badgeText.result?.result?.value);

    // Extract all composition names rendered in DOM
    const compsRendered = await send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll("#scan-ae-project-btn ~ * div, .max-h-36 div"))
          .map(el => el.innerText)
          .filter(t => t.includes("Intro Title") || t.includes("Logo Reveal") || t.includes("Lower Third Minimal"))
      `,
      returnByValue: true
    });
    console.log('Compositions rendered in UI:\n', compsRendered.result?.result?.value);

    // Extract DOM text from the scanner section
    const fullScannerText = await send('Runtime.evaluate', {
      expression: 'document.querySelector("#scan-ae-project-btn").closest(".border-b").innerText',
      returnByValue: true
    });
    console.log('--- Scanner Section Rendered Text ---:\n', fullScannerText.result?.result?.value);

    if (badgeText.result?.result?.value === '3 Comps Found' &&
        fullScannerText.result?.result?.value.includes('Intro Title') &&
        fullScannerText.result?.result?.value.includes('3840×2160') &&
        fullScannerText.result?.result?.value.includes('Logo Reveal') &&
        fullScannerText.result?.result?.value.includes('Lower Third Minimal')) {
      console.log('SUCCESS: Project Scanner engine verified and renders all compositions cleanly in browser preview!');
    } else {
      throw new Error('Verification failed: Compositions did not render as expected!');
    }

    ws.close();
  } finally {
    chromeProcess.kill();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
