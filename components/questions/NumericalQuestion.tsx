"use client";

import { OptionChoices } from './OptionChoices';
import type { QuestionProps } from './types';

export function NumericalQuestion({ question, value, onAnswer }: QuestionProps<'numerical'>) {
  return <div className="min-w-0 space-y-5">
    <p className="whitespace-pre-wrap">{question.stem}</p>
    {question.table && <div className="max-w-full overflow-x-auto" role="region" aria-label="Question data" tabIndex={0}>
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Data for this question</caption>
        <thead><tr>{question.table.headers.map((header, index) => <th className="border border-slate-400 p-2" scope="col" key={index}>{header}</th>)}</tr></thead>
        <tbody>{question.table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => cellIndex === 0
          ? <th className="border border-slate-400 p-2 font-medium" scope="row" key={cellIndex}>{cell}</th>
          : <td className="border border-slate-400 p-2" key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>}
    <OptionChoices legend={question.question} options={question.options} selected={value?.type === 'single' ? value.optionId : undefined}
      onSelect={(optionId) => onAnswer({ type: 'single', optionId })} />
  </div>;
}
