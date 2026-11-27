// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QuestionRenderer } from '../components/questions/QuestionRenderer';
import { bankingQuestions } from '../lib/questions/loader';
import { QuestionSchema } from '../lib/questions/schema';

afterEach(cleanup);
const verbal = bankingQuestions.find((q) => q.type === 'verbal')!;
const numerical = bankingQuestions.find((q) => q.type === 'numerical')!;
const inductive = bankingQuestions.find((q) => q.type === 'inductive')!;
// Rendering fixtures only; no new production-bank content.
const deductive = QuestionSchema.parse({ id: 'test-ded', track: 'banking', type: 'deductive', difficulty: 'easy',
  premises: ['All A are B.', 'All B are C.'], conclusion: 'All A are C.', explanation: 'Test explanation.',
  options: [{ id: 'A', text: 'Conclusion follows', isCorrect: true }, { id: 'B', text: 'Conclusion does not follow', isCorrect: false }, { id: 'C', text: 'Cannot say', isCorrect: false }] });
const sjt = QuestionSchema.parse({ id: 'test-sjt', track: 'banking', type: 'sjt', difficulty: 'easy', scenario: 'Test scenario.', explanation: 'Hidden explanation.',
  options: [{ id: 'A', text: 'Response A', effectiveness: 'most', rationale: 'Hidden rationale.' }, { id: 'B', text: 'Response B', effectiveness: 'neutral', rationale: 'Hidden rationale.' }, { id: 'C', text: 'Response C', effectiveness: 'least', rationale: 'Hidden rationale.' }, { id: 'D', text: 'Response D', effectiveness: 'neutral', rationale: 'Hidden rationale.' }] });

describe('question renderers', () => {
  it.each([numerical, inductive, deductive, sjt])('emits a single answer for $type', (question) => {
    const onAnswer = vi.fn();
    render(<QuestionRenderer question={question} onAnswer={onAnswer} />);
    const radio = screen.getAllByRole('radio')[0] as HTMLInputElement;
    fireEvent.click(radio);
    expect(radio.checked).toBe(true);
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith({ type: 'single', optionId: 'A' });
  });
  it('renders numerical data with column and row headers', () => {
    render(<QuestionRenderer question={numerical} onAnswer={vi.fn()} />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    expect(screen.getAllByRole('rowheader')).toHaveLength(3);
  });
  it('does not emit a verbal answer until every statement is answered', () => {
    const onAnswer = vi.fn();
    render(<QuestionRenderer question={verbal} onAnswer={onAnswer} />);
    const groups = screen.getAllByRole('group');
    fireEvent.click(within(groups[1]).getByRole('radio', { name: 'Cannot say' }));
    expect(onAnswer).not.toHaveBeenCalled();
    fireEvent.click(within(groups[0]).getByRole('radio', { name: 'True' }));
    expect(onAnswer).toHaveBeenLastCalledWith({ type: 'verbal', statements: ['true', 'cannot_say'] });
    fireEvent.click(within(groups[0]).getByRole('radio', { name: 'False' }));
    expect(onAnswer).toHaveBeenLastCalledWith({ type: 'verbal', statements: ['false', 'cannot_say'] });
  });
  it('restores an existing complete verbal answer without emitting on mount', () => {
    const onAnswer = vi.fn();
    render(<QuestionRenderer question={verbal} value={{ type: 'verbal', statements: ['true', 'cannot_say'] }} onAnswer={onAnswer} />);
    const groups = screen.getAllByRole('group');
    expect((within(groups[0]).getByRole('radio', { name: 'True' }) as HTMLInputElement).checked).toBe(true);
    expect((within(groups[1]).getByRole('radio', { name: 'Cannot say' }) as HTMLInputElement).checked).toBe(true);
    expect(onAnswer).not.toHaveBeenCalled();
  });
  it('resets partial verbal selections on a question change', () => {
    const onAnswer = vi.fn();
    const { rerender } = render(<QuestionRenderer question={verbal} onAnswer={onAnswer} />);
    fireEvent.click(within(screen.getAllByRole('group')[0]).getByRole('radio', { name: 'True' }));
    rerender(<QuestionRenderer question={{ ...verbal, id: 'another-verbal' }} onAnswer={onAnswer} />);
    fireEvent.click(within(screen.getAllByRole('group')[1]).getByRole('radio', { name: 'Cannot say' }));
    expect(onAnswer).not.toHaveBeenCalled();
  });
  it('keeps answers and explanations hidden while practising', () => {
    render(<QuestionRenderer question={sjt} onAnswer={vi.fn()} />);
    expect(screen.queryByText('Hidden explanation.')).toBeNull();
    expect(screen.queryByText('Hidden rationale.')).toBeNull();
  });
});
