import type { ChainId } from './chains';

export interface ChapterDef {
  number: number;
  id: string;
  name: string;
  space: string;
  ages: string;
  /** Job titles in order. Levels arrive in milestone 2; for now the first title is used. */
  titles: string[];
  /** Salary paid each payday, per title index. */
  wages: number[];
  chains: ChainId[];
  /** Chance weights for the tier a generator drops (index 0 = tier 1). */
  generatorDrops: number[];
}

export const chapters: ChapterDef[] = [
  {
    number: 1,
    id: 'uni',
    name: 'Uni',
    space: 'The share house',
    ages: '18–21',
    titles: ['Fresher', 'Second-year', 'Final-year', 'Honours student', 'Tutor'],
    wages: [40, 50, 60, 75, 90],
    chains: ['study', 'food'],
    generatorDrops: [100],
  },
];

export function getChapter(id: string): ChapterDef {
  const chapter = chapters.find((c) => c.id === id);
  if (!chapter) throw new Error(`Unknown chapter: ${id}`);
  return chapter;
}
