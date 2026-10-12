import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('========================================================================');
console.log('         AE ELEMENT VAULT - EXTENSION PACKAGER');
console.log('========================================================================\n');

// 1. Read package version
const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
const version = pkg.version || '1.0.0';
const releaseDir = path.join(projectRoot, 'release');
const zipFileName = `ae-element-vault-v${version}.zip`;
const zipPath = path.join(releaseDir, zipFileName);

if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

// 2. Prepare staging directory for clean distribution packaging
const stageDir = path.join(releaseDir, 'ae-element-vault');
if (fs.existsSync(stageDir)) {
  fs.rmSync(stageDir, { recursive: true, force: true });
}
fs.mkdirSync(stageDir, { recursive: true });

console.log(`1. Staging release files into temporary bundle at: ${stageDir}...`);

// Copy function
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Folders and files to include in release distribution
const itemsToInclude = [
  'CSXS',
  'dist',
  'host',
  '.debug',
  'install.bat',
  'install.sh',
  'uninstall.bat',
  'uninstall.sh',
  'package.json',
  'README.md',
];

for (const item of itemsToInclude) {
  const srcPath = path.join(projectRoot, item);
  const destPath = path.join(stageDir, item);
  if (fs.existsSync(srcPath)) {
    copyRecursive(srcPath, destPath);
    console.log(`  ✓ Included ${item}`);
  } else {
    console.warn(`  [WARN] Item not found: ${item}`);
  }
}

// 3. Compress into zip archive
console.log(`\n2. Compressing release archive into: ${zipPath}...`);
if (fs.existsSync(zipPath)) {
  fs.rmSync(zipPath, { force: true });
}

try {
  if (process.platform === 'win32') {
    // Windows PowerShell Compress-Archive using execFileSync to avoid quoting issues with spaces
    const psScript = `Compress-Archive -Path '${stageDir.replace(/'/g, "''")}\\*' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`;
    execSync(`powershell.exe -NoProfile -Command "& { ${psScript} }"`, { stdio: 'inherit' });
  } else {
    // macOS / Linux zip command
    execSync(`cd "${releaseDir}" && zip -r "${zipFileName}" "ae-element-vault"`, { stdio: 'inherit' });
  }

  // Cleanup stage dir
  fs.rmSync(stageDir, { recursive: true, force: true });

  const stat = fs.statSync(zipPath);
  const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
  const sizeKb = (stat.size / 1024).toFixed(1);

  console.log('\n========================================================================');
  console.log(`🎉 RELEASE ARCHIVE GENERATED SUCCESSFULLY!`);
  console.log(`   File: ${zipFileName}`);
  console.log(`   Size: ${stat.size > 1048576 ? sizeMb + ' MB' : sizeKb + ' KB'}`);
  console.log(`   Path: ${zipPath}`);
  console.log('========================================================================\n');
} catch (err) {
  console.error('FAILED to create zip archive:', err);
  process.exit(1);
}
