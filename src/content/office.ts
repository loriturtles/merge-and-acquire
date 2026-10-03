// Rebuild tasks for each chapter's space. Costs are rough real US prices, paid from salary.
// Art lives in assets/office/{spaceId}-{taskId}.svg.

export interface OfficeTask {
  id: string;
  name: string;
  cost: number;
  xp: number;
}

export interface SpaceDef {
  id: string;
  name: string;
  /** Shown when every task is done. */
  doneLine: string;
  /** Vested shares granted for finishing the space. */
  completionShares: number;
  tasks: OfficeTask[];
}

export const spaces: SpaceDef[] = [
  {
    id: 'share-house',
    name: 'The share house',
    doneLine: 'The bond is safe. Probably.',
    completionShares: 3,
    tasks: [
      { id: 'fairy-lights', name: 'Fairy lights', cost: 25, xp: 6 },
      { id: 'desk-lamp', name: 'Desk lamp', cost: 40, xp: 8 },
      { id: 'bookshelf', name: 'Second-hand bookshelf', cost: 80, xp: 10 },
      { id: 'beanbag', name: 'Beanbag', cost: 120, xp: 12 },
      { id: 'couch', name: 'Fix the couch', cost: 150, xp: 14 },
      { id: 'mini-fridge', name: 'Mini fridge', cost: 180, xp: 16 },
    ],
  },
  {
    id: 'garage-startup',
    name: 'The garage startup',
    doneLine: 'Officially a garage startup. Investors love a garage.',
    completionShares: 6,
    tasks: [
      { id: 'dog-bed', name: 'Bed for the office dog', cost: 90, xp: 12 },
      { id: 'whiteboard', name: 'Whiteboard wall', cost: 300, xp: 16 },
      { id: 'neon-sign', name: 'Neon logo sign', cost: 450, xp: 20 },
      { id: 'espresso-machine', name: 'Espresso machine', cost: 700, xp: 24 },
      { id: 'server-shelf', name: 'Server shelf', cost: 800, xp: 26 },
      { id: 'standing-desk', name: 'Standing desks', cost: 1_200, xp: 30 },
    ],
  },
  {
    id: 'open-plan-floor',
    name: 'The open-plan floor',
    doneLine: 'Nobody can concentrate, but the photos look great.',
    completionShares: 10,
    tasks: [
      { id: 'ping-pong', name: 'Ping-pong table', cost: 1_100, xp: 30 },
      { id: 'kombucha-tap', name: 'Kombucha on tap', cost: 2_400, xp: 36 },
      { id: 'snack-wall', name: 'Free snack wall', cost: 3_000, xp: 40 },
      { id: 'living-wall', name: 'Living plant wall', cost: 6_000, xp: 48 },
      { id: 'meeting-pod', name: 'Meeting pods', cost: 9_000, xp: 56 },
      { id: 'phone-booth', name: 'Phone booths', cost: 12_000, xp: 64 },
    ],
  },
];

export function getSpace(id: string): SpaceDef {
  const space = spaces.find((s) => s.id === id);
  if (!space) throw new Error(`Unknown space: ${id}`);
  return space;
}
