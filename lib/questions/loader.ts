import { z } from 'zod';
import bankingData from './bank/banking.json';
import { QuestionSchema, TrackEnum, type Question, type Track } from './schema';

export function parseQuestionBank(data: unknown, track: Track): Question[] {
  const questions = z.array(QuestionSchema).min(1).parse(data);
  const ids = new Set<string>();
  for (const question of questions) {
    if (question.track !== track) throw new Error(`Question ${question.id} does not belong to ${track}`);
    if (ids.has(question.id)) throw new Error(`Duplicate question ID: ${question.id}`);
    ids.add(question.id);
  }
  return questions;
}
export const bankingQuestions = parseQuestionBank(bankingData, 'banking');

export function loadQuestions(track: Track): Question[] {
  TrackEnum.parse(track);
  if (track === 'banking') return structuredClone(bankingQuestions);
  throw new Error(`Question bank not yet supplied for ${track}`);
}
