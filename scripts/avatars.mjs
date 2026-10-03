// Builds the glossy-vinyl character avatars into assets/avatars/. Run: node scripts/avatars.mjs
// Each character is a tech archetype (never a real person's likeness). Add new cast to `cast`;
// ids must match src/content/characters.ts.
import { writeFileSync, mkdirSync } from 'node:fs';

const out = new URL('../assets/avatars', import.meta.url).pathname;
mkdirSync(out, { recursive: true });

// highlight → base → shadow, as in CLAUDE.md §5, plus skin, hair and grey tones.
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
  grey: ['#f4f6fa', '#a9b4c6', '#6b778c'],
  skinLight: ['#ffeadb', '#f7c9a8', '#d0946c'],
  skinMid: ['#f9d4b0', '#d9a074', '#a46d47'],
  skinDeep: ['#d6a07c', '#8d5a3b', '#5a3622'],
  hairBlack: ['#6f6890', '#2e2840', '#1a1526'],
  hairBrown: ['#c48a5e', '#6e4628', '#45291a'],
  hairGrey: ['#ffffff', '#d5dae5', '#9aa3b8'],
};
const INK = '#2a2140';

const grad = (id, [hi, base, lo], mid = 0.55) =>
  `<radialGradient id="${id}" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="${hi}"/><stop offset="${mid}" stop-color="${base}"/><stop offset="1" stop-color="${lo}"/></radialGradient>`;
