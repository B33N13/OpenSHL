'use client';

import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { QuestionSchema, TrackEnum, type Question, type Track } from '@/lib/questions/schema';
import { scoreAssessment, type QuestionAnswer } from '@/lib/scoring';
import type { Answer, AssessmentSession } from './types';

const AnswerSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('single'), optionId: z.string() }),
  z.object({ type: z.literal('verbal'), statements: z.array(z.enum(['true', 'false', 'cannot_say'])) })
]);
const SessionSchema = z.object({
  id: z.string().uuid(), track: TrackEnum,
  questions: z.array(QuestionSchema).min(1),
  answers: z.record(AnswerSchema), currentIndex: z.number().int().nonnegative(),
  startedAt: z.string().datetime(), completedAt: z.string().datetime().optional(),
  score: z.number().nonnegative().optional()
});

export function isCompleteAnswer(question: Question, answer: Answer | undefined): boolean {
  if (!answer) return false;
  if (question.type === 'verbal') {
    return answer.type === 'verbal' && answer.statements.length === question.statements.length &&
      answer.statements.every((entry) => entry === 'true' || entry === 'false' || entry === 'cannot_say');
  }
  return answer.type === 'single' && question.options.some((option) => option.id === answer.optionId);
}

function calculateScore(session: AssessmentSession): number {
  const answers: Record<string, QuestionAnswer> = {};
  for (const [id, answer] of Object.entries(session.answers)) {
    answers[id] = answer.type === 'single' ? answer.optionId : answer.statements;
  }
  return scoreAssessment(session.questions, answers).score;
}

/** Reject malformed snapshots, skipped questions and inconsistent completion data. */
function validateSession(value: unknown): AssessmentSession {
  const session = SessionSchema.parse(value);
  const ids = new Set(session.questions.map((question) => question.id));
  if (ids.size !== session.questions.length || session.currentIndex >= session.questions.length ||
      session.questions.some((question) => question.track !== session.track)) throw new Error('Invalid session questions');
  for (const [id, answer] of Object.entries(session.answers)) {
    const index = session.questions.findIndex((question) => question.id === id);
    if (index < 0 || index > session.currentIndex || !isCompleteAnswer(session.questions[index], answer)) {
      throw new Error('Invalid session answer');
    }
  }
  if (session.questions.slice(0, session.currentIndex).some((question) => !session.answers[question.id])) {
    throw new Error('Session contains skipped questions');
  }
  if (session.completedAt !== undefined) {
    if (session.currentIndex !== session.questions.length - 1 ||
        session.questions.some((question) => !session.answers[question.id]) ||
        session.score !== calculateScore(session) || session.completedAt < session.startedAt) {
      throw new Error('Invalid completed session');
    }
  } else if (session.score !== undefined) throw new Error('Unfinished session has a score');
  return session;
}

/** The UUID itself is the storage key. This is the only storage boundary. */
function persist(session: AssessmentSession): void {
  window.sessionStorage.setItem(session.id, JSON.stringify(session));
}

/** Track-page creation uses this function so no other module needs storage access. */
export function createAssessmentSession(track: Track, questions: Question[]): AssessmentSession {
  const session = validateSession({
    id: crypto.randomUUID(), track, questions, answers: {}, currentIndex: 0,
    startedAt: new Date().toISOString()
  });
  persist(session); // Storage denial/quota failure must prevent navigation to an unsaved session.
  return structuredClone(session);
}

/** undefined = loading, null = missing/unreadable/invalid, otherwise hydrated session. */
export function useAssessmentSession(sessionId: string) {
  const [loaded, setLoaded] = useState<{ id: string; value: AssessmentSession | null }>();
  const current = useRef<AssessmentSession | null>(null);

  useEffect(() => {
    current.current = null;
    let value: AssessmentSession | null = null;
    try {
      const raw = window.sessionStorage.getItem(sessionId);
      if (raw !== null) {
        const parsed = validateSession(JSON.parse(raw));
        if (parsed.id === sessionId) value = parsed;
      }
    } catch { /* Missing, denied or corrupted storage is handled as an unavailable session. */ }
    current.current = value;
    setLoaded({ id: sessionId, value });
    return () => { current.current = null; };
  }, [sessionId]);

  function commit(updated: AssessmentSession): AssessmentSession {
    persist(updated); // Persist first: state never advances on a failed write.
    current.current = updated;
    setLoaded({ id: sessionId, value: updated });
    return structuredClone(updated);
  }
  function active(): AssessmentSession | null {
    return current.current?.id === sessionId ? current.current : null;
  }
  function answer(value: Answer): boolean {
    const session = active();
    if (!session || session.completedAt) return false;
    const parsed = AnswerSchema.safeParse(value);
    const question = session.questions[session.currentIndex];
    if (!parsed.success || !isCompleteAnswer(question, parsed.data)) return false;
    commit({ ...session, answers: { ...session.answers, [question.id]: parsed.data } });
    return true;
  }
  function next(): boolean {
    const session = active();
    if (!session || session.completedAt || session.currentIndex >= session.questions.length - 1 ||
        !isCompleteAnswer(session.questions[session.currentIndex], session.answers[session.questions[session.currentIndex].id])) return false;
    commit({ ...session, currentIndex: session.currentIndex + 1 });
    return true;
  }
  function finish(): AssessmentSession | null {
    const session = active();
    if (!session) return null;
    if (session.completedAt) return structuredClone(session);
    if (session.currentIndex !== session.questions.length - 1 ||
        session.questions.some((question) => !isCompleteAnswer(question, session.answers[question.id]))) return null;
    return commit({ ...session, score: calculateScore(session), completedAt: new Date().toISOString() });
  }

  return { session: loaded?.id === sessionId ? loaded.value : undefined, answer, next, finish };
}
