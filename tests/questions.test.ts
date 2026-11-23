import { describe, expect, it } from 'vitest';
import seed from '../lib/questions/bank/banking.json';
import { QuestionSchema } from '../lib/questions/schema';
import { bankingQuestions, loadQuestions, parseQuestionBank } from '../lib/questions/loader';

describe('owner-provided question bank', () => {
  it.each(seed)('$id validates', (question) => {
    expect(QuestionSchema.safeParse(question).success).toBe(true);
  });
  it('loads exactly the three supplied questions', () => {
    expect(bankingQuestions.map((question) => question.id)).toEqual(['bank-num-001', 'bank-verb-001', 'bank-ind-001']);
  });
  it('rejects unsupported tracks, types and difficulty levels', () => {
    for (const patch of [{ track: 'unknown' }, { type: 'unknown' }, { difficulty: 'expert' }]) {
      expect(QuestionSchema.safeParse({ ...seed[0], ...patch }).success).toBe(false);
    }
  });
  it('rejects the wrong option count', () => {
    const numerical = bankingQuestions[0];
    if (numerical.type !== 'numerical') throw new Error('Expected numerical seed');
    expect(QuestionSchema.safeParse({ ...numerical, options: numerical.options.slice(0, 3) }).success).toBe(false);
  });
  it('rejects verbal questions with no statements', () => {
    expect(QuestionSchema.safeParse({ ...seed[1], statements: [] }).success).toBe(false);
  });
  it('rejects duplicate IDs, mixed tracks and empty banks', () => {
    expect(() => parseQuestionBank([seed[0], seed[0]], 'banking')).toThrow('Duplicate');
    expect(() => parseQuestionBank(seed, 'retail')).toThrow('does not belong');
    expect(() => parseQuestionBank([], 'banking')).toThrow();
  });
  it('does not silently substitute banking content for an unavailable track', () => {
    expect(() => loadQuestions('mining')).toThrow('not yet supplied');
  });
  it('returns isolated copies', () => {
    const first = loadQuestions('banking');
    first[0].id = 'modified';
    expect(loadQuestions('banking')[0].id).toBe('bank-num-001');
  });
});
