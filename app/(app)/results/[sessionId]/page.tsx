'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionReview } from '@/components/results/QuestionReview';
import { useAssessmentSession } from '@/lib/session/useAssessmentSession';

export default function ResultsPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const { session } = useAssessmentSession(params.sessionId);

  useEffect(() => {
    if (session === null) router.replace('/dashboard');
    else if (session && !session.completedAt) router.replace(`/assessment/${session.id}`);
  }, [session, router]);

  if (!session?.completedAt) return <main className="mx-auto max-w-2xl px-4 py-8"><p role="status">
    {session === undefined ? 'Loading results…' : 'Redirecting…'}
  </p></main>;

  return <main className="mx-auto min-h-screen max-w-2xl space-y-6 px-4 py-8">
    <header className="space-y-3">
      <p className="font-semibold">LevelGround</p>
      <h1 className="text-2xl font-bold">Your results</h1>
      <p aria-label="Assessment score" className="text-4xl font-bold">{session.score} / {session.questions.length}</p>
      <p className="text-sm text-muted-foreground">Review each question to understand the answer and learn from your choices.</p>
    </header>
    <section aria-label="Question review" className="space-y-4">
      {session.questions.map((question, index) => <QuestionReview key={question.id} question={question}
        answer={session.answers[question.id]} index={index} />)}
    </section>
  </main>;
}
