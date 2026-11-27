"use client";

import { useId, useState } from 'react';

interface Props {
  legend: string;
  options: readonly { id: string; text: string }[];
  selected?: string;
  onSelect: (id: string) => void;
}

/** Native radio groups preserve keyboard navigation and screen-reader semantics. */
export function OptionChoices({ legend, options, selected, onSelect }: Props) {
  const name = useId();
  const [selection, setSelection] = useState(selected);
  return <fieldset className="min-w-0 space-y-3">
    <legend className="mb-3 text-lg font-semibold">{legend}</legend>
    {options.map((option) => <label key={option.id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-slate-400 p-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
      <input className="mt-1 h-4 w-4 shrink-0 accent-slate-900" type="radio" name={name} value={option.id}
        checked={(selected ?? selection) === option.id}
        onChange={() => { setSelection(option.id); onSelect(option.id); }} />
      <span className="min-w-0 break-words">{option.text}</span>
    </label>)}
  </fieldset>;
}
