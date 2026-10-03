// Builds the app icon from the game's own art: the Product launch rocket on a glossy purple tile.
// Run: node scripts/app-icon.mjs   (macOS: uses qlmanage and sips to render PNGs)
// Outputs: design/app-icon.svg, public/icon.png (512, for the web) and the 1024 iOS icon (no alpha).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const item = readFileSync(join(root, 'assets/items/code-6-product-launch.svg'), 'utf8');
// The item's inner markup (defs + shapes), nested at icon scale. Its ids don't clash with ours.
const inner = item.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
<defs>
<radialGradient id="icon-bg" cx="35%" cy="28%" r="85%"><stop offset="0" stop-color="#e6d8ff"/><stop offset="0.45" stop-color="#8f63f0"/><stop offset="1" stop-color="#4f2fb0"/></radialGradient>
<radialGradient id="icon-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff4bd" stop-opacity="0.9"/><stop offset="1" stop-color="#fff4bd" stop-opacity="0"/></radialGradient>
<filter id="icon-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
</defs>
<rect width="1024" height="1024" fill="url(#icon-bg)"/>
<circle cx="520" cy="520" r="360" fill="url(#icon-glow)"/>
<ellipse cx="300" cy="170" rx="230" ry="70" fill="#fff" opacity="0.35" transform="rotate(-20 300 170)" filter="url(#icon-blur)"/>
<circle cx="230" cy="760" r="34" fill="#fff4bd"/><circle cx="820" cy="300" r="24" fill="#fff4bd"/><circle cx="790" cy="800" r="18" fill="#ffdcea"/>
<svg x="132" y="112" width="760" height="760" viewBox="0 0 120 120">${inner}</svg>
</svg>
`;

writeFileSync(join(root, 'design/app-icon.svg'), svg);

const tmp = mkdtempSync(join(tmpdir(), 'icon-'));
const svgPath = join(tmp, 'app-icon.svg');
writeFileSync(svgPath, svg);
execFileSync('qlmanage', ['-t', '-s', '1024', '-o', tmp, svgPath], { stdio: 'ignore' });
const png = join(tmp, 'app-icon.svg.png');

// App Store icons must have no alpha channel: round-trip through JPEG to flatten it.
const jpg = join(tmp, 'flat.jpg');
execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '100', png, '--out', jpg], { stdio: 'ignore' });
const ios = join(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
execFileSync('sips', ['-s', 'format', 'png', jpg, '--out', ios], { stdio: 'ignore' });

copyFileSync(ios, join(tmp, 'web.png'));
execFileSync('sips', ['-Z', '512', join(tmp, 'web.png'), '--out', join(root, 'public/icon.png')], { stdio: 'ignore' });
console.log('Wrote design/app-icon.svg, public/icon.png and the iOS AppIcon');
