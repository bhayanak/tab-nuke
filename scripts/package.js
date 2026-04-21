import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, resolve } from 'path';

const target = process.argv[2]; // chrome | firefox | edge

if (!['chrome', 'firefox', 'edge'].includes(target)) {
  console.error('Usage: node scripts/package.js <chrome|firefox|edge>');
  process.exit(1);
}

const rootDir = resolve(import.meta.dirname, '..');
const distDir = join(rootDir, 'dist');
const outDir = join(rootDir, `dist-${target}`);

if (!existsSync(distDir)) {
  console.error('dist/ not found. Run "pnpm build" first.');
  process.exit(1);
}

// Create output directory
mkdirSync(outDir, { recursive: true });

// Copy dist to temp location for modification
const tempDir = join(outDir, 'temp');
mkdirSync(tempDir, { recursive: true });
cpSync(distDir, tempDir, { recursive: true });

// Read and modify manifest for target browser
const manifestPath = join(tempDir, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

if (target === 'firefox') {
  // Firefox-specific modifications
  manifest.browser_specific_settings = {
    gecko: {
      id: 'tab-nuke@extension',
      strict_min_version: '109.0',
    },
  };
  // Firefox uses sidebar_action instead of side_panel
  if (manifest.side_panel) {
    manifest.sidebar_action = {
      default_panel: manifest.side_panel.default_path,
      default_title: 'Tab Nuke',
    };
    delete manifest.side_panel;
  }
  // Remove unsupported permissions
  if (manifest.permissions) {
    manifest.permissions = manifest.permissions.filter((p) => p !== 'tabGroups');
  }
} else if (target === 'edge') {
  // Edge uses same manifest as Chrome, minimal changes
  manifest.name = 'Tab Nuke - Smart Tab Manager';
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

// Create archive
const version = manifest.version || '1.0.0';
const ext = target === 'firefox' ? 'xpi' : 'zip';
const filename = `tab-nuke-${version}-${target}.${ext}`;

try {
  process.chdir(tempDir);
  execSync(`zip -r "${join(outDir, filename)}" .`, { stdio: 'inherit' });
  console.log(`\n✅ Package created: dist-${target}/${filename}`);
} catch (e) {
  console.error('Failed to create archive:', e.message);
  process.exit(1);
} finally {
  // Cleanup temp
  execSync(`rm -rf "${tempDir}"`);
}
