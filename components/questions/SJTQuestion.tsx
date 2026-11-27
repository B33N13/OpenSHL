"use client";

import { OptionChoices } from './OptionChoices';
import type { QuestionProps } from './types';

export function SJTQuestion({ question, value, onAnswer }: QuestionProps<'sjt'>) {
  return <div className="min-w-0 space-y-5">
    <p className="whitespace-pre-wrap">{question.scenario}</p>
    <OptionChoices legend="Which response is most effective?" options={question.options}
      selected={value?.type === 'single' ? value.optionId : undefined}
      onSelect={(optionId) => onAnswer({ type: 'single', optionId })} />
  </div>;
}
