# ApplyTrack verification

## Finite follow-up review — local delivery

Verified on 2026-10-01 in `C:\applytrack`, using disposable `demo-applytrack` Auth/Firestore emulators and local Vite on port 5174. No real records, hosted rules, frontend deployment, or portfolio files were modified. Implementation and verification made no new project commits or deployments.

| Check                            | Observed result                                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| TypeScript                       | Passed                                                                                                           |
| Vitest                           | 73 tests passed across five files                                                                                |
| Production build                 | Passed; main bundle 853.37 kB minified / 257.86 kB gzip triggers Vite's 500 kB warning                           |
| Full isolated Playwright         | 37 tests passed; zero skips; 4.9 minutes                                                                         |
| Direct Firestore REST            | 46 emulator ownership/integrity checks passed within the browser suite                                           |
| Presentation                     | Review/demo checked at 360, 390, 768, 1024, and 1440px; completion, conflict, and refresh-error states inspected |
| Accessibility                    | Selected automated checks and keyboard dialog/focus tests passed; not a complete conformance audit               |
| Cleanup                          | Isolated runner stopped Auth, Firestore, hub, and logging normally                                               |
| Final simplification/code review | Completed; eight review lenses, zero actionable findings; R1-R13 and U1-U5 met                                   |

### Verified behavior

- Due work includes only Saved, Applied, and Interviewing with a date on/before local today, ordered by date/company/ID. Upcoming work after today through seven days ahead remains separate.
- Reviewed/Waiting accept no next date or a strictly future date. Stop clears the date. Review preserves hiring stage, details, ownership, and creation time and implies no message was sent.
- Latest outcome/time persists on reload. Explicit manual scheduling reopens work after every outcome. Legacy documents without metadata remain compatible.
- Lossless revisions reject stale reviews and ordinary edits, including same-millisecond timestamps with different nanoseconds. Two-tab changes, missing records, and no-longer-due selections are rejected while drafts remain available until deliberate dismissal/reselection.
- Denied commits retain choices and due work. An acknowledged commit followed by denied reads produces saved-but-not-refreshed feedback, disables the old task, and avoids claiming verified completion until successful refresh.
- Account changes clear review state and prevent delayed prior-account callbacks from affecting the next account.
- Mounted screens update at midnight and on focus/visibility restoration; submission validates against the current local day.
- Keyboard completion moves focus to the next review action or completion heading. Mobile forms and readonly demo remain usable. The demo makes no real application request and exposes no review submission.
- Existing authentication, password recovery, ordinary CRUD, status changes, search/filter persistence, and privacy cases passed in the same isolated run.

Direct REST requests bypass React. Review checks cover cross-user/signed-out denial, exact metadata keys/outcomes/timestamps, prohibited field changes, removal/reset denial, Stop scheduling, and legacy operations. Temporary denial rules are restored in finally blocks; disposable accounts/records are cleaned up by the runner.

### Screenshots

The fresh [desktop demo](screenshots/follow-up-demo-1440px.png), [mobile demo](screenshots/follow-up-demo-390px.png), [mobile review](screenshots/follow-up-review-390px.png), [completion](screenshots/follow-up-complete-1440px.png), [refresh error](screenshots/follow-up-refresh-error-390px.png), and [conflict](screenshots/follow-up-conflict-390px.png) were inspected. Review/demo captures also exist at all five listed widths. Full-page captures can contain fixed-navigation stitching artifacts; live viewport tests passed without horizontal overflow.

### Code review

The full `ce-code-review` pass completed on 2026-10-02 against an exact private comparison with the pre-work snapshot. Correctness, standards, testing, maintainability, security, reliability, adversarial checks, and frontend races found no actionable defects. All 13 requirements and five implementation units were met. Receipt: `20261002-041334-b2db4822`.

The independent external-model pass was unavailable because its CLI tools were not installed; a local adversarial review completed. The simplification passes made no production changes. Small label/fixture duplication and repeated queue calculation were retained because their proposed refactors offered little benefit within this feature. No lint command is configured; Prettier checks passed. No code-review fixes or unresolved findings remained.

### Supplemental checks on 2026-10-02

The resumed type check, 73 unit tests, and Prettier check passed. Three supplemental emulator cases passed, followed by one conflict case with recovery-button focus and viewport assertions. Completion, conflict, and refresh-error states were inspected at all five planned widths. The scrollable 360px conflict dialog keeps its recovery controls reachable; [the focused recovery control](screenshots/follow-up-conflict-controls-360px.png) was inspected. Both supplemental emulator runs shut down normally.

### Reproduce and limits

```powershell
Set-Location C:\applytrack
$env:DEBUG = $null
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run test:integration
```

Java 21+ and Playwright Chromium are required. The isolated runner supplies accounts, starts Vite on 5174, runs the complete suite, and shuts down. A public-only browser run with skipped authenticated cases does not satisfy this gate. Manual process-scoped emulator setup is documented in [README](../README.md).