const shine = (cx, cy, rx, ry, rot = -25, o = 0.6) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o}" transform="rotate(${rot} ${cx} ${cy})" filter="url(#b1)"/>`;

// ---- Parts -----------------------------------------------------------------

const hair = {
  bun: {
    back: '<circle cx="60" cy="19" r="13" fill="url(#hair)"/><path d="M28 56 Q26 26 60 26 Q94 26 92 56 V86 Q92 96 82 96 H38 Q28 96 28 86 Z" fill="url(#hair)"/>',
    front: '<path d="M32 58 Q30 26 60 26 Q86 26 88 50 Q74 46 64 36 Q52 48 32 58 Z" fill="url(#hair)"/>',
  },
  bob: {
    back: '<rect x="27" y="28" width="66" height="58" rx="26" fill="url(#hair)"/>',
    front: '<path d="M32 54 Q30 22 60 22 Q90 22 88 54 Q86 46 79 44 Q60 40 41 44 Q34 46 32 54 Z" fill="url(#hair)"/>',
  },
  curly: {
    back: '',
    front: [[34, 48, 12], [42, 35, 12], [54, 28, 13], [67, 28, 13], [79, 35, 12], [86, 48, 12]]
      .map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#hair)"/>`).join(''),
  },
  // Side tufts only: the professor's shiny dome.
  tufts: {
    back: '',
    front: '<rect x="27" y="42" width="15" height="24" rx="7.5" fill="url(#hair)"/><rect x="78" y="42" width="15" height="24" rx="7.5" fill="url(#hair)"/>',
  },
  none: { back: '', front: '' },
};

const eyes = {
  dots: `<ellipse cx="49" cy="60" rx="4" ry="5" fill="${INK}"/><ellipse cx="71" cy="60" rx="4" ry="5" fill="${INK}"/>`,
  // Half-closed with bags: three energy drinks deep.
  tired: (skin) =>
    `<ellipse cx="49" cy="68" rx="7" ry="3.5" fill="${P[skin][2]}" opacity="0.55"/><ellipse cx="71" cy="68" rx="7" ry="3.5" fill="${P[skin][2]}" opacity="0.55"/>` +
    `<rect x="44" y="59" width="10" height="5" rx="2.5" fill="${INK}"/><rect x="66" y="59" width="10" height="5" rx="2.5" fill="${INK}"/>`,
  // Heavy-lidded, very pleased with himself.
  smug: `<path d="M44 60 Q49 55 54 60 Q49 64 44 60 Z" fill="${INK}"/><path d="M66 60 Q71 55 76 60 Q71 64 66 60 Z" fill="${INK}"/>`,
  none: '',
};

const mouths = {
  smile: `<path d="M51 72 Q60 83 69 72 Q60 76 51 72 Z" fill="${INK}"/>`,
  grin: `<path d="M47 70 Q60 90 73 70 Z" fill="${INK}"/><rect x="51" y="70" width="18" height="5" rx="2.5" fill="#fff"/>`,
  smirk: `<path d="M52 74 Q63 80 72 69 Q64 76 52 74 Z" fill="${INK}"/>`,
  flat: `<rect x="53" y="73" width="14" height="5" rx="2.5" fill="${INK}"/>`,
  // Mid-pitch: "We're Uber, but for flatmates."
  talk: `<ellipse cx="60" cy="75" rx="6" ry="5" fill="${INK}"/>`,
};

const bodies = {
  // Black skivvy: the visionary-founder starter pack.
  turtleneck: () =>
    `<ellipse cx="60" cy="122" rx="44" ry="32" fill="url(#ink)"/><rect x="44" y="76" width="32" height="22" rx="11" fill="url(#ink)"/>` + shine(48, 84, 6, 3, -10, 0.35),
  hoodie: () =>
    `<ellipse cx="60" cy="122" rx="46" ry="33" fill="url(#cloth)"/>` +
    `<rect x="47" y="94" width="6" height="18" rx="3" fill="#fff" opacity="0.9"/><rect x="67" y="94" width="6" height="18" rx="3" fill="#fff" opacity="0.9"/>`,
  // Fleece vest over a business-casual shirt.
  vest: () =>
    `<ellipse cx="60" cy="122" rx="44" ry="32" fill="url(#cloth)"/><path d="M50 90 L60 108 L70 90 Z" fill="#fff"/>` +
    `<path d="M18 120 Q16 94 40 90 Q48 89 50 92 L58 120 Z" fill="url(#vest)"/><path d="M102 120 Q104 94 80 90 Q72 89 70 92 L62 120 Z" fill="url(#vest)"/>` +
    shine(32, 100, 7, 3, -20, 0.5),
  // Cardigan, shirt, and a pocket full of pens.
  cardigan: () =>
    `<ellipse cx="60" cy="122" rx="44" ry="32" fill="url(#cloth)"/><path d="M46 90 L60 116 L74 90 Z" fill="url(#paper)"/>` +
    `<rect x="76" y="98" width="6" height="14" rx="3" fill="${P.red[1]}"/><rect x="84" y="96" width="6" height="16" rx="3" fill="${P.blue[1]}"/>` +
    `<rect x="72" y="104" width="22" height="12" rx="6" fill="${P.kraft[2]}"/>`,
};

const backs = {
  // Hood up, behind the head.
  hood: '<path d="M22 72 Q20 16 60 15 Q100 16 98 72 Q98 96 60 98 Q22 96 22 72 Z" fill="url(#cloth)"/>',
};

const gear = {
  headset: `<path d="M31 62 Q30 80 46 80" fill="none" stroke="url(#ink)" stroke-width="7" stroke-linecap="round"/><circle cx="47" cy="80" r="5" fill="url(#ink)"/>` +
    `<rect x="25" y="52" width="13" height="20" rx="6.5" fill="url(#ink)"/>`,
  headphones: `<path d="M27 62 Q26 20 60 20 Q94 20 93 62" fill="none" stroke="url(#ink)" stroke-width="9" stroke-linecap="round"/>` +
    `<rect x="18" y="48" width="18" height="30" rx="9" fill="url(#red)"/><rect x="84" y="48" width="18" height="30" rx="9" fill="url(#red)"/>` + shine(24, 56, 3, 6, 0, 0.7),
  vr: `<rect x="24" y="52" width="72" height="10" rx="5" fill="url(#ink)"/><rect x="29" y="43" width="62" height="30" rx="15" fill="url(#ink)"/>` +
    `<rect x="33" y="46" width="54" height="22" rx="11" fill="url(#blue)"/>` + shine(44, 51, 9, 3, -10, 0.85) +
    `<circle cx="80" cy="62" r="3" fill="#b8f6d4"/>`,
  airpods: `<rect x="26" y="58" width="8" height="14" rx="4" fill="url(#paper)"/><rect x="86" y="58" width="8" height="14" rx="4" fill="url(#paper)"/>`,
  // Mirrored shades pushed up on the head, indoors.
  shadesUp: `<rect x="33" y="24" width="24" height="16" rx="8" fill="url(#ink)"/><rect x="63" y="24" width="24" height="16" rx="8" fill="url(#ink)"/>` +
    `<rect x="36" y="27" width="18" height="10" rx="5" fill="url(#blue)"/><rect x="66" y="27" width="18" height="10" rx="5" fill="url(#blue)"/>` +
    `<rect x="54" y="28" width="12" height="6" rx="3" fill="url(#ink)"/>` + shine(41, 29, 4, 2, -10, 0.85) + shine(71, 29, 4, 2, -10, 0.85),
  glasses: `<g fill="#fff" fill-opacity="0.2" stroke="${P.purple[2]}" stroke-width="4.5"><circle cx="48" cy="60" r="10.5"/><circle cx="72" cy="60" r="10.5"/></g>` +
    `<rect x="56" y="57" width="8" height="5" rx="2.5" fill="${P.purple[2]}"/>`,
  earpiece: `<rect x="85" y="54" width="9" height="20" rx="4.5" fill="url(#ink)"/><circle cx="89.5" cy="58" r="2" fill="#b8f6d4"/>`,
  // Grey professor beard, drawn under the mouth.
  beard: `<path d="M34 64 Q36 96 60 98 Q84 96 86 64 Q80 82 60 82 Q40 82 34 64 Z" fill="url(#hair)"/>`,
};

// ---- Assembly --------------------------------------------------------------

function avatar(c) {
  const eyeSvg = typeof eyes[c.eyes] === 'function' ? eyes[c.eyes](c.skin) : eyes[c.eyes];
  const defs = [
    grad('tile', P[c.tile]), grad('skin', P[c.skin]), grad('hair', P[c.hair]), grad('cloth', P[c.cloth], 0.5),
    grad('vest', P.grey), grad('ink', P.ink, 0.6), grad('paper', P.paper, 0.45), grad('red', P.red, 0.5), grad('blue', P.blue, 0.5),
  ].join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="240" height="240"><defs>${defs}<clipPath id="clip"><rect x="6" y="4" width="108" height="108" rx="32"/></clipPath><filter id="b1" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.2"/></filter><filter id="b2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter></defs>
<rect x="6" y="9" width="108" height="108" rx="32" fill="${P[c.tile][2]}"/>
<rect x="6" y="4" width="108" height="108" rx="32" fill="url(#tile)"/>
<g clip-path="url(#clip)">
${(c.back && backs[c.back]) || ''}
${hair[c.hairStyle].back}
<rect x="49" y="72" width="22" height="24" rx="11" fill="${P[c.skin][2]}"/>
${bodies[c.body]()}
<circle cx="32" cy="60" r="8" fill="${P[c.skin][1]}"/>
<circle cx="88" cy="60" r="8" fill="${P[c.skin][1]}"/>
<ellipse cx="60" cy="57" rx="27" ry="29" fill="url(#skin)"/>
${shine(47, 40, 8, 4, -25, 0.55)}
${c.beard ? gear.beard : ''}
${hair[c.hairStyle].front}
${eyeSvg}
<ellipse cx="41" cy="71" rx="5" ry="3" fill="#ff8cb8" opacity="0.4"/>
<ellipse cx="79" cy="71" rx="5" ry="3" fill="#ff8cb8" opacity="0.4"/>
${mouths[c.mouth]}
${(c.gear ?? []).map((g) => gear[g]).join('\n')}
</g>
<ellipse cx="30" cy="20" rx="14" ry="5" fill="#fff" opacity="0.7" transform="rotate(-25 30 20)" filter="url(#b2)"/>
</svg>
`;
}

const cast = {
  // The visionary founder, aged 19. Practising the pitch in the shower.
  mia: { tile: 'pink', skin: 'skinMid', hair: 'hairBrown', hairStyle: 'bun', cloth: 'ink', body: 'turtleneck', eyes: 'dots', mouth: 'talk', gear: ['headset'] },
  // Hood up, headphones on, hasn't seen daylight since the hackathon.
  josh: { tile: 'orange', skin: 'skinDeep', hair: 'hairBlack', hairStyle: 'none', cloth: 'green', back: 'hood', body: 'hoodie', eyes: 'tired', mouth: 'flat', gear: ['headphones'] },
  // Lives in the metaverse. Rent is still due in the real one.
  lin: { tile: 'green', skin: 'skinLight', hair: 'hairBlack', hairStyle: 'bob', cloth: 'yellow', body: 'hoodie', eyes: 'none', mouth: 'grin', gear: ['vr'] },
  // Future VC. Fleece vest, AirPods, shades on his head indoors.
  dev: { tile: 'yellow', skin: 'skinMid', hair: 'hairBlack', hairStyle: 'curly', cloth: 'blue', body: 'vest', eyes: 'smug', mouth: 'smirk', gear: ['shadesUp', 'airpods'] },
  // Taught the founders of three unicorns. Still uses a Bluetooth earpiece.
  brooks: { tile: 'purple', skin: 'skinLight', hair: 'hairGrey', hairStyle: 'tufts', cloth: 'kraft', body: 'cardigan', beard: true, eyes: 'dots', mouth: 'smile', gear: ['glasses', 'earpiece'] },
};

for (const [id, spec] of Object.entries(cast)) writeFileSync(`${out}/${id}.svg`, avatar(spec));
console.log(Object.keys(cast).join(', '));
