import type { Question } from '@/lib/questions/schema';
import type { Answer } from '@/lib/session/types';

export type { Answer, VerbalChoice } from '@/lib/session/types';
export type QuestionOfType<T extends Question['type']> = Extract<Question, { type: T }>;
export interface QuestionProps<T extends Question['type']> {
  question: QuestionOfType<T>;
  value?: Answer;
  onAnswer: (answer: Answer) => void;
}
