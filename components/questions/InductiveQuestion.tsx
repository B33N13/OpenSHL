"use client";

import { OptionChoices } from './OptionChoices';
import type { QuestionProps } from './types';

export function InductiveQuestion({ question, value, onAnswer }: QuestionProps<'inductive'>) {
  return <div className="min-w-0 space-y-5">
    <p className="font-medium">Sequence</p>
    <ol aria-label="Sequence" className="flex flex-wrap gap-2">{question.sequence.map((term, index) =>
      <li key={index} className="rounded border border-slate-400 px-3 py-2">{term}</li>)}</ol>
    <OptionChoices legend="What comes next in the sequence?" options={question.options}
      selected={value?.type === 'single' ? value.optionId : undefined}
      onSelect={(optionId) => onAnswer({ type: 'single', optionId })} />
  </div>;
}
