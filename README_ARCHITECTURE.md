# ApplyTrack Architecture Documents

Current root documents describe the Firebase implementation:

- `ARCHITECTURE.md`: feature boundaries, routing, authentication, caching, and data flow.
- `DATABASE.md`: Firestore document paths, fields, timestamps, and typed access.
- `SECURITY.md`: ownership rules, validation, configuration, recovery, and privacy verification.
- `UI_UX.md`: responsive layout, accessible controls, forms, and demo behavior.
- `TESTING.md`: unit, emulator, hosted Firebase, browser, and direct REST checks.
- `AGENTS.md`: instructions for coding agents.
- `IMPLEMENTATION_PLAN.md`: historical seven-day plan; its Supabase backend was replaced at the user's request.

The original user-created architecture bundle remains unchanged under `applytrack-architecture/`. It documents the initial Supabase design. Firebase was selected because the user's two free Supabase project slots were already in use. ApplyTrack stays in `C:\applytrack`, independently of the existing portfolio.
