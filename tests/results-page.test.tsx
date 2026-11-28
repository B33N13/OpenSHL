// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ResultsPage from '../app/(app)/results/[sessionId]/page';
import { Explanation, QuestionReview } from '../components/results/QuestionReview';
import { createAssessmentSession, useAssessmentSession } from '../lib/session/useAssessmentSession';
import { bankingQuestions } from '../lib/questions/loader';
import { QuestionSchema } from '../lib/questions/schema';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
const router = { replace };
vi.mock('next/navigation', () => ({ useRouter: () => router }));
afterEach(() => { cleanup(); replace.mockReset(); });

async function completedBanking() {
  const session = createAssessmentSession('banking', bankingQuestions);
  const hook = renderHook(() => useAssessmentSession(session.id));
  await waitFor(() => expect(hook.result.current.session?.id).toBe(session.id));
  act(() => {
    hook.result.current.answer({ type: 'single', optionId: 'C' }); hook.result.current.next();
    hook.result.current.answer({ type: 'verbal', statements: ['true', 'false'] }); hook.result.current.next();
    hook.result.current.answer({ type: 'single', optionId: 'B' }); hook.result.current.finish();
  });
  hook.unmount();
  return session;
}

describe('results page', () => {
  it('shows the persisted score and reviews questions, chosen answers, correct answers and traps', async () => {
    const session = await completedBanking();
    render(<ResultsPage params={{ sessionId: session.id }} />);
    expect((await screen.findByLabelText('Assessment score')).textContent).toBe('1 / 3');
    const summaries = screen.getAllByText(/^Question \d+ —/);
    expect(summaries).toHaveLength(3);
    const numerical = summaries[0].closest('details')!;
    expect(numerical.open).toBe(false);
    fireEvent.click(summaries[0]);
    expect(numerical.open).toBe(true);
    expect(within(numerical).getByText('C: 5.0%')).toBeTruthy();
    expect(within(numerical).getByText('B: 5.3%')).toBeTruthy();
    expect(within(numerical).getByText(/Uses the 2025 value as the base/)).toBeTruthy();
    expect(within(numerical).getByRole('table')).toBeTruthy();
    expect(within(numerical).getByText('Step 1 — Name the quantity:').tagName).toBe('STRONG');
    const verbal = summaries[1].closest('details')!;
    expect(within(verbal).getAllByText('Correct answer:')).toHaveLength(2);
    expect(within(verbal).getByText(/No line confirms or contradicts this/)).toBeTruthy();
    expect(within(verbal).getByText('Cannot say')).toBeTruthy();
    const inductive = summaries[2].closest('details')!;
    expect(within(inductive).getByRole('list', { name: 'Sequence' })).toBeTruthy();
    expect(within(inductive).queryByText('Why your answer was incorrect')).toBeNull();
  });
  it('redirects incomplete sessions without revealing answers', async () => {
    const session = createAssessmentSession('banking', bankingQuestions);
    render(<ResultsPage params={{ sessionId: session.id }} />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith(`/assessment/${session.id}`));
    expect(screen.queryByLabelText('Assessment score')).toBeNull();
    expect(screen.queryByText('Correct answer:')).toBeNull();
  });
  it('redirects missing sessions to dashboard', async () => {
    render(<ResultsPage params={{ sessionId: crypto.randomUUID() }} />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });
  it('reviews deductive premises and conclusions', () => {
    const question = QuestionSchema.parse({ id: 'test-ded', track: 'banking', type: 'deductive', difficulty: 'easy', premises: ['All A are B.', 'All B are C.'], conclusion: 'All A are C.', explanation: 'Transitive implication.',
      options: [{ id: 'A', text: 'Conclusion follows', isCorrect: true }, { id: 'B', text: 'Conclusion does not follow', isCorrect: false }, { id: 'C', text: 'Cannot say', isCorrect: false }] });
    render(<QuestionReview question={question} answer={{ type: 'single', optionId: 'B' }} index={0} />);
    expect(screen.getByText('All A are B.')).toBeTruthy();
    expect(screen.getByText('A: Conclusion follows')).toBeTruthy();
    expect(screen.getByText('B: Conclusion does not follow')).toBeTruthy();
  });
  it('preserves fractional SJT score and shows the selected response rationale', async () => {
    const question = QuestionSchema.parse({ id: 'test-sjt', track: 'banking', type: 'sjt', difficulty: 'easy', scenario: 'Test fixture.', explanation: 'Fixture explanation.',
      options: ['most', 'neutral', 'least', 'neutral'].map((effectiveness, index) => ({ id: String(index), text: `Response ${index}`, effectiveness, rationale: `Rationale ${index}` })) });
    const session = createAssessmentSession('banking', [question]);
    const hook = renderHook(() => useAssessmentSession(session.id));
    await waitFor(() => expect(hook.result.current.session?.id).toBe(session.id));
    act(() => { hook.result.current.answer({ type: 'single', optionId: '1' }); hook.result.current.finish(); });
    hook.unmount();
    render(<ResultsPage params={{ sessionId: session.id }} />);
    expect((await screen.findByLabelText('Assessment score')).textContent).toBe('0.5 / 1');
    expect(screen.getByText(/Partially correct/)).toBeTruthy();
    expect(screen.getByText('Rationale 1')).toBeTruthy();
    expect(screen.getByText('0: Response 0')).toBeTruthy();
  });
  it('renders emphasis without interpreting imported content as HTML', () => {
    const { container } = render(<Explanation text={'**Step:** *original*\n\n<script>alert(1)</script>'} />);
    expect(container.querySelector('strong')?.textContent).toBe('Step:');
    expect(container.querySelector('em')?.textContent).toBe('original');
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByText('<script>alert(1)</script>')).toBeTruthy();
  });
});
