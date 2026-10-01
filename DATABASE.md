# ApplyTrack Firebase Data Model

## Location

`users/{ownerUid}/applications/{applicationId}`

No parent user document is required. Authentication owns accounts; creating an application creates its subcollection document.

## Fields

| Field            | Stored value                                               |
| ---------------- | ---------------------------------------------------------- |
| owner_id         | Firebase UID; required and immutable                       |
| company          | Nonblank string                                            |
| job_title        | Nonblank string                                            |
| job_url          | HTTP/HTTPS URL or null                                     |
| status           | saved, applied, interviewing, offer, rejected, withdrawn   |
| application_date | YYYY-MM-DD or null; required except for saved              |
| follow_up_date   | YYYY-MM-DD or null                                         |
| notes            | String or null                                             |
| created_at       | Server timestamp; immutable                                |
| updated_at       | Server timestamp; required on every write                  |
| follow_up_review | Optional latest-review map; absent or null when unreviewed |

The path supplies `Application.id`. `Application.revision` is client-only: `${updated_at.seconds}:${updated_at.nanoseconds}`. It preserves timestamp precision and is never stored as an extra field.

The review map has exactly `outcome` (`reviewed`, `waiting`, `stopped`) and `reviewed_at` (committed server timestamp). Legacy absence normalizes to null; display timestamps become ISO strings. The map records the latest review, not a history or permanent scheduling restriction. Manual rescheduling preserves it.

## Typed access and updates

Storage operations belong in `src/features/applications/api/applications.ts`. The document module validates with Zod, maps form/stored names, checks read ownership, and converts committed timestamps. Client validation improves form feedback; rules independently enforce authorization and integrity.

Create uses `serverTimestamp()` for creation/update times and succeeds after write acknowledgment. Ordinary edit uses a transaction with the draft's loaded revision, rejects missing/changed records, and preserves review metadata. Status updates transact the application-date decision. Delete uses a transaction to distinguish missing records. Owner and creation time never appear in an edit payload.

Review transacts ownership, revision, current due eligibility, and input against local today. It writes only `follow_up_date`, `follow_up_review`, and `updated_at`. Reviewed/Waiting clear the old date or replace it with a strictly future date; Stop allows no next date. Review and ordinary edit return after commit without a required readback. Transaction callbacks contain no UI effects.

Rules permit absent/null metadata on creation. Updates may preserve the map. A changed map requires request-time review metadata and may affect only the schedule, map, and update time; changed Stop requires a null date. A recorded map cannot be removed/reset. The client enforces due eligibility and future-next-date policy; rules enforce ownership, exact fields, valid calendar values, trusted times, and permitted review changes.

## Reproducible configuration

- `firestore.rules`: authorization and validation.
- `firestore.indexes.json`: indexes; no additional composite index needed.
- `firebase.json`: CLI and emulator configuration.
- `npm.cmd run firebase:deploy`: verifies signed-in access and publishes rules only.

Finite-review rules have not been published to the hosted project. Test locally before a separate publication step. The fictional demo creates no database records. Supabase accounts and records are not automatically imported.
