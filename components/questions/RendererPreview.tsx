'use client';

import { useState } from 'react';
import { bankingQuestions } from '@/lib/questions/loader';
import { QuestionRenderer } from './QuestionRenderer';
import type { Answer } from '@/lib/session/types';

/** Development gallery only; no session creation or assessment navigation. */
export function RendererPreview() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer>();
  const question = bankingQuestions[index];
  return <main className="mx-auto min-h-screen max-w-2xl space-y-6 px-4 py-8">
    <header className="space-y-2"><p className="font-semibold">LevelGround</p>
      <h1 className="text-2xl font-bold">Question preview</h1>
      <p className="text-sm text-muted-foreground">Development preview of the approved banking questions. This is not an assessment session.</p>
    </header>
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
