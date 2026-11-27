# LevelGround

Free, mobile-first graduate assessment practice for South African youth. Phase 1 foundation only; no assessment UI, authentication, database writes, deployment, analytics or trackers yet.

## Setup

Use Node.js 22 LTS and npm 10 or later.

```sh
npm install
npm run test
npm run typecheck
npm run lint
npm run dev
```

Open http://localhost:3000. For a production build, run `npm run build` then `npm start`. No environment variables are required in Phase 1. `.env.example` names the public Supabase settings needed in Phase 3; never commit real secrets or expose a service-role key to the browser.

Dependencies could not be installed in the initial workspace because registry DNS was unavailable. There is no generated lockfile yet. Run `npm install` on a connected machine and commit the generated `package-lock.json`; use `npm ci` thereafter. Tests, type checking and the production build require this installation and have not been verified here.

## Foundation

- Next.js App Router, React Server Components, strict TypeScript, Tailwind CSS and a local shadcn-style Button primitive with Radix Slot. System fonts avoid external font requests.
- `lib/questions/schema.ts` preserves the supplied Zod schemas and exports inferred TypeScript types.
- `lib/questions/bank/banking.json` contains exactly the three supplied seeds. No proprietary question banks or invented production questions are included.
- `lib/questions/loader.ts` validates JSON at import, rejects mixed tracks and duplicate IDs, and returns independent copies. Missing track banks fail explicitly.
- `lib/scoring.ts` scores choices as 1/0, verbal questions as all-or-nothing, and SJT most/neutral/least as 1/0.5/0. `isCorrect` indicates full credit. Missing or invalid selections score zero.
- Vitest covers seeds, schema failures, loader failures, all five scoring types, verbal completeness, half points and hand-worked totals. Synthetic deductive/SJT test fixtures never enter the question bank.
- Future route directories are placeholders, not implemented screens. Only `/` currently renders a foundation page. Privacy/consent/authentication will need implementation before any personal data is collected.

## Decisions needed before later phases

1. A unique 10-question banking assessment cannot be drawn from three supplied seeds; the bank needs at least seven additional owner-approved questions. Meeting all type quotas also requires numerical, deductive and SJT coverage. Do not duplicate questions or invent content to hide this gap.
2. The source document for the other five tracks was not supplied. Their question banks remain deferred to Phase 4 per the detailed build order.
3. The proposed SQL `score int` cannot store SJT half points. Phase 3 needs an agreed decimal score representation, plus stored ordered question IDs (and a bank version/snapshot strategy for stable resumes).
4. Deleting only a profile leaves the Supabase Auth user/email behind. The Phase 3 server-side hard-delete flow must remove the Auth user as well, with profile/session/response cascades and ownership checks.
5. The specification asks both for optional display-name storage and email-only PII. Resolve that before implementing the profile editor. Consent plus an 18-or-older attestation must be enforced before signup without collecting date of birth.
6. Supply the privacy contact email and retention period before publishing the privacy policy. No placeholder policy is presented as compliant.
7. Privacy implementation is labelled Phase 1 in one section but auth is explicitly Phase 3 in the build order. This foundation follows the instruction to implement Phase 1 only; it collects no data. Consent, age restriction, deletion and a reviewed policy must precede live signups.

## Review gates

Phase 2: local assessment renderers/results and one Playwright happy path, after resolving seed coverage. Phase 3: Supabase migrations, RLS, magic links, consent, age restriction, persistence and account deletion. Phase 4: owner-sourced remaining banks, dashboard, PWA, Vercel deployment and measured mobile performance. Stop for owner review after each phase.

## Phase 2 progress — sub-step 2

Question renderers and session state are implemented. Assessment, results and track screens remain pending their review gates. No auth or database code has been added.

Run `npm run dev` and open http://localhost:3000/preview to inspect the three approved banking questions. The gallery is development-only and returns 404 in production; it is not an assessment session.

`lib/session/useAssessmentSession.ts` is the sole module accessing sessionStorage. `createAssessmentSession(track, questions)` creates a client UUID and stores the question snapshot under that UUID. `useAssessmentSession(id)` exposes `session`, `answer`, `next`, and `finish`. A session is `undefined` during hydration, `null` when unavailable, or the validated session object when ready. Invalid/incomplete answers are rejected. Storage writes happen before state changes, and write errors propagate so callers can report them and avoid navigating away. Finished sessions are immutable through the hook, with idempotent completion and fractional scores preserved. Session state lasts within the current browser tab; cross-device persistence is outside Phase 2.

Verification now runs both locally using a standalone Node runtime and in GitHub Actions. Sub-step 2 has 41 passing unit tests, including storage failure, hydration, reload persistence, answer gating, completion, verbal all-or-nothing and SJT half-points. The original setup limitation above records the initial Phase 1 environment.

### Sub-step 3 — assessment screen

`/assessment/[sessionId]` now renders progress, one question at a time, and a gated Next button. The last question uses See results; completion is saved before redirect. Missing/invalid sessions redirect to `/dashboard`, and already completed sessions redirect to their results URL. Those destination screens are still pending later sub-steps. Storage errors are displayed and prevent advancement. The question heading receives focus when progressing for keyboard/screen-reader users. `/preview` now includes a development-only three-question assessment launcher using the unchanged seed bank.

Verification includes component integration tests for verbal completeness, restored selections, completion navigation, missing sessions and storage failures. Playwright remains scheduled for sub-step 7.
