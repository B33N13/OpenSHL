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
  const props = { key: question.id, value, onAnswer };
  switch (question.type) {
    case 'numerical': return <NumericalQuestion {...props} question={question} />;
    case 'verbal': return <VerbalQuestion {...props} question={question} />;
    case 'inductive': return <InductiveQuestion {...props} question={question} />;
    case 'deductive': return <DeductiveQuestion {...props} question={question} />;
    case 'sjt': return <SJTQuestion {...props} question={question} />;
    default: return assertNever(question);
  }
}
function assertNever(question: never): never { throw new Error(`Unsupported question type: ${String(question)}`); }
