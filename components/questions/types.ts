import type { Question } from '@/lib/questions/schema';

export type VerbalChoice = 'true' | 'false' | 'cannot_say';
export type Answer =
  | { type: 'single'; optionId: string }
  | { type: 'verbal'; statements: VerbalChoice[] };
export type QuestionOfType<T extends Question['type']> = Extract<Question, { type: T }>;
export interface QuestionProps<T extends Question['type']> {
  question: QuestionOfType<T>;
  value?: Answer;
  onAnswer: (answer: Answer) => void;
}
