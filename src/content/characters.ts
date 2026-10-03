import type { ChainId } from './chains';

export type Role = 'flatmate' | 'tutor';

export interface Character {
  id: string;
  name: string;
  initials: string;
  /** Shown after the name, like a team in a work chat. */
  team: string;
  role: Role;
  /** Palette name used for the avatar gradient. */
  colour: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';
  chapter: string;
}

export const characters: Character[] = [
  { id: 'mia', name: 'Mia Torres', initials: 'MT', team: 'Flatmate', role: 'flatmate', colour: 'pink', chapter: 'uni' },
  { id: 'josh', name: 'Josh Okoro', initials: 'JO', team: 'Flatmate', role: 'flatmate', colour: 'orange', chapter: 'uni' },
  { id: 'lin', name: 'Lin Zhou', initials: 'LZ', team: 'Flatmate', role: 'flatmate', colour: 'green', chapter: 'uni' },
  { id: 'dev', name: 'Dev Rao', initials: 'DR', team: 'Flatmate', role: 'flatmate', colour: 'yellow', chapter: 'uni' },
  { id: 'brooks', name: 'Dr Brooks', initials: 'DB', team: 'Your tutor', role: 'tutor', colour: 'purple', chapter: 'uni' },
];

export interface ChatLine {
  /** Which kind of character can say this. Omit for anyone. */
  role?: Role;
  text: string;
}

/** Request lines, keyed by `${chain}-${tier}`. */
export const requestLines: Partial<Record<`${ChainId}-${number}`, ChatLine[]>> = {
  'study-1': [
    { role: 'flatmate', text: 'Can I borrow a highlighter? Mine died mid-sentence' },
    { role: 'tutor', text: 'Please highlight the key points. Not the whole page.' },
  ],
  'study-2': [
    { role: 'flatmate', text: 'Did you go to the 9am? Need your lecture notes' },
    { role: 'tutor', text: 'Someone hand in lecture notes so I know you exist' },
  ],
  'study-3': [
    { role: 'flatmate', text: 'Quiz me tonight? Bring flashcards' },
    { role: 'tutor', text: 'Flashcards for the study group, please' },
  ],
  'study-4': [
    { role: 'flatmate', text: 'Essay due at midnight. Asking for a friend' },
    { role: 'tutor', text: 'Your essay is late. Again.' },
  ],
  'study-5': [
    { role: 'flatmate', text: 'Mum wants proof I actually study. Need an A+' },
    { role: 'tutor', text: 'Show me one A+ exam and I will write your reference' },
  ],
  'study-6': [
    { role: 'tutor', text: 'Graduation is Friday. You will need a degree for that' },
    { role: 'flatmate', text: 'Frame a degree for the hallway? Looks classy' },
  ],
  'food-1': [
    { role: 'flatmate', text: 'Out of noodles. This is an emergency' },
    { role: 'flatmate', text: 'Instant noodles pls, payday is days away' },
    { role: 'tutor', text: 'Working through lunch. Noodles, anyone?' },
  ],
  'food-2': [
    { role: 'flatmate', text: 'Who wants to make me a toastie? Cheese only' },
    { role: 'tutor', text: 'Office hours run long. A toastie would help' },
  ],
  'food-3': [
    { role: 'flatmate', text: 'Just one slice of pizza. Just one.' },
    { role: 'flatmate', text: 'Bribing the group project with pizza. Need a slice' },
  ],
  'food-4': [
    { role: 'flatmate', text: 'House meeting at 8. Whole pizza or nobody comes' },
    { role: 'tutor', text: 'Revision session tonight. Pizza helps attendance' },
  ],
  'food-5': [
    { role: 'flatmate', text: 'All-nighter in the lounge. Need a stack of pizzas' },
    { role: 'tutor', text: 'Department hackathon needs feeding. Big order' },
  ],
  'food-6': [
    { role: 'flatmate', text: 'Grad party! Someone bring the cake' },
    { role: 'tutor', text: 'Farewell to the final-years. Cake, please' },
  ],
};

export const FALLBACK: ChatLine[] = [{ text: 'Could you sort this out for me?' }];

export function linesFor(chain: ChainId, tier: number, role: Role): ChatLine[] {
  const all = requestLines[`${chain}-${tier}`] ?? [];
  const matching = all.filter((l) => !l.role || l.role === role);
  return matching.length ? matching : FALLBACK;
}
