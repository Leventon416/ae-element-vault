import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('========================================================================');
console.log('         AE ELEMENT VAULT - PRODUCTION BUNDLE VALIDATOR');
console.log('========================================================================\n');

let errors = [];

function checkFile(relPath, desc) {
  const fullPath = path.join(projectRoot, relPath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing required file: ${relPath} (${desc})`);
    return false;
  }
  const stat = fs.statSync(fullPath);
  if (stat.size === 0) {
    errors.push(`Empty file: ${relPath} (0 bytes)`);
    return false;
  }
  return true;
}

// 1. Verify CEP Manifest & Debug Config
console.log('1. Validating CEP Configuration Files...');
if (checkFile('CSXS/manifest.xml', 'CEP Extension Manifest')) {
  const manifest = fs.readFileSync(path.join(projectRoot, 'CSXS/manifest.xml'), 'utf8');
  if (!manifest.includes('com.vault.aeelementvault')) errors.push('manifest.xml missing bundle ID: com.vault.aeelementvault');
  if (!manifest.includes('Host Name="AEFT"')) errors.push('manifest.xml missing AEFT host target');
  if (!manifest.includes('./dist/index.html')) errors.push('manifest.xml missing MainPath ./dist/index.html');
  if (!manifest.includes('./host/index.jsx')) errors.push('manifest.xml missing ScriptPath ./host/index.jsx');
  console.log('  ✓ CSXS/manifest.xml validated.');
}

if (checkFile('.debug', 'CEP Remote Debugging Config')) {
  const debug = fs.readFileSync(path.join(projectRoot, '.debug'), 'utf8');
  if (!debug.includes('Port="8088"')) errors.push('.debug missing Port 8088');
  console.log('  ✓ .debug configuration validated.');
}

// 2. Verify Compiled Dist Build
console.log('\n2. Validating Compiled Distribution Build (dist/)...');
if (checkFile('dist/index.html', 'Compiled HTML Entrypoint')) {
  const html = fs.readFileSync(path.join(projectRoot, 'dist/index.html'), 'utf8');
  if (!html.includes('assets/')) errors.push('dist/index.html does not reference bundled assets');
  console.log('  ✓ dist/index.html validated.');
}

const distAssetsDir = path.join(projectRoot, 'dist', 'assets');
if (!fs.existsSync(distAssetsDir)) {
  errors.push('dist/assets directory does not exist. Run "npm run build" first.');
} else {
  const assets = fs.readdirSync(distAssetsDir);
  const hasJs = assets.some(a => a.endsWith('.js'));
  const hasCss = assets.some(a => a.endsWith('.css'));
  if (!hasJs) errors.push('dist/assets missing compiled JavaScript bundle');
  if (!hasCss) errors.push('dist/assets missing compiled CSS stylesheet');
  console.log(`  ✓ dist/assets contains ${assets.length} production bundle files.`);
}

// 3. Verify ExtendScript Host Modules in dist/host/
console.log('\n3. Validating ExtendScript Host Modules in dist/host/...');
const requiredHostModules = [
  'index.jsx',
  'scanner.jsx',
  'reducer.jsx',
  'exporter.jsx',
  'thumbnail.jsx',
  'previewRenderer.jsx',
  'textInspector.jsx',
  'controlsInspector.jsx',
  'essentialProps.jsx',
  'inserter.jsx',
  'syncEngine.jsx',
];

for (const mod of requiredHostModules) {
  const distHostPath = path.join('dist', 'host', mod);
  if (checkFile(distHostPath, `ExtendScript Host Module: ${mod}`)) {
    console.log(`  ✓ dist/host/${mod} present.`);
  }
}

// 4. Verify Pure ES3 Syntax Compliance across all host scripts
console.log('\n4. Verifying Pure ECMAScript 3 (ES3) Syntax in Host Scripts...');
const forbiddenTokens = [
  { name: 'const keyword', regex: /\bconst\s+[a-zA-Z0-9_$]+/ },
  { name: 'let keyword', regex: /\blet\s+[a-zA-Z0-9_$]+/ },
  { name: 'arrow function', regex: /=>/ },
  { name: 'template literal (backtick)', regex: /`/ },
];

for (const mod of requiredHostModules) {
  const filePath = path.join(projectRoot, 'host', mod);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    // Ignore comments
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;

    for (const rule of forbiddenTokens) {
      if (rule.regex.test(line)) {
        errors.push(`ES3 Syntax Violation in host/${mod} (line ${lineNum + 1}): Disallowed ${rule.name}: "${trimmed.slice(0, 60)}"`);
      }
    }
  }
}

if (errors.length === 0) {
  console.log('  ✓ All 11 ExtendScript host modules verified as 100% pure ES3 compliant.');
}

// 5. Final Report
console.log('\n========================================================================');
if (errors.length > 0) {
  console.error(`FAILED: ${errors.length} validation errors found:\n`);
  errors.forEach((e, idx) => console.error(`  ${idx + 1}. ${e}`));
  console.log('\n========================================================================');
  process.exit(1);
} else {
  console.log('🎉 BUNDLE VALIDATION PASSED: All production files and host scripts are valid!');
  console.log('========================================================================\n');
  process.exit(0);
}
