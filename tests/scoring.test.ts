import { describe, expect, it } from 'vitest';
import { bankingQuestions } from '../lib/questions/loader';
import { QuestionSchema } from '../lib/questions/schema';
import { scoreAssessment, scoreQuestion } from '../lib/scoring';

// Synthetic control-flow fixtures only: not published question-bank content.
const sjt = QuestionSchema.parse({
  id: 'test-sjt', track: 'banking', type: 'sjt', difficulty: 'easy',
  scenario: 'Test scoring categories.', explanation: 'Test fixture.',
  options: [
    { id: 'A', text: 'Most', effectiveness: 'most', rationale: 'Test fixture.' },
    { id: 'B', text: 'Neutral', effectiveness: 'neutral', rationale: 'Test fixture.' },
    { id: 'C', text: 'Least', effectiveness: 'least', rationale: 'Test fixture.' },
    { id: 'D', text: 'Neutral', effectiveness: 'neutral', rationale: 'Test fixture.' }
  ]
});
const deductive = QuestionSchema.parse({
  id: 'test-ded', track: 'banking', type: 'deductive', difficulty: 'easy',
  premises: ['All A are B.', 'All B are C.'], conclusion: 'All A are C.',
  options: [
    { id: 'A', text: 'Conclusion follows', isCorrect: true },
    { id: 'B', text: 'Conclusion does not follow', isCorrect: false },
    { id: 'C', text: 'Cannot say', isCorrect: false }
  ], explanation: 'Test fixture.'
});

describe('scoring', () => {
  it('scores all-correct as full credit', () => {
    expect(scoreAssessment(bankingQuestions, {
      'bank-num-001': 'B', 'bank-verb-001': ['true', 'cannot_say'], 'bank-ind-001': 'B'
    })).toEqual({ score: 3, total: 3 });
  });
  it('scores all-wrong as zero', () => {
    expect(scoreAssessment(bankingQuestions, {
      'bank-num-001': 'A', 'bank-verb-001': ['false', 'true'], 'bank-ind-001': 'A'
    })).toEqual({ score: 0, total: 3 });
  });
  it('scores verbal with one wrong statement as zero', () => {
    expect(scoreQuestion(bankingQuestions[1], ['true', 'false'])).toEqual({ points: 0, isCorrect: false });
  });

  it('scores the hand-worked seed example as 2/3', () => {
    // Numerical B = 1; both verbal statements correct = 1; inductive A = 0.
    expect(scoreAssessment(bankingQuestions, {
      'bank-num-001': 'B', 'bank-verb-001': ['true', 'cannot_say'], 'bank-ind-001': 'A'
    })).toEqual({ score: 2, total: 3 });
  });
  it.each([['A', 1, true], ['B', 0.5, false], ['C', 0, false], ['D', 0.5, false]] as const)(
    'scores SJT %s as %s', (answer, points, isCorrect) => {
      expect(scoreQuestion(sjt, answer)).toEqual({ points, isCorrect });
    }
  );
  it('retains fractional SJT points in the total', () => {
    expect(scoreAssessment([...bankingQuestions, sjt], {
      'bank-num-001': 'B', 'bank-verb-001': ['true', 'cannot_say'],
      'bank-ind-001': 'B', 'test-sjt': 'B'
    })).toEqual({ score: 3.5, total: 4 });
  });
  it('requires every verbal statement, in order, without extras', () => {
    const verbal = bankingQuestions[1];
    for (const answer of [[], ['true'], ['true', 'false'], ['cannot_say', 'true'], ['true', 'cannot_say', 'false'], 'true'] as const) {
      expect(scoreQuestion(verbal, answer).points).toBe(0);
    }
    expect(scoreQuestion(verbal, ['true', 'cannot_say']).points).toBe(1);
  });
  it('scores numerical, inductive and deductive options', () => {
    for (const [question, correct] of [[bankingQuestions[0], 'B'], [bankingQuestions[2], 'B'], [deductive, 'A']] as const) {
      expect(scoreQuestion(question, correct).points).toBe(1);
      expect(scoreQuestion(question, 'unknown').points).toBe(0);
      expect(scoreQuestion(question, undefined).points).toBe(0);
      expect(scoreQuestion(question, ['true']).points).toBe(0);
    }
  });
  it('scores unanswered questions and unknown SJT selections as zero', () => {
    expect(scoreAssessment(bankingQuestions, {})).toEqual({ score: 0, total: 3 });
    expect(scoreQuestion(sjt, 'unknown')).toEqual({ points: 0, isCorrect: false });
  });
  it('refuses duplicate question IDs', () => {
    expect(() => scoreAssessment([sjt, sjt], {})).toThrow('duplicate');
  });
});
