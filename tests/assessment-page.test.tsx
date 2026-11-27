// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AssessmentPage from '../app/(app)/assessment/[sessionId]/page';
import { createAssessmentSession } from '../lib/session/useAssessmentSession';
import { bankingQuestions } from '../lib/questions/loader';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
const router = { replace };
vi.mock('next/navigation', () => ({ useRouter: () => router }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); replace.mockReset(); });

async function open() {
  const session = createAssessmentSession('banking', bankingQuestions);
  const view = render(<AssessmentPage params={{ sessionId: session.id }} />);
  await screen.findByRole('heading', { name: 'Question 1 of 3' });
  return { session, ...view };
}

describe('assessment screen', () => {
  it('gates Next, requires every verbal statement, finishes and redirects to results', async () => {
    const { session } = await open();
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: /back/i })).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: '5.3%' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    const heading = await screen.findByRole('heading', { name: 'Question 2 of 3' });
    expect(document.activeElement).toBe(heading);
    const groups = screen.getAllByRole('group');
    fireEvent.click(within(groups[0]).getByRole('radio', { name: 'True' }));
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(groups[1]).getByRole('radio', { name: 'Cannot say' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Question 3 of 3' });
    expect((screen.getByRole('button', { name: 'See results' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: /^159$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'See results' }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith(`/results/${session.id}`));
    expect(screen.queryByRole('radio')).toBeNull();
  });
  it('redirects missing sessions after hydration', async () => {
    render(<AssessmentPage params={{ sessionId: crypto.randomUUID() }} />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });
  it('restores the current question and saved answer after remount', async () => {
    const { session, unmount } = await open();
    fireEvent.click(screen.getByRole('radio', { name: '5.3%' }));
    unmount();
    render(<AssessmentPage params={{ sessionId: session.id }} />);
    await screen.findByRole('heading', { name: 'Question 1 of 3' });
    expect((screen.getByRole('radio', { name: '5.3%' }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(false);
  });
  it('shows a storage error and allows retry without advancing', async () => {
    await open();
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota'); });
    fireEvent.click(screen.getByRole('radio', { name: '5.3%' }));
    expect(screen.getByRole('alert').textContent).toContain('could not be saved');
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true);
    spy.mockRestore();
    fireEvent.click(screen.getByRole('radio', { name: '4.4%' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Question 2 of 3' });
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
