import { Fragment } from 'react';
import type { Question } from '@/lib/questions/schema';
import type { Answer, VerbalChoice } from '@/lib/session/types';
import { scoreQuestion } from '@/lib/scoring';

const verbalLabels: Record<VerbalChoice, string> = { true: 'True', false: 'False', cannot_say: 'Cannot say' };

/** Render the seed bank's emphasis and paragraphs as text nodes, never raw HTML. */
export function Explanation({ text }: { text: string }) {
  return <div className="space-y-3">{text.split(/\n\n+/).map((paragraph, index) =>
    <p className="whitespace-pre-wrap" key={index}>{paragraph.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, position) =>
      part.startsWith('**') && part.endsWith('**') ? <strong key={position}>{part.slice(2, -2)}</strong>
        : part.startsWith('*') && part.endsWith('*') ? <em key={position}>{part.slice(1, -1)}</em>
          : <Fragment key={position}>{part}</Fragment>)}</p>)}</div>;
}

function Prompt({ question }: { question: Question }) {
  switch (question.type) {
    case 'numerical': return <div className="space-y-3">
      <p>{question.stem}</p>
      {question.table && <div className="max-w-full overflow-x-auto" role="region" aria-label="Question data" tabIndex={0}>
        <table className="w-full border-collapse text-left text-sm"><caption className="sr-only">Data for this question</caption>
          <thead><tr>{question.table.headers.map((header, index) => <th scope="col" className="border border-slate-400 p-2" key={index}>{header}</th>)}</tr></thead>
          <tbody>{question.table.rows.map((row, index) => <tr key={index}>{row.map((cell, column) => column === 0
            ? <th scope="row" className="border border-slate-400 p-2 font-medium" key={column}>{cell}</th>
            : <td className="border border-slate-400 p-2" key={column}>{cell}</td>)}</tr>)}</tbody>
        </table></div>}
      <p className="font-semibold">{question.question}</p>
    </div>;
    case 'verbal': return <p className="whitespace-pre-wrap">{question.passage}</p>;
    case 'inductive': return <div className="space-y-2"><p className="font-semibold">What comes next in the sequence?</p>
      <ol aria-label="Sequence" className="flex flex-wrap gap-2">{question.sequence.map((term, index) => <li className="rounded border border-slate-400 px-2 py-1" key={index}>{term}</li>)}</ol></div>;
    case 'deductive': return <div className="space-y-2"><h3 className="font-semibold">Premises</h3>
      <ul className="list-disc space-y-1 pl-5">{question.premises.map((premise, index) => <li key={index}>{premise}</li>)}</ul>
      <p><strong>Conclusion: </strong>{question.conclusion}</p></div>;
    case 'sjt': return <div className="space-y-2"><p>{question.scenario}</p><p className="font-semibold">Which response is most effective?</p></div>;
  }
}

export function QuestionReview({ question, answer, index }: { question: Question; answer: Answer; index: number }) {
  const result = scoreQuestion(question, answer.type === 'single' ? answer.optionId : answer.statements);
  const status = result.isCorrect ? 'Correct' : result.points > 0 ? 'Partially correct' : 'Incorrect';

  return <details className="min-w-0 rounded-xl border border-slate-300">
    <summary className="min-h-11 cursor-pointer rounded-xl p-4 font-semibold">
      Question {index + 1} — {status} ({result.points} / 1)
    </summary>
    <div className="space-y-5 border-t border-slate-300 p-4 sm:p-6">
      <Prompt question={question} />
      {question.type === 'verbal' ? <ol className="space-y-5">{question.statements.map((statement, position) => <li key={position} className="space-y-2">
        <h3 className="font-semibold">{position + 1}. {statement.statement}</h3>
        <p><strong>Your answer: </strong>{answer.type === 'verbal' ? verbalLabels[answer.statements[position]] : 'Not answered'}</p>
        <p><strong>Correct answer: </strong>{verbalLabels[statement.answer]}</p>
        <div><h4 className="mb-1 font-semibold">Explanation</h4><Explanation text={statement.justification} /></div>
      </li>)}</ol> : <ChoiceReview question={question} answer={answer} />}
    </div>
  </details>;
}

function ChoiceReview({ question, answer }: { question: Exclude<Question, { type: 'verbal' }>; answer: Answer }) {
  const chosen = question.options.find((option) => answer.type === 'single' && option.id === answer.optionId);
  const correct = question.type === 'sjt'
    ? question.options.filter((option) => option.effectiveness === 'most')
    : question.options.filter((option) => option.isCorrect);
  const whyWrong = chosen && 'whyWrong' in chosen && typeof chosen.whyWrong === 'string' ? chosen.whyWrong : undefined;
  return <div className="space-y-4">
    <p><strong>Your answer: </strong>{chosen ? `${chosen.id}: ${chosen.text}` : 'Not answered'}</p>
    <p><strong>Correct answer: </strong>{correct.map((option) => `${option.id}: ${option.text}`).join('; ')}</p>
    <div><h3 className="mb-2 font-semibold">Explanation</h3><Explanation text={question.explanation} /></div>
    {chosen && 'isCorrect' in chosen && !chosen.isCorrect && whyWrong && <div>
      <h3 className="mb-2 font-semibold">Why your answer was incorrect</h3><Explanation text={whyWrong} />
    </div>}
    {question.type === 'sjt' && <div>
      <h3 className="mb-2 font-semibold">Response rationale</h3>
      <Explanation text={question.options.find((option) => answer.type === 'single' && option.id === answer.optionId)?.rationale ?? 'No response selected.'} />
      <p className="mt-2 text-sm">Scoring: most effective = 1; neutral = 0.5; least effective = 0.</p>
    </div>}
  </div>;
}
