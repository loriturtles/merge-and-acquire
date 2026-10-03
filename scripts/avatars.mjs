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
  skinTan: ['#ffe0c2', '#e8b48a', '#b57a50'],
  skinDarker: ['#b98466', '#5e3a26', '#3a2216'],
  hairBlonde: ['#fff4bd', '#f2c86a', '#b98a36'],
  hairRed: ['#ffc4a0', '#d9682e', '#9a3f17'],
  // Screen glow for the CTO's lenses.
  glow: ['#ffffff', '#7fe3ff', '#2fa0f0'],
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
  // Wisps poking out from under a beanie.
  fringe: {
    back: '<rect x="29" y="36" width="62" height="38" rx="19" fill="url(#hair)"/>',
    front: [[40, 47, 7], [51, 49, 7], [63, 49, 7], [75, 47, 7]]
      .map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#hair)"/>`).join(''),
  },
  // Sleek bob with a side swoop: board-meeting ready.
  sleekBob: {
    back: '<rect x="26" y="26" width="68" height="60" rx="24" fill="url(#hair)"/>',
    front: '<path d="M31 64 Q27 22 62 21 Q93 22 89 62 Q86 44 76 40 Q60 34 47 48 Q38 58 31 64 Z" fill="url(#hair)"/>',
  },
  // Slept at the desk. Again.
  messy: {
    back: '',
    front: '<path d="M33 54 Q30 30 60 29 Q90 30 87 54 Q80 42 60 42 Q40 42 33 54 Z" fill="url(#hair)"/>' +
      [[38, 40, 8], [48, 33, 9], [61, 31, 9], [73, 33, 9], [83, 41, 8]]
        .map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#hair)"/>`).join(''),
  },
  // Tidy side part.
  neat: {
    back: '<rect x="28" y="30" width="64" height="44" rx="22" fill="url(#hair)"/>',
    front: '<path d="M32 56 Q30 24 58 24 Q90 24 88 56 Q84 38 66 36 Q56 36 50 41 Q44 37 40 43 Q34 47 32 56 Z" fill="url(#hair)"/>',
  },
  short: {
    back: '',
    front: '<path d="M33 54 Q30 23 60 23 Q90 23 87 54 Q82 34 60 33 Q38 34 33 54 Z" fill="url(#hair)"/>',
  },
  // Big sales-kickoff blowout.
  volume: {
    back: '<ellipse cx="60" cy="54" rx="42" ry="36"/><ellipse cx="25" cy="78" rx="13" ry="14"/><ellipse cx="95" cy="78" rx="13" ry="14"/>'.replace(/\/>/g, ' fill="url(#hair)"/>'),
    front: '<path d="M30 58 Q25 17 60 17 Q95 17 90 58 Q84 36 64 33 Q50 40 30 58 Z" fill="url(#hair)"/>',
  },
  slick: {
    back: '',
    front: '<path d="M33 52 Q31 22 60 22 Q89 22 87 52 Q80 33 60 32 Q40 33 33 52 Z" fill="url(#hair)"/>' + shine(50, 27, 9, 2.5, -8, 0.7),
  },
  // Silver-fox swoop.
  swept: {
    back: '',
    front: '<path d="M32 54 Q27 19 58 17 Q93 15 89 50 Q80 31 63 34 Q44 37 32 54 Z" fill="url(#hair)"/>' + shine(48, 24, 9, 3, -15, 0.75),
  },
  // Tall LinkedIn-headshot quiff.
  quiff: {
    back: '',
    front: '<path d="M33 52 Q31 28 48 25 Q46 9 66 9 Q86 11 81 27 Q90 33 87 52 Q80 36 60 36 Q40 36 33 52 Z" fill="url(#hair)"/>' + shine(60, 16, 7, 3, -20, 0.6),
  },
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
  // Wide and shiny: "Have you got 5 minutes for a quick chat?"
  eager: `<circle cx="49" cy="59" r="6.5" fill="${INK}"/><circle cx="71" cy="59" r="6.5" fill="${INK}"/>` +
    `<circle cx="46.5" cy="56.5" r="2.5" fill="#fff"/><circle cx="68.5" cy="56.5" r="2.5" fill="#fff"/>`,
  // Squeezed shut by the grin.
  happy: `<path d="M43 62 Q49 54 55 62 M65 62 Q71 54 77 62" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
  // Calm, unbothered, already thinking about the offsite.
  calm: `<path d="M44 61 Q49 65 54 61 M66 61 Q71 65 76 61" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`,
};

const brows = {
  // One brow up: "And what's the TAM on that?"
  raised: '<rect x="42" y="47" width="13" height="4.5" rx="2.25" fill="url(#hair)" transform="rotate(4 48 49)"/>' +
    '<rect x="65" y="43" width="13" height="4.5" rx="2.25" fill="url(#hair)" transform="rotate(-14 71 45)"/>',
  high: '<rect x="42" y="45" width="13" height="4.5" rx="2.25" fill="url(#hair)" transform="rotate(-10 48 47)"/>' +
    '<rect x="65" y="45" width="13" height="4.5" rx="2.25" fill="url(#hair)" transform="rotate(10 71 47)"/>',
};

const mouths = {
  smile: `<path d="M51 72 Q60 83 69 72 Q60 76 51 72 Z" fill="${INK}"/>`,
  grin: `<path d="M47 70 Q60 90 73 70 Z" fill="${INK}"/><rect x="51" y="70" width="18" height="5" rx="2.5" fill="#fff"/>`,
  smirk: `<path d="M52 74 Q63 80 72 69 Q64 76 52 74 Z" fill="${INK}"/>`,
  flat: `<rect x="53" y="73" width="14" height="5" rx="2.5" fill="${INK}"/>`,
  // Mid-pitch: "We're Uber, but for flatmates."
  talk: `<ellipse cx="60" cy="75" rx="6" ry="5" fill="${INK}"/>`,
  // Quota-crushing grin, tongue and all.
  beam: `<path d="M42 68 Q60 98 78 68 Z" fill="${INK}"/><rect x="46" y="68" width="28" height="6" rx="3" fill="#fff"/>` +
    `<ellipse cx="60" cy="84" rx="8" ry="4" fill="${P.pink[1]}"/>`,
  calm: `<path d="M50 73 Q60 80 70 73" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`,
  // Wobbly "it worked on my machine".
  wobble: `<path d="M50 75 Q55 71 60 75 Q65 79 70 75" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`,
  none: '',
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
  // Hood down, bunched round the neck, drawstrings.
  hoodieDown: (c) =>
    `<ellipse cx="60" cy="122" rx="46" ry="33" fill="url(#cloth)"/>` +
    `<ellipse cx="60" cy="94" rx="30" ry="11" fill="${P[c.cloth][2]}"/><ellipse cx="60" cy="92" rx="27" ry="8" fill="url(#cloth)"/>` +
    `<rect x="50" y="78" width="20" height="16" rx="8" fill="${P[c.skin][2]}"/>` +
    `<rect x="49" y="98" width="6" height="18" rx="3" fill="#fff" opacity="0.9"/><rect x="65" y="98" width="6" height="18" rx="3" fill="#fff" opacity="0.9"/>`,
  // Blazer over a grey hoodie: "we're still a startup at heart".
  blazerHoodie: (c) =>
    `<ellipse cx="60" cy="122" rx="46" ry="33" fill="url(#vest)"/>` +
    `<ellipse cx="60" cy="93" rx="27" ry="9" fill="${P.grey[2]}"/><ellipse cx="60" cy="91" rx="24" ry="6.5" fill="url(#vest)"/>` +
    `<rect x="50" y="78" width="20" height="14" rx="7" fill="${P[c.skin][2]}"/>` +
    `<path d="M14 122 Q12 96 38 90 Q44 89 46 93 L56 122 Z" fill="url(#cloth)"/><path d="M106 122 Q108 96 82 90 Q76 89 74 93 L64 122 Z" fill="url(#cloth)"/>` +
    shine(30, 102, 7, 3, -20, 0.45),
  // Suit, white shirt, power tie.
  suit: () =>
    `<ellipse cx="60" cy="122" rx="45" ry="32" fill="url(#cloth)"/><path d="M47 89 L60 118 L73 89 Z" fill="url(#paper)"/>` +
    `<path d="M55 93 H65 L64 99 H56 Z" fill="${P.red[2]}"/><path d="M56 98 H64 L67 112 Q60 122 53 112 Z" fill="url(#red)"/>` +
    shine(34, 100, 7, 3, -20, 0.35),
  // Quarter-zip with a stand collar: the angel-round uniform.
  quarterZip: (c) =>
    `<ellipse cx="60" cy="122" rx="45" ry="32" fill="url(#cloth)"/>` +
    `<rect x="42" y="80" width="36" height="20" rx="10" fill="${P[c.cloth][2]}"/><rect x="44" y="84" width="32" height="16" rx="8" fill="url(#cloth)"/>` +
    `<rect x="57.5" y="86" width="5" height="26" rx="2.5" fill="url(#vest)"/><rect x="55.5" y="104" width="9" height="12" rx="4.5" fill="url(#vest)"/>` +
    shine(36, 100, 7, 3, -20, 0.4),
  shirt: () =>
    `<ellipse cx="60" cy="122" rx="44" ry="32" fill="url(#cloth)"/>` +
    `<path d="M45 88 Q52 92 60 98 L52 108 Q44 100 45 88 Z" fill="url(#paper)"/><path d="M75 88 Q68 92 60 98 L68 108 Q76 100 75 88 Z" fill="url(#paper)"/>`,
  blazer: (c) =>
    `<ellipse cx="60" cy="122" rx="45" ry="32" fill="url(#cloth)"/><path d="M46 89 L60 116 L74 89 Z" fill="url(#paper)"/>` +
    `<path d="M40 92 L46 89 L58 118 L50 120 Z" fill="${P[c.cloth][2]}"/><path d="M80 92 L74 89 L62 118 L70 120 Z" fill="${P[c.cloth][2]}"/>` +
    shine(32, 102, 7, 3, -20, 0.4),
  // Corgi: ginger fur, white chest.
  fur: () =>
    `<ellipse cx="60" cy="124" rx="42" ry="32" fill="url(#orange)"/><ellipse cx="60" cy="112" rx="20" ry="17" fill="url(#paper)"/>`,
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

  // Lenses lit up by forty open terminal tabs; the glow spills onto the cheeks.
  glowGlasses: `<ellipse cx="60" cy="72" rx="24" ry="7" fill="#7fe3ff" opacity="0.25" filter="url(#b2)"/>` +
    `<rect x="30" y="47" width="60" height="25" rx="12" fill="#7fe3ff" opacity="0.55" filter="url(#b3)"/>` +
    `<rect x="32" y="49" width="26" height="21" rx="9" fill="url(#ink)"/><rect x="62" y="49" width="26" height="21" rx="9" fill="url(#ink)"/>` +
    `<rect x="56" y="55" width="8" height="5" rx="2.5" fill="url(#ink)"/>` +
    `<rect x="35.5" y="52.5" width="19" height="14" rx="6" fill="url(#glow)"/><rect x="65.5" y="52.5" width="19" height="14" rx="6" fill="url(#glow)"/>` +
    `<rect x="38" y="56" width="10" height="4" rx="2" fill="#2fa0f0" opacity="0.6"/><rect x="38" y="61" width="13" height="4" rx="2" fill="#2fa0f0" opacity="0.6"/>` +
    `<rect x="68" y="56" width="12" height="4" rx="2" fill="#2fa0f0" opacity="0.6"/><rect x="68" y="61" width="8" height="4" rx="2" fill="#2fa0f0" opacity="0.6"/>`,
  // Slouchy beanie, worn indoors in summer.
  beanie: `<ellipse cx="84" cy="22" rx="17" ry="14" fill="${P.orange[2]}"/><ellipse cx="83" cy="20" rx="15" ry="12" fill="url(#orange)"/>` +
    `<path d="M29 48 Q27 13 62 12 Q90 12 93 48 Z" fill="url(#orange)"/>` +
    `<rect x="27" y="38" width="66" height="15" rx="7.5" fill="${P.orange[2]}"/><rect x="27" y="37" width="66" height="13" rx="6.5" fill="url(#orange)"/>` +
    [36, 46, 56, 66, 76, 86].map((x) => `<rect x="${x - 2}" y="40" width="4" height="8" rx="2" fill="${P.orange[2]}" opacity="0.35"/>`).join('') +
    shine(46, 22, 9, 4, -25, 0.6),
  // Staff lanyard and ID card; colour per wearer.
  lanyard: `<path d="M44 84 L56 104 M76 84 L64 104" stroke="url(#blue)" stroke-width="6" stroke-linecap="round"/>` +
    `<rect x="49" y="101" width="22" height="17" rx="4.5" fill="url(#paper)"/><rect x="52" y="104" width="7" height="8" rx="2.5" fill="${P.blue[1]}"/><rect x="61" y="105" width="7" height="4" rx="2" fill="${P.grey[1]}"/>`,
  lanyardRed: `<path d="M42 90 L55 106 M78 90 L65 106" stroke="url(#red)" stroke-width="6" stroke-linecap="round"/>` +
    `<rect x="47" y="102" width="26" height="18" rx="5" fill="url(#paper)"/><rect x="50" y="105" width="8" height="9" rx="3" fill="${P.orange[1]}"/><rect x="61" y="106" width="9" height="4" rx="2" fill="${P.grey[1]}"/>` + shine(53, 104, 3, 1.5, -10, 0.8),
  // Chunky gold FOUNDER pass. Access all areas.
  lanyardFounder: `<path d="M42 92 L55 106 M78 92 L65 106" stroke="url(#yellow)" stroke-width="8" stroke-linecap="round"/>` +
    `<rect x="44" y="101" width="32" height="18" rx="5" fill="${P.yellow[2]}"/><rect x="44" y="100" width="32" height="17" rx="5" fill="url(#yellow)"/>` +
    `<rect x="49" y="106" width="22" height="5" rx="2.5" fill="${INK}" opacity="0.75"/>` + shine(50, 103, 4, 1.5, -10, 0.8),
  // Rubber duck, mid-debug.
  duck: `<g transform="translate(0 -12)"><ellipse cx="60" cy="40" rx="22" ry="5" fill="#2a2140" opacity="0.22" filter="url(#b1)"/>` +
    `<ellipse cx="41" cy="27" rx="9" ry="7" fill="url(#yellow)" transform="rotate(-30 41 27)"/>` +
    `<ellipse cx="58" cy="34" rx="20" ry="11" fill="${P.yellow[2]}"/><ellipse cx="58" cy="31" rx="20" ry="11" fill="url(#yellow)"/>` +
    `<circle cx="71" cy="18" r="11" fill="url(#yellow)"/>` +
    `<ellipse cx="84" cy="21" rx="8" ry="4.5" fill="url(#orange)"/>` +
    `<circle cx="74" cy="15" r="2.8" fill="${INK}"/><circle cx="73" cy="14" r="1" fill="#fff"/>` +
    `<ellipse cx="54" cy="31" rx="9" ry="5" fill="${P.yellow[2]}" opacity="0.55"/>` +
    shine(66, 12, 4, 2, -25, 0.8) + shine(48, 26, 6, 2, -15, 0.7) + '</g>',
  // Sticky note on the forehead: "ALIGN??"
  sticky: `<g transform="rotate(-9 60 41)"><rect x="44" y="30" width="32" height="26" rx="5" fill="#2a2140" opacity="0.2" filter="url(#b1)"/>` +
    `<path d="M45 29 H75 Q77 29 77 31 V47 Q77 49 75 51 L70 55 Q68 56 66 56 H47 Q45 56 45 54 V31 Q45 29 47 29 Z" fill="url(#yellow)"/>` +
    `<path d="M77 47 L69 55 Q68 49 71 48 Z" fill="${P.yellow[2]}"/>` +
    `<rect x="50" y="36" width="20" height="4" rx="2" fill="${P.yellow[2]}"/><rect x="50" y="44" width="13" height="4" rx="2" fill="${P.yellow[2]}"/></g>`,
  // Pen tucked behind the ear.
  penEar: `<g transform="rotate(24 90 52)"><rect x="86" y="28" width="8" height="34" rx="4" fill="url(#blue)"/><rect x="86" y="28" width="8" height="8" rx="4" fill="${P.ink[1]}"/></g>`,
  // Full headset with a boom mic: always on a call.
  headsetFull: `<path d="M28 60 Q26 16 60 16 Q94 16 92 60" fill="none" stroke="url(#ink)" stroke-width="6" stroke-linecap="round"/>` +
    `<rect x="84" y="50" width="13" height="20" rx="6.5" fill="url(#ink)"/>` +
    `<path d="M31 64 Q30 84 50 82" fill="none" stroke="url(#ink)" stroke-width="5" stroke-linecap="round"/><circle cx="51" cy="82" r="6" fill="url(#red)"/>` +
    `<rect x="23" y="50" width="13" height="20" rx="6.5" fill="url(#ink)"/>`,
  // Gold medal: quota crushed.
  medal: `<path d="M48 88 L57 104 M72 88 L63 104" stroke="url(#red)" stroke-width="7" stroke-linecap="round"/>` +
    `<circle cx="60" cy="110" r="12" fill="${P.yellow[2]}"/><circle cx="60" cy="108" r="12" fill="url(#yellow)"/><circle cx="60" cy="108" r="6.5" fill="${P.yellow[2]}" opacity="0.45"/>` +
    shine(55, 103, 3.5, 2, -25, 0.9),
  earbud: `<rect x="85" y="55" width="10" height="17" rx="5" fill="url(#paper)"/><circle cx="90" cy="59" r="2.2" fill="${P.green[1]}"/>`,
  // Wraparound shades. Indoors. In the meeting.
  shades: `<path d="M30 54 Q60 49 90 54 Q92 67 81 69 Q70 71 64 62 Q60 60 56 62 Q50 71 39 69 Q28 67 30 54 Z" fill="url(#ink)"/>` +
    shine(40, 57, 5, 2, -10, 0.75) + shine(70, 57, 5, 2, -10, 0.75),
  // Gold-mirror aviators.
  aviators: `<rect x="34" y="49" width="52" height="5" rx="2.5" fill="${P.yellow[2]}"/>` +
    `<path d="M35 53 Q47 50 56 54 Q58 66 50 70 Q38 72 35 63 Q34 57 35 53 Z" fill="url(#mirror)"/>` +
    `<path d="M85 53 Q73 50 64 54 Q62 66 70 70 Q82 72 85 63 Q86 57 85 53 Z" fill="url(#mirror)"/>` +
    shine(42, 57, 4, 2, -20, 0.85) + shine(70, 57, 4, 2, -20, 0.85),
  // The "open to work"-style ring, but for hiring.
  ring: `<rect x="11" y="9" width="98" height="98" rx="28" fill="none" stroke="${P.green[2]}" stroke-width="10"/>` +
    `<rect x="11" y="8" width="98" height="98" rx="28" fill="none" stroke="url(#green)" stroke-width="9"/>` +
    shine(30, 18, 9, 2.5, -40, 0.7),
};

// ---- Assembly --------------------------------------------------------------

// The office dog's head: big rounded corgi ears, white blaze and muzzle, tongue out.
const dogHead = () =>
  `<ellipse cx="33" cy="30" rx="14" ry="23" fill="${P.orange[2]}" transform="rotate(-24 33 30)"/>` +
  `<ellipse cx="87" cy="30" rx="14" ry="23" fill="${P.orange[2]}" transform="rotate(24 87 30)"/>` +
  `<ellipse cx="34" cy="31" rx="12" ry="21" fill="url(#orange)" transform="rotate(-24 34 31)"/>` +
  `<ellipse cx="86" cy="31" rx="12" ry="21" fill="url(#orange)" transform="rotate(24 86 31)"/>` +
  `<ellipse cx="36" cy="34" rx="6" ry="13" fill="url(#pink)" transform="rotate(-24 36 34)"/>` +
  `<ellipse cx="84" cy="34" rx="6" ry="13" fill="url(#pink)" transform="rotate(24 84 34)"/>` +
  `<rect x="47" y="76" width="26" height="20" rx="10" fill="${P.orange[2]}"/>` +
  `<ellipse cx="60" cy="60" rx="32" ry="28" fill="url(#orange)"/>` +
  shine(45, 42, 8, 4, -25, 0.55) +
  `<path d="M55 36 Q60 32 65 36 L67 60 H53 Z" fill="url(#paper)"/>` +
  `<ellipse cx="60" cy="72" rx="19" ry="13" fill="url(#paper)"/>` +
  `<rect x="53" y="77" width="14" height="15" rx="7" fill="${P.pink[2]}"/><rect x="53" y="76" width="14" height="14" rx="7" fill="url(#pink)"/>` +
  `<rect x="58.5" y="79" width="3" height="7" rx="1.5" fill="${P.pink[2]}" opacity="0.6"/>` +
  `<path d="M51 74 Q55 79 60 75 Q65 79 69 74" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
  `<rect x="58" y="68" width="4" height="7" rx="2" fill="${INK}"/>` +
  `<ellipse cx="60" cy="66" rx="8" ry="5.5" fill="url(#ink)"/>` + shine(57, 64, 2.5, 1.3, -15, 0.9) +
  `<circle cx="46" cy="56" r="5.5" fill="${INK}"/><circle cx="74" cy="56" r="5.5" fill="${INK}"/>` +
  `<circle cx="44" cy="54" r="2" fill="#fff"/><circle cx="72" cy="54" r="2" fill="#fff"/>` +
  `<ellipse cx="38" cy="68" rx="5" ry="3" fill="#ff8cb8" opacity="0.5"/><ellipse cx="82" cy="68" rx="5" ry="3" fill="#ff8cb8" opacity="0.5"/>`;

