import type { Question } from './questions/schema';

export type VerbalAnswer = 'true' | 'false' | 'cannot_say';
export type QuestionAnswer = string | readonly VerbalAnswer[];
export interface QuestionScore { points: number; isCorrect: boolean }

/**
 * One point per question. Verbal requires every statement in order, with no
 * missing or extra answers. SJT: most = 1, neutral = 0.5, least = 0.
 * isCorrect means full credit; neutral SJT responses retain their half point.
 * Missing, malformed, or unknown selections receive zero points.
 */
export function scoreQuestion(question: Question, answer: QuestionAnswer | undefined): QuestionScore {
  let points = 0;
  if (question.type === 'verbal') {
    points = Array.isArray(answer) && answer.length === question.statements.length &&
      question.statements.every((statement, index) => statement.answer === answer[index]) ? 1 : 0;
  } else if (typeof answer === 'string') {
    if (question.type === 'sjt') {
      const option = question.options.find((candidate) => candidate.id === answer);
      points = option?.effectiveness === 'most' ? 1 : option?.effectiveness === 'neutral' ? 0.5 : 0;
    } else {
      points = question.options.find((candidate) => candidate.id === answer)?.isCorrect ? 1 : 0;
    }
  }
  return { points, isCorrect: points === 1 };
}

export function scoreAssessment(questions: readonly Question[], answers: Readonly<Record<string, QuestionAnswer>>) {
  const ids = new Set(questions.map((question) => question.id));
  if (ids.size !== questions.length) throw new Error('Cannot score duplicate question IDs');
  const score = questions.reduce((sum, question) => sum + scoreQuestion(question, answers[question.id]).points, 0);
  return { score, total: questions.length };
}
