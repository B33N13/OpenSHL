// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { bankingQuestions } from '../lib/questions/loader';
import { QuestionSchema } from '../lib/questions/schema';
import { createAssessmentSession, useAssessmentSession } from '../lib/session/useAssessmentSession';
import type { Answer } from '../lib/session/types';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function correct(index: number): Answer {
  const question = bankingQuestions[index];
  return question.type === 'verbal'
    ? { type: 'verbal', statements: question.statements.map((statement) => statement.answer) }
    : { type: 'single', optionId: 'B' };
}
async function open() {
  const saved = createAssessmentSession('banking', bankingQuestions);
  const hook = renderHook(() => useAssessmentSession(saved.id));
  await waitFor(() => expect(hook.result.current.session?.id).toBe(saved.id));
  return { ...hook, saved };
}

describe('assessment session', () => {
  it('creates a UUID session and restores it on a fresh hook mount', async () => {
    const { result, saved, unmount } = await open();
    expect(saved.id).toMatch(/^[0-9a-f-]{36}$/i);
    act(() => { expect(result.current.answer(correct(0))).toBe(true); expect(result.current.next()).toBe(true); });
    unmount();
    const restored = renderHook(() => useAssessmentSession(saved.id));
    await waitFor(() => expect(restored.result.current.session?.currentIndex).toBe(1));
    expect(restored.result.current.session?.answers['bank-num-001']).toEqual(correct(0));
  });
  it('rejects missing answers, unknown choices, incomplete verbal answers and early finish', async () => {
    const { result } = await open();
    act(() => {
      expect(result.current.next()).toBe(false);
      expect(result.current.finish()).toBeNull();
      expect(result.current.answer({ type: 'single', optionId: 'unknown' })).toBe(false);
      expect(result.current.answer(correct(0))).toBe(true);
      expect(result.current.next()).toBe(true);
      expect(result.current.answer({ type: 'verbal', statements: ['true'] })).toBe(false);
      expect(result.current.answer({ type: 'single', optionId: 'A' })).toBe(false);
      expect(result.current.next()).toBe(false);
    });
  });
  it('finishes all-correct as 3, persists completion, and prevents later edits', async () => {
    const { result, saved, unmount } = await open();
    act(() => {
      for (let index = 0; index < 3; index++) {
        result.current.answer(correct(index));
        if (index < 2) result.current.next();
      }
      expect(result.current.next()).toBe(false);
      const done = result.current.finish();
      expect(done?.score).toBe(3);
      expect(done?.completedAt).toBeDefined();
      expect(result.current.finish()).toEqual(done);
      expect(result.current.answer({ type: 'single', optionId: 'A' })).toBe(false);
    });
    unmount();
    const restored = renderHook(() => useAssessmentSession(saved.id));
    await waitFor(() => expect(restored.result.current.session?.score).toBe(3));
  });
  it('scores all wrong, including one wrong verbal statement, as zero', async () => {
    const { result } = await open();
    act(() => {
      result.current.answer({ type: 'single', optionId: 'A' }); result.current.next();
      result.current.answer({ type: 'verbal', statements: ['true', 'false'] }); result.current.next();
      result.current.answer({ type: 'single', optionId: 'A' });
      expect(result.current.finish()?.score).toBe(0);
    });
  });
  it('preserves SJT neutral half-points through persistence', async () => {
    const sjt = QuestionSchema.parse({ id: 'test-sjt', track: 'banking', type: 'sjt', difficulty: 'easy', scenario: 'Test fixture.', explanation: 'Test fixture.',
      options: ['most', 'neutral', 'least', 'neutral'].map((effectiveness, index) => ({ id: String(index), text: 'Fixture option', effectiveness, rationale: 'Fixture.' })) });
    const saved = createAssessmentSession('banking', [sjt]);
    const { result } = renderHook(() => useAssessmentSession(saved.id));
    await waitFor(() => expect(result.current.session?.id).toBe(saved.id));
    act(() => { result.current.answer({ type: 'single', optionId: '1' }); expect(result.current.finish()?.score).toBe(0.5); });
  });
  it('handles a missing session and switching session IDs safely', async () => {
    const saved = createAssessmentSession('banking', bankingQuestions);
    const hook = renderHook(({ id }) => useAssessmentSession(id), { initialProps: { id: saved.id } });
    await waitFor(() => expect(hook.result.current.session?.id).toBe(saved.id));
    hook.rerender({ id: crypto.randomUUID() });
    await waitFor(() => expect(hook.result.current.session).toBeNull());
    expect(hook.result.current.answer(correct(0))).toBe(false);
    expect(hook.result.current.finish()).toBeNull();
  });
  it('treats malformed stored data as unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('{broken');
    const { result } = renderHook(() => useAssessmentSession(crypto.randomUUID()));
    await waitFor(() => expect(result.current.session).toBeNull());
  });
  it('does not advance state when persistence fails', async () => {
    const { result } = await open();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded'); });
    expect(() => act(() => { result.current.answer(correct(0)); })).toThrow('Quota exceeded');
    expect(result.current.session?.answers).toEqual({});
    expect(result.current.next()).toBe(false);
  });
  it('fails session creation explicitly when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage denied'); });
    expect(() => createAssessmentSession('banking', bankingQuestions)).toThrow('Storage denied');
  });
});