These results use Chromium only. Automated accessibility and selected keyboard checks do not establish complete conformance. The build has a bundle-size warning. Dependency audits from the earlier migration were not rerun and are recorded separately below.

The previously published hosted rules reject the new review map. Publishing current tested rules, frontend deployment, production-domain redirects, and real email delivery remain separate work. Hosted `test:firebase` was not rerun for this feature. No adoption, productivity, or deployment claims are made.

## Historical Firebase migration receipt

The following receipt records the earlier Firebase migration, before finite follow-up review. Its hosted rule publication, audits, and counts are historical, not repeated feature-delivery claims.

Verified on 2026-10-01 in `C:\applytrack`. ApplyTrack now uses Firebase Authentication and Cloud Firestore. The backend is connected to `applytrack-f4ae2`; the frontend runs locally and has not been deployed.

| Check                         | Result                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| TypeScript                    | Passed                                                                                        |
| Vitest                        | 37 tests passed across four files                                                             |
| Emulator Playwright           | 25 tests passed; no skips                                                                     |
| Hosted Firebase Playwright    | 20 passed; five emulator-only tests skipped                                                   |
| Direct Firestore REST privacy | 24 checks passed against both emulator and hosted backend                                     |
| Firestore rules deployment    | Compiled and published to `applytrack-f4ae2`                                                  |
| Production build              | Passed; Firebase SDK chunk triggers Vite's 500 kB warning                                     |
| Formatting                    | Prettier check passed for source, scripts, tests, and supported configuration files           |
| Production dependency audit   | No reported vulnerabilities                                                                   |
| Full dependency audit         | Five moderate findings in Firebase CLI development dependencies; no high or critical findings |
| Accessibility                 | Automated WCAG A/AA checks passed on five public screens; dialog keyboard checks passed       |
| Responsive demo               | No horizontal overflow at 360, 390, 768, 1024, and 1440px                                     |
| Local browser check           | Demo and sign-up render at port 5173; demo screenshot inspected                               |
| Code review                   | One confirmed create/readback defect fixed and covered by a browser regression                |

### Historical verified flows

- Sign-up, sign-in, invalid-login feedback, sign-out, and refreshed session persistence.
- Password reset with emulator action codes, matching password confirmation, new-password login, and rejection of used or invalid codes.
- Application creation, editing, status changes, deletion, and refresh persistence.
- Company/title search, status filters, filter persistence, dashboard counts, and follow-ups.
- Useful failed-save messages that preserve draft form values without exposing raw database errors.
- A confirmed create succeeds even when the following list read fails. Restoring read access and retrying the list reveals exactly one application.
- Account switching clears the previous user's application data.
- Public fictional demo uses local data and offers no mutations.
- Mobile cards/forms and keyboard focus trapping/restoration for dialogs.

The hosted runner creates disposable Firebase accounts and cleans their documents and accounts afterward. Its browser flows use a separate local Vite server connected to the hosted backend.

### Historical privacy checks

Direct requests use Firebase Auth ID tokens and the Firestore REST API, bypassing React. The 24 checks cover owner operations, cross-user read/list/create/update/delete denial, anonymous access denial, owner forgery and transfer denial, required fields, statuses, calendar dates, safe job URLs, unexpected fields, immutable creation times, and server-generated update timestamps.

Local temporary-denial tests alter only the disposable emulator's rules and restore them in finally blocks. Those tests used the migration rules published at that time. Current finite-review rules have not been published.

### Historical review fixes

Firestore acknowledges `setDoc` only after the write succeeds. The previous create function then performed an extra server read. If that read failed, the form reported a failed save and a retry could create a duplicate. Creation now succeeds after the acknowledged write; normal query invalidation reloads the list. The new test failed before the fix and passed afterward.

Emulator browser writes also exposed a stalled streaming connection. The development emulator client uses long polling; hosted connections retain the SDK's default transport. Both suites passed with those settings.

### Historical limits

The frontend is not deployed. Production-domain redirects and delivery of password-reset email to a real inbox remain unverified. Hosted sign-up is exercised by the disposable-account runner; browser sign-up and reset-code flows run in the emulator.

These checks use Chromium. Automated accessibility tests and selected keyboard checks do not establish complete accessibility conformance. That review identified untested Saved-to-Applied date assignment and late account-A response cases; it did not establish defects. The finite-review delivery now covers a delayed review response after switching to account B. The Saved-to-Applied coverage limitation remains.

The production build passes with a bundle-size warning. Five moderate development dependency audit findings remain in Firebase CLI's transitive dependencies. No usage or impact metrics are claimed.

### Historical reproduction

```powershell
Set-Location C:\applytrack
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run test:integration
npm.cmd run test:firebase
```

Install Java 21 or later and Playwright Chromium for the isolated integration suite. Firebase rules can be published with `npm.cmd run firebase:deploy` after CLI sign-in. See [README](../README.md) and [TESTING.md](../TESTING.md).