// The first five were drawn before the extra gradients existed; keep their files byte-identical.
const LEGACY = new Set(['mia', 'josh', 'lin', 'dev', 'brooks']);

function avatar(c, id) {
  const eyeSvg = typeof eyes[c.eyes] === 'function' ? eyes[c.eyes](c.skin) : eyes[c.eyes];
  const extra = !LEGACY.has(id);
  const defs = [
    grad('tile', P[c.tile]), grad('skin', P[c.skin]), grad('hair', P[c.hair]), grad('cloth', P[c.cloth], 0.5),
    grad('vest', P.grey), grad('ink', P.ink, 0.6), grad('paper', P.paper, 0.45), grad('red', P.red, 0.5), grad('blue', P.blue, 0.5),
    ...(extra ? [
      grad('yellow', P.yellow, 0.5), grad('orange', P.orange, 0.5), grad('green', P.green, 0.5), grad('pink', P.pink, 0.5),
      grad('glow', P.glow, 0.5), grad('mirror', [P.yellow[0], P.orange[1], P.purple[1]], 0.5),
    ] : []),
  ].join('');
  const b3 = extra ? '<filter id="b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter>' : '';
  const head = c.head === 'dog'
    ? dogHead()
    : `<circle cx="32" cy="60" r="8" fill="${P[c.skin][1]}"/>
<circle cx="88" cy="60" r="8" fill="${P[c.skin][1]}"/>
<ellipse cx="60" cy="57" rx="27" ry="29" fill="url(#skin)"/>
${shine(47, 40, 8, 4, -25, 0.55)}
${c.beard ? gear.beard : ''}
${hair[c.hairStyle].front}
${eyeSvg}${c.brows ? brows[c.brows] : ''}
<ellipse cx="41" cy="71" rx="5" ry="3" fill="#ff8cb8" opacity="0.4"/>
<ellipse cx="79" cy="71" rx="5" ry="3" fill="#ff8cb8" opacity="0.4"/>
${mouths[c.mouth]}`;
  const neck = c.head === 'dog' ? '' : `<rect x="49" y="72" width="22" height="24" rx="11" fill="${P[c.skin][2]}"/>\n`;
  // `dy` lowers the bust to make room for things sitting on the head; `ring` draws over everything.
  const bust = `${(c.back && backs[c.back]) || ''}
${hair[c.hairStyle ?? 'none'].back}
${neck}${bodies[c.body](c)}
${head}
${(c.gear ?? []).filter((g) => g !== 'ring').map((g) => gear[g]).join('\n')}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="240" height="240"><defs>${defs}<clipPath id="clip"><rect x="6" y="4" width="108" height="108" rx="32"/></clipPath><filter id="b1" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.2"/></filter><filter id="b2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter>${b3}</defs>
<rect x="6" y="9" width="108" height="108" rx="32" fill="${P[c.tile][2]}"/>
<rect x="6" y="4" width="108" height="108" rx="32" fill="url(#tile)"/>
<g clip-path="url(#clip)">
${c.dy ? `<g transform="translate(0 ${c.dy})">${bust}</g>` : bust}
${(c.gear ?? []).includes('ring') ? gear.ring : ''}</g>
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

  // ---- Workplace cast ----
  // Co-founder & CTO. Forty terminal tabs reflected in his glasses.
  kai: { tile: 'purple', skin: 'skinTan', hair: 'hairBlack', hairStyle: 'fringe', cloth: 'grey', body: 'hoodieDown', eyes: 'none', mouth: 'smile', gear: ['beanie', 'glowGlasses'] },
  // CEO & co-founder. Blazer over the hoodie; the gold pass says FOUNDER.
  ava: { tile: 'pink', skin: 'skinLight', hair: 'hairBlonde', hairStyle: 'sleekBob', cloth: 'ink', body: 'blazerHoodie', eyes: 'dots', brows: 'raised', mouth: 'smirk', gear: ['lanyardFounder'] },
  // The office dog. Has a staff ID. Has more equity than you.
  byte: { tile: 'blue', skin: 'skinMid', hair: 'hairBrown', cloth: 'orange', head: 'dog', body: 'fur', gear: ['lanyardRed'] },
  // Senior engineer. Explains every bug to the duck first.
  sam: { tile: 'green', skin: 'skinDarker', hair: 'hairBlack', hairStyle: 'messy', cloth: 'purple', body: 'hoodie', eyes: 'tired', mouth: 'flat', dy: 10, gear: ['duck'] },
  // Your manager. "Let's take that offline and circle back."
  nina: { tile: 'yellow', skin: 'skinDeep', hair: 'hairBlack', hairStyle: 'neat', cloth: 'blue', body: 'shirt', eyes: 'calm', mouth: 'calm', gear: ['earbud', 'lanyard'] },
  // Product manager. The sticky note is the roadmap.
  jordan: { tile: 'red', skin: 'skinMid', hair: 'hairBrown', hairStyle: 'short', cloth: 'green', body: 'shirt', eyes: 'dots', mouth: 'talk', gear: ['penEar', 'sticky'] },
  // VP of Sales. Quota crushed, headset never off.
  ruth: { tile: 'orange', skin: 'skinLight', hair: 'hairRed', hairStyle: 'volume', cloth: 'blue', body: 'blazer', eyes: 'happy', mouth: 'beam', gear: ['headsetFull', 'medal'] },
  // The big client. Shades on, unimpressed by your roadmap.
  lee: { tile: 'purple', skin: 'skinMid', hair: 'hairBlack', hairStyle: 'slick', cloth: 'ink', body: 'suit', eyes: 'none', mouth: 'flat', gear: ['shades'] },
  // Recruiter. Has a role that's a great fit for you.
  marco: { tile: 'paper', skin: 'skinTan', hair: 'hairBrown', hairStyle: 'quiff', cloth: 'orange', body: 'shirt', eyes: 'eager', brows: 'high', mouth: 'beam', gear: ['ring'] },
  // Angel investor. Quarter-zip, aviators, "love the energy".
  theo: { tile: 'kraft', skin: 'skinLight', hair: 'hairGrey', hairStyle: 'swept', cloth: 'blue', body: 'quarterZip', eyes: 'none', mouth: 'smirk', gear: ['aviators'] },
};

for (const [id, spec] of Object.entries(cast)) writeFileSync(`${out}/${id}.svg`, avatar(spec, id));
console.log(Object.keys(cast).join(', '));
