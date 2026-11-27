'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createAssessmentSession } from '@/lib/session/useAssessmentSession';
import { bankingQuestions } from '@/lib/questions/loader';
import { QuestionRenderer } from './QuestionRenderer';
import type { Answer } from '@/lib/session/types';

/** Development gallery only; no session creation or assessment navigation. */
export function RendererPreview() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  function startPreview() {
    try {
      const session = createAssessmentSession('banking', bankingQuestions);
      router.push(`/assessment/${session.id}`);
    } catch { setError('Could not save a preview session in this browser. Please try again.'); }
  }
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer>();
  const question = bankingQuestions[index];
  return <main className="mx-auto min-h-screen max-w-2xl space-y-6 px-4 py-8">
    <header className="space-y-2"><p className="font-semibold">LevelGround</p>
      <h1 className="text-2xl font-bold">Question preview</h1>
      <p className="text-sm text-muted-foreground">Development preview of the approved banking questions. This is not an assessment session.</p>
    </header>
    <div className="space-y-2">
      <Button onClick={startPreview}>Try three-question assessment</Button>
      <p className="text-sm text-muted-foreground">Uses the approved questions. The results screen is the next sub-step.</p>
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
    </div>
    <label className="block font-medium">Question type
      <select className="mt-2 block min-h-11 w-full rounded-lg border border-slate-400 bg-white p-2"
        value={index} onChange={(event) => { setIndex(Number(event.target.value)); setAnswer(undefined); }}>
        {bankingQuestions.map((item, position) => <option key={item.id} value={position}>{item.type}</option>)}
      </select>
    </label>
    <section className="min-w-0 rounded-xl border border-slate-300 p-4 sm:p-6">
      <QuestionRenderer question={question} onAnswer={setAnswer} />
    </section>
    <p role="status" className="text-sm">{answer ? 'Answer complete.' : 'Select an answer. For verbal questions, answer every statement.'}</p>
  </main>;
}
