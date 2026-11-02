# ApplyTrack

A job application tracker that runs entirely in your browser — React + Vite, Tailwind CSS, Lucide icons, Recharts.
No backend, no database, no login. Everything is saved to `localStorage`.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the build
```

## What's inside

| Area | Highlights |
| --- | --- |
| **Overview** | Six clickable stat cards (they filter the tracker), activity chart (weekly/daily), status donut, follow-up reminders, upcoming interviews, offers & success rate |
| **All Applications** | Spreadsheet-style tracker: inline editing (click a cell, **Tab** / **Shift+Tab** to move, **Enter** to save, **Esc** to cancel), sticky header + sticky company column, per-column sort & filter, search, status chips, multi-select with bulk status/delete, pagination, CSV import/export, undo on delete |
| **My Wishlist** | Cards for roles you haven't applied to yet; "Mark as applied" moves them into the pipeline and schedules a follow-up |
| **Interviews** | Upcoming / needs-update / history, with a 1–6 round tracker per application |
| **Follow-ups** | Overdue, today, next 7 days, later — mark done or snooze; suggestions for applications gone quiet |
| **Analytics** | Success / interview / response rates, monthly stats, conversion funnel, performance by source, companies with offers |
| **Settings** | Name, light/dark theme, default follow-up days, export/import, load sample data, delete everything |

Press **Ctrl/Cmd + Enter** in the Add/Edit panel to save.

## CSV

Export columns: Company Name, Job Role, Job Type, Applied Date, Application Source, Job Description Link, Salary / CTC,
Required Skills, My Skill Match (1-10), Status, Priority, Interview Round, Interview Date, Follow-up Date,
Resume Customized, Assessment Completed, Notes.

Import accepts the same headers (case/punctuation-insensitive), `YYYY-MM-DD` or `DD/MM/YYYY` dates, and Yes/No for the
checkbox columns. Imported rows are added to your existing data.

## Project layout

```
src/
  App.jsx                    app shell, state, data actions
  lib/                       constants, utils (dates, stats, CSV), seed data, localStorage hook
  components/                Tracker (spreadsheet), ApplicationPanel, Sidebar, Charts, ui kit
  views/                     Overview, Wishlist, Interviews, Followups, Analytics, Settings
```

Colours are CSS variables in `src/index.css` (light and `.dark`) mapped to Tailwind tokens in `tailwind.config.js`.

## Data

Data lives in your browser under the keys `applytrack.v1.apps` and `applytrack.v1.settings`. Clearing site data erases it —
export a CSV now and then as a backup. The app starts with sample data; use **Settings → Delete everything** (or the banner
on the dashboard) to start fresh.
