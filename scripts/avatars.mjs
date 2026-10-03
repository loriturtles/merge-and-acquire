// Builds the glossy-vinyl character avatars into assets/avatars/. Run: node scripts/avatars.mjs
// Add new cast members to `cast` at the bottom; ids must match src/content/characters.ts.
import { writeFileSync, mkdirSync } from 'node:fs';

const out = new URL('../assets/avatars', import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const P = {
  red: ['#ffb3a6', '#f04f3c', '#a32a1e'],
  orange: ['#ffd0a8', '#ff8a3a', '#c4561a'],
  yellow: ['#fff4bd', '#ffc93a', '#cf8f0c'],
  green: ['#b8f6d4', '#3fbf82', '#1f7a50'],
  blue: ['#d3e7ff', '#3f86f2', '#1f4fa8'],
  purple: ['#e6d8ff', '#8f63f0', '#4f2fb0'],
  pink: ['#ffdcea', '#ff8cb8', '#c94f80'],
  paper: ['#ffffff', '#f2f4f9', '#c3cbdb'],
  kraft: ['#fae2bc', '#d9b27a', '#9c7440'],
  ink: ['#8a81b8', '#3a3358', '#221b38'],
  // Skin and hair tones (same highlight → base → shadow structure)
  skinLight: ['#ffeadb', '#f7c9a8', '#d0946c'],
  skinMid: ['#f9d4b0', '#d9a074', '#a46d47'],
  skinDeep: ['#d6a07c', '#8d5a3b', '#5a3622'],
  hairBlack: ['#6f6890', '#2e2840', '#1a1526'],
  hairBrown: ['#c48a5e', '#6e4628', '#45291a'],
  hairGrey: ['#ffffff', '#d5dae5', '#9aa3b8'],
};

const grad = (id, [hi, base, lo], mid = 0.5) =>
  `<radialGradient id="${id}" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="${hi}"/><stop offset="${mid}" stop-color="${base}"/><stop offset="1" stop-color="${lo}"/></radialGradient>`;

const hairStyles = {
  // Short, close crop
  short: {
    back: '',
    front: '<path d="M32 56 Q29 22 60 21 Q91 22 88 56 Q84 42 72 38 Q60 35 48 38 Q36 42 32 56 Z" fill="url(#hair)"/>',
  },
  // Bob with a full fringe
  bob: {
    back: '<rect x="27" y="28" width="66" height="58" rx="26" fill="url(#hair)"/>',
    front: '<path d="M32 54 Q30 22 60 22 Q90 22 88 54 Q86 46 79 44 Q60 40 41 44 Q34 46 32 54 Z" fill="url(#hair)"/>',
  },
  // Long hair with a top bun
  bun: {
    back: '<circle cx="60" cy="20" r="13" fill="url(#hair)"/><path d="M28 56 Q26 26 60 26 Q94 26 92 56 V86 Q92 96 82 96 H38 Q28 96 28 86 Z" fill="url(#hair)"/>',
    front: '<path d="M32 58 Q30 26 60 26 Q86 26 88 50 Q74 46 64 36 Q52 48 32 58 Z" fill="url(#hair)"/>',
  },
  // Big round curls
  curly: {
    back: '',
    front: ['34,48,12', '42,35,12', '54,28,13', '67,28,13', '79,35,12', '86,48,12'].map((c) => {
      const [cx, cy, r] = c.split(',');
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#hair)"/>`;
    }).join(''),
  },
  // Side tufts and a neat swoop, for the tutor
  swoop: {
    back: '',
    front: '<rect x="28" y="40" width="14" height="26" rx="7" fill="url(#hair)"/><rect x="78" y="40" width="14" height="26" rx="7" fill="url(#hair)"/><path d="M34 46 Q34 24 60 24 Q84 24 86 44 Q72 34 54 36 Q42 38 34 46 Z" fill="url(#hair)"/>',
  },
};

function avatar({ tile, skin, hair, hairStyle, shirt, glasses = false }) {
  const h = hairStyles[hairStyle];
  const specs = glasses
    ? '<g fill="#ffffff" fill-opacity="0.2" stroke="#4f2fb0" stroke-width="4.5"><circle cx="48" cy="60" r="10.5"/><circle cx="72" cy="60" r="10.5"/></g><rect x="56" y="57" width="8" height="5" rx="2.5" fill="#4f2fb0"/>'
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="240" height="240"><defs>${grad('tile', P[tile], 0.55)}${grad('skin', P[skin], 0.55)}${grad('hair', P[hair], 0.55)}${grad('shirt', P[shirt])}${grad('ink', P.ink, 0.6)}<clipPath id="clip"><rect x="6" y="4" width="108" height="108" rx="32"/></clipPath><filter id="d-blur1" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.2"/></filter><filter id="d-blur2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter></defs>
<rect x="6" y="9" width="108" height="108" rx="32" fill="${P[tile][2]}"/>
<rect x="6" y="4" width="108" height="108" rx="32" fill="url(#tile)"/>
<g clip-path="url(#clip)">
${h.back}
<rect x="49" y="72" width="22" height="24" rx="11" fill="${P[skin][2]}"/>
<ellipse cx="60" cy="122" rx="44" ry="32" fill="url(#shirt)"/>
<ellipse cx="44" cy="100" rx="10" ry="4" fill="#ffffff" opacity="0.6" transform="rotate(-20 44 100)" filter="url(#d-blur1)"/>
<circle cx="32" cy="60" r="8" fill="${P[skin][1]}"/>
<circle cx="88" cy="60" r="8" fill="${P[skin][1]}"/>
<ellipse cx="60" cy="57" rx="27" ry="29" fill="url(#skin)"/>
${h.front}
<ellipse cx="49" cy="60" rx="4" ry="5" fill="#2a2140"/>
<ellipse cx="71" cy="60" rx="4" ry="5" fill="#2a2140"/>
<ellipse cx="42" cy="70" rx="5" ry="3" fill="#ff8cb8" opacity="0.45"/>
<ellipse cx="78" cy="70" rx="5" ry="3" fill="#ff8cb8" opacity="0.45"/>
<path d="M51 71 Q60 82 69 71 Q60 75 51 71 Z" fill="#2a2140"/>
${specs}
<ellipse cx="47" cy="44" rx="8" ry="4" fill="#ffffff" opacity="0.55" transform="rotate(-25 47 44)" filter="url(#d-blur1)"/>
</g>
<ellipse cx="30" cy="20" rx="14" ry="5" fill="#ffffff" opacity="0.7" transform="rotate(-25 30 20)" filter="url(#d-blur2)"/>
</svg>
`;
}

const cast = {
  mia: { tile: 'pink', skin: 'skinMid', hair: 'hairBrown', hairStyle: 'bun', shirt: 'purple' },
  josh: { tile: 'orange', skin: 'skinDeep', hair: 'hairBlack', hairStyle: 'short', shirt: 'blue' },
  lin: { tile: 'green', skin: 'skinLight', hair: 'hairBlack', hairStyle: 'bob', shirt: 'yellow' },
  dev: { tile: 'yellow', skin: 'skinMid', hair: 'hairBlack', hairStyle: 'curly', shirt: 'green' },
  brooks: { tile: 'purple', skin: 'skinLight', hair: 'hairGrey', hairStyle: 'swoop', shirt: 'kraft', glasses: true },
};

for (const [id, spec] of Object.entries(cast)) writeFileSync(`${out}/${id}.svg`, avatar(spec));
console.log(Object.keys(cast).join(', '));
