'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionRenderer } from '@/components/questions/QuestionRenderer';
import { Button } from '@/components/ui/button';
import { isCompleteAnswer, useAssessmentSession } from '@/lib/session/useAssessmentSession';
import type { Answer } from '@/lib/session/types';

export default function AssessmentPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const { session, answer, next, finish } = useAssessmentSession(params.sessionId);
  const [error, setError] = useState<string>();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (session === null) router.replace('/dashboard');
    else if (session?.completedAt) router.replace(`/results/${session.id}`);
  }, [session, router]);

  const index = session?.currentIndex;
  useEffect(() => { heading.current?.focus(); }, [index]);

  if (!session || session.completedAt) {
    return <main className="mx-auto max-w-2xl px-4 py-8"><p role="status">
      {session === undefined ? 'Loading assessment…' : 'Redirecting…'}
    </p></main>;
  }

  const question = session.questions[session.currentIndex];
  const last = session.currentIndex === session.questions.length - 1;
  const complete = isCompleteAnswer(question, session.answers[question.id]);

  function save(value: Answer) {
    try {
      if (answer(value)) setError(undefined);
      else setError('Please select a complete answer before continuing.');
    } catch {
      setError('Your answer could not be saved in this browser. Please select your answer again to retry.');
    }
  }
  function advance() {
    if (!complete || error) return;
    try {
      if (last) {
        if (!finish()) setError('Please answer every question before viewing results.');
      } else if (!next()) setError('Please select a complete answer before continuing.');
    } catch {
      setError('Your progress could not be saved. Please select your answer again, then retry.');
    }
  }

  return <main className="mx-auto min-h-screen max-w-2xl space-y-6 px-4 py-8">
    <header className="space-y-3">
      <p className="font-semibold">LevelGround</p>
      <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold">
        Question {session.currentIndex + 1} of {session.questions.length}
      </h1>
      <progress className="h-2 w-full accent-slate-900" aria-label="Assessment progress"
        value={session.currentIndex + 1} max={session.questions.length} />
      <p className="text-sm text-muted-foreground">Take your time. Choose an answer before continuing.</p>
    </header>
    <section className="min-w-0 rounded-xl border border-slate-300 p-4 sm:p-6" aria-label="Current question">
      <QuestionRenderer question={question} value={session.answers[question.id]} onAnswer={save} />
    </section>
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
    <Button type="button" className="w-full sm:w-auto" disabled={!complete || Boolean(error)} onClick={advance}>
      {last ? 'See results' : 'Next'}
    </Button>
  </main>;
}
