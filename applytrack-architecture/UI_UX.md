# ApplyTrack UI/UX Architecture

## 1. Design Direction

ApplyTrack should look like a clean modern SaaS productivity dashboard.

Characteristics:

- Light theme
- Professional
- Minimal
- High readability
- Compact but not crowded
- Recruiter-friendly
- Responsive
- Accessible

Avoid excessive:

- Glassmorphism
- Gradients
- 3D effects
- Motion
- Decorative cards
- Large marketing sections inside the authenticated app

## 2. Application Layout

### Desktop

```text
┌───────────────┬─────────────────────────────────┐
│ ApplyTrack    │ Header                          │
│               ├─────────────────────────────────┤
│ Dashboard     │                                 │
│ Applications  │ Page Content                    │
│               │                                 │
│               │                                 │
│ Sign Out      │                                 │
└───────────────┴─────────────────────────────────┘
```

### Mobile

```text
┌────────────────────────────┐
│ ApplyTrack          Profile│
├────────────────────────────┤
│                            │
│ Page Content               │
│                            │
├────────────────────────────┤
│ Dashboard   Applications   │
└────────────────────────────┘
```

## 3. Routes and Screens

### Public

- Demo
- Sign In
- Sign Up
- Forgot Password
- Update Password

### Protected

- Dashboard
- Applications
- New Application
- Edit Application

## 4. Dashboard

Recommended hierarchy:

```text
Dashboard

Overview cards
[ Total ] [ Applied ] [ Interviewing ] [ Offers ]

Follow-ups
├── Overdue
└── Upcoming

Recent applications
```

Do not overload the dashboard with charts for V1.

The main purpose is to quickly answer:

- How many applications do I have?
- Which stage are they in?
- Which follow-ups need attention?

## 5. Applications Page

Header:

```text
Applications                         [+ Add Application]
Track and organize your job search.
```

Controls:

```text
[ Search company or role... ] [ Status ▼ ]
```

Default order:

```text
Most recently updated first
```

## 6. Desktop Table

Columns:

```text
Company
Job Title
Status
Applied
Follow-up
Updated
Actions
```

Keep actions compact.

Primary row action:

- Edit

Secondary menu:

- Delete
- Open job URL when available

## 7. Mobile Cards

On mobile, replace the table with cards.

```text
┌──────────────────────────────┐
│ Acme Technologies            │
│ Frontend Developer           │
│                              │
│ Interviewing                 │
│                              │
│ Applied    Sep 21, 2026      │
│ Follow-up Oct 03, 2026       │
│                              │
│ Edit                     ••• │
└──────────────────────────────┘
```

Do not horizontally scroll the desktop table on small screens if a card representation can provide a better experience.

## 8. Application Form

Use one reusable `ApplicationForm` for create and edit.

Fields:

```text
Company *
Job Title *
Job URL
Status *
Application Date
Follow-up Date
Notes
```

Buttons:

```text
Cancel
Save Application
```

For editing:

```text
Cancel
Save Changes
```

## 9. Statuses

Canonical values:

```text
saved
applied
interviewing
offer
rejected
withdrawn
```

UI labels:

```text
Saved
Applied
Interviewing
Offer
Rejected
Withdrawn
```

Use badges, but always include readable text. Never communicate status using color alone.

## 10. Follow-Up States

```text
Overdue
Today
Upcoming
None
```

Rules:

```text
follow_up_date < today       -> overdue
follow_up_date == today      -> today
today < date <= today + 7d   -> upcoming
```

Completed states should normally not appear in actionable follow-ups:

- Offer
- Rejected
- Withdrawn

## 11. Empty States

Examples:

### No applications

```text
No applications yet

Start tracking your job search by adding your first application.

[ Add Application ]
```

### Search returns nothing

```text
No matching applications

Try changing your search or status filter.
```

### No follow-ups

```text
You're all caught up

You don't have any upcoming follow-ups.
```

## 12. Loading States

Use skeletons where appropriate.

Avoid full-page spinners after the application shell has loaded.

Examples:

- Dashboard card skeletons
- Application row skeletons
- Form submit loading state

## 13. Error States

User-facing errors should be understandable.

Avoid:

```text
PostgREST PGRST116
```

Prefer:

```text
We couldn't load your applications.
Please try again.
```

For failed saves:

```text
We couldn't save this application.
Your changes were not lost from the form. Please try again.
```

## 14. Delete Confirmation

Never delete immediately.

```text
Delete application?

This will permanently remove your application for
Frontend Developer at Acme Technologies.

[ Cancel ] [ Delete ]
```

## 15. Demo Page

The demo page should look close to the real dashboard but include a clear persistent notice:

```text
Demo Mode
This dashboard uses fictional sample data. Editing is disabled.
```

Provide a visible CTA:

```text
[ Create Your Own Account ]
```

The demo should demonstrate:

- Dashboard cards
- Follow-ups
- Search
- Status filters
- Responsive application list

It must not create or change database records.

## 16. Accessibility

Required:

- Semantic buttons and links
- Visible keyboard focus
- Associated form labels
- Accessible validation errors
- Keyboard-accessible menus
- Dialog focus trapping
- Escape closes dialogs when appropriate
- Sufficient contrast
- Status text independent of color
- Logical heading hierarchy

## 17. Responsive Rules

Suggested breakpoint behavior:

```text
< md
  mobile navigation
  application cards
  single-column forms

>= md
  sidebar
  application table
  wider form layout where useful
```

Test at minimum:

- 360px
- 390px
- 768px
- 1024px
- 1440px
