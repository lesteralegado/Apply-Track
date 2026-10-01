# ApplyTrack Security

Firestore Security Rules are the database authorization boundary. React's route guard controls navigation only.

## Ownership

Each application is under the authenticated user's UID. Signed-out users cannot read or write real applications. A user cannot read, list, create, update, or delete another user's records. The owner field must match the path, cannot change on update, and cannot be forged when creating a document. All other document paths are denied by default.

## Integrity

Rules require the original fields, allow only the optional review map in addition, and enforce nonblank company/title, a recognized status, valid date-only values, an application date outside Saved, HTTP/HTTPS job URLs, valid optional notes, and server-generated timestamps. Creation time is immutable. See `firestore.rules`.

The optional review map contains exactly an allowed outcome and a timestamp. Creates cannot forge a prior review. A changed map requires request-time metadata, may change only the map, follow-up date, and update time, and must clear the date for Stop. A recorded map cannot be removed/reset. Legacy documents without it remain readable, editable, and deletable.

Revision checks protect review and ordinary-edit drafts against stale writes. Due eligibility and future scheduling are client behavior; database rules independently enforce owner access and field integrity for direct callers.

## Configuration

Firebase web configuration identifies the project and is intended for browser use. It does not authorize access. Never put service-account credentials, private keys, CLI OAuth credentials, or administrative tokens in `VITE_*` variables or frontend code.

`.env.local`, debug logs, browser traces, emulator data, and local tooling are ignored by Git. Test account passwords are generated at runtime and never written to tracked files.

## Sessions and reads

Firebase manages authentication persistence. An account change clears query data. User-scoped query keys and explicit owner IDs prevent reuse of the previous account's data. Database reads require server confirmation; Firestore's default memory cache is not used as proof of authorization.

Review state resets on UID changes, and late mutation callbacks verify the current UID before showing feedback or navigating. Failures expose useful messages and preserve draft form values. Technical details are logged only during development.

## Password recovery

Reset links carry a single-use Firebase action code. The custom handler validates it before enabling the form. Invalid or used links provide a new-link action. A successful reset returns the user to sign-in. Unknown email addresses receive the same UI acknowledgment.

## Verification

The privacy runner uses Firebase Auth ID tokens and Firestore REST calls rather than the React UI. It checks owner CRUD, cross-user and anonymous denial, ownership forgery/transfer, field validation, and timestamp integrity. Browser tests also switch accounts to check query-cache isolation.

Emulator tests use the `demo-applytrack` project; their insecure development tokens never reach hosted services. The emulator flag is honored only in Vite development builds.

Finite-review changes were tested only with disposable emulators. Previously published hosted rules do not yet permit this review map; hosted review writes will be denied until these tested rules are published separately. No hosted rules or real records were changed for this feature. See [verification results](docs/verification.md) for current and historical receipts.

## Dependencies

The gRPC dependency is pinned to a compatible patched 1.x version. Remaining npm audit findings, if any, are reported in the verification document. Do not claim that a passing application security test means that every dependency is vulnerability-free.
