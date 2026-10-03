// Event content. Timings and rewards are in economy.ts.

export interface SurveyQuestion {
  question: string;
  answers: string[];
}

/** Three are picked for each engagement survey. Every answer is accepted; that's the joke. */
export const surveyQuestions: SurveyQuestion[] = [
  { question: 'How likely are you to recommend this desk to a friend?', answers: ['10', 'Also 10', 'I have no friends left'] },
  { question: 'Do you feel your voice is heard?', answers: ['Yes', 'Pardon?', 'I am typing this from a meeting'] },
  { question: 'Which perk matters most to you?', answers: ['Free snacks', 'Free snacks, but healthier', 'Being paid'] },
  { question: 'How would you describe our culture in one word?', answers: ['Family', 'Synergy', 'Kombucha'] },
  { question: 'Do you have the tools you need?', answers: ['Yes', 'I have a stapler', 'What is a tool?'] },
  { question: 'How many meetings is the right number of meetings?', answers: ['Fewer', 'Fewer still', 'Let’s schedule a meeting to discuss'] },
  { question: 'Rate your work-life balance.', answers: ['Balanced', 'Mostly work', 'What is life?'] },
  { question: 'Is this survey anonymous?', answers: ['Yes', 'Yes (it is not)', 'I refuse to answer, Nina'] },
];

export const reviewRatings = [
  { min: 0, label: 'Meets some expectations', line: 'Solid effort. Let’s set some stretch goals.' },
  { min: 0.6, label: 'Meets expectations', line: 'Great year. Budgets are tight, but here are some shares.' },
  { min: 1, label: 'Exceeds expectations', line: 'Outstanding. You are a culture add.' },
  { min: 1.5, label: 'Redefines expectations', line: 'We had to invent a new rating for you.' },
];
