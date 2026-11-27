"use client";

import { useState } from 'react';
import { OptionChoices } from './OptionChoices';
import type { QuestionProps, VerbalChoice } from './types';

const options: { id: VerbalChoice; text: string }[] = [
  { id: 'true', text: 'True' }, { id: 'false', text: 'False' }, { id: 'cannot_say', text: 'Cannot say' }
];

export function VerbalQuestion({ question, value, onAnswer }: QuestionProps<'verbal'>) {
  const [statements, setStatements] = useState<(VerbalChoice | undefined)[]>(() =>
    question.statements.map((_, index) => value?.type === 'verbal' ? value.statements[index] : undefined));

  function select(index: number, choice: string) {
    if (choice !== 'true' && choice !== 'false' && choice !== 'cannot_say') return;
    const updated = statements.map((previous, position) => position === index ? choice : previous);
    setStatements(updated);
    // Never emit partial arrays: the parent can gate Next on a complete Answer.
    if (updated.every((entry): entry is VerbalChoice => entry !== undefined)) {
      onAnswer({ type: 'verbal', statements: updated });
    }
  }

  return <div className="min-w-0 space-y-6">
    <p className="whitespace-pre-wrap">{question.passage}</p>
    <p className="text-sm">Answer every statement using only the passage.</p>
    {question.statements.map((statement, index) => <OptionChoices key={index}
      legend={`${index + 1}. ${statement.statement}`} options={options} selected={statements[index]}
      onSelect={(choice) => select(index, choice)} />)}
  </div>;
}
