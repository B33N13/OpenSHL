"use client";

import { OptionChoices } from './OptionChoices';
import type { QuestionProps } from './types';

export function DeductiveQuestion({ question, value, onAnswer }: QuestionProps<'deductive'>) {
  return <div className="min-w-0 space-y-5">
    <div><h2 className="mb-2 font-semibold">Premises</h2>
      <ul className="list-disc space-y-2 pl-5">{question.premises.map((premise, index) => <li key={index}>{premise}</li>)}</ul></div>
    <p><strong>Conclusion: </strong>{question.conclusion}</p>
    <OptionChoices legend="Does the conclusion follow from the premises?" options={question.options}
      selected={value?.type === 'single' ? value.optionId : undefined}
      onSelect={(optionId) => onAnswer({ type: 'single', optionId })} />
  </div>;
}
