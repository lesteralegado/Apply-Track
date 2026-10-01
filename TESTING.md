# ApplyTrack Verification

## Fast checks

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

Unit tests cover calendar dates, local-midnight timing, due/upcoming boundaries, terminal-status exclusions, date/company/ID ordering, reopening after all review outcomes, filtering, sorting, application/review validation, legacy/new document decoding, and nanosecond-preserving revisions.

## Complete isolated workflow

Install Java 21 or later and Playwright Chromium, then run:

```powershell
npx.cmd playwright install chromium
npm.cmd run test:integration
```

This starts Auth and Firestore emulators for `demo-applytrack`, loads the repository's rules, creates disposable accounts, starts a separate Vite server, runs Playwright, removes test records/accounts, and shuts down the emulators.

On this computer, the runner can also find the portable Java runtime in the ignored `.context/compound-engineering/firebase-migration/java` directory. Other developers should install Java normally or set JAVA_HOME.

Tests cover account creation, login/logout, refresh persistence, complete CRUD, search/filter behavior, status updates, follow-ups, failed-save messages and preserved drafts, account-switch isolation, password reset and used/invalid codes, mobile widths, keyboard dialogs, and accessibility.

Review tests cover blank/future scheduling, all outcomes, persistence, preserved unrelated fields, ordinary-edit/review conflicts across tabs, missing/no-longer-due selections, denied writes with retained drafts, acknowledged saves followed by denied reads, receipt recovery, delayed account-switch callbacks, midnight/focus/visibility updates, and submission-time date validation. Keyboard and viewport checks cover review, completion, conflicts, refresh errors, and the immutable demo at 360, 390, 768, 1024, and 1440px.

Failure tests temporarily deny creation, review commits, or reads only in the isolated emulator and restore the normal rules in a finally block. A confirmed create must succeed even if the subsequent list read fails, so retrying cannot create duplicate records. Hosted rules are never changed by browser tests.

Direct REST requests bypass React. The emulator suite contains 46 ownership/integrity checks, including legacy compatibility, strict review metadata, timestamps, preservation, and prohibited review changes. The historical hosted path contains 24 checks. A public-only `test:e2e` run with skipped authenticated cases does not satisfy the complete gate; `test:integration` supplies accounts and runs all applicable isolated cases. Clear an inherited debug flag before the runner if set: `$env:DEBUG = $null`.

## Hosted Firebase verification

```powershell
npm.cmd run test:firebase
```

This command is separate from finite-review local delivery. Review rules are not yet published; emulator results do not establish hosted review support. Uses the project in `.env.local`, creates two disposable Firebase accounts, runs the applicable browser/direct REST tests, and removes test records and accounts. Emulator-only signup, reset-inbox, invalid-reset-code, and temporary-denial cases are skipped on the hosted project; they run in the isolated suite.

`npm run test:e2e` also supports manually supplied dedicated Firebase credentials. Do not use a personal account for automated mutation tests. `npm run test:privacy` runs the direct REST checks with the dedicated credentials in `.env.local`.

## CI

The Checks workflow installs Node and Java, builds, runs unit tests, installs Chromium, and runs the full emulator suite. It needs no hosted Firebase secrets.

Passing local tests does not verify a deployed frontend, production email delivery, browsers other than Chromium, or accessibility beyond the automated and keyboard checks performed. Record actual results in `docs/verification.md`.
