import type { Question, Track } from '@/lib/questions/schema';

export type VerbalChoice = 'true' | 'false' | 'cannot_say';
export type Answer =
  | { type: 'single'; optionId: string }
  | { type: 'verbal'; statements: VerbalChoice[] };

export interface AssessmentSession {
  id: string;
  track: Track;
  questions: Question[];
  answers: Record<string, Answer>;
  currentIndex: number;
  startedAt: string;
  completedAt?: string;
  score?: number;
}
