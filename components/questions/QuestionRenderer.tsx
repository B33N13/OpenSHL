"use client";

import type { Question } from '@/lib/questions/schema';
import { NumericalQuestion } from './NumericalQuestion';
import { VerbalQuestion } from './VerbalQuestion';
import { InductiveQuestion } from './InductiveQuestion';
import { DeductiveQuestion } from './DeductiveQuestion';
import { SJTQuestion } from './SJTQuestion';
import type { Answer } from './types';

interface Props { question: Question; value?: Answer; onAnswer: (answer: Answer) => void }

export function QuestionRenderer({ question, value, onAnswer }: Props) {
  // A question change remounts its renderer, clearing any unsubmitted selections.
  const props = { value, onAnswer };
  switch (question.type) {
    case 'numerical': return <NumericalQuestion key={question.id} {...props} question={question} />;
    case 'verbal': return <VerbalQuestion key={question.id} {...props} question={question} />;
    case 'inductive': return <InductiveQuestion key={question.id} {...props} question={question} />;
    case 'deductive': return <DeductiveQuestion key={question.id} {...props} question={question} />;
    case 'sjt': return <SJTQuestion key={question.id} {...props} question={question} />;
    default: return assertNever(question);
  }
}
function assertNever(question: never): never { throw new Error(`Unsupported question type: ${String(question)}`); }
