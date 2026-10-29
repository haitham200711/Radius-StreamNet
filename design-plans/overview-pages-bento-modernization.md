# Stream RADIUS Overview Pages ("نظرة عامة") — Studio Bento Modernization

Written against: 2fb7297c48f3dfc1619e2e1fa3dc984fb60e58b9

## Evidence chain

- Surface: `#subscribers?view=overview`, `#profiles?view=overview`, and `#managers?view=overview` (`app/web/extras.js` lines 1-35, styles in `app/web/app.css` lines 231-251).
- Problem: The overview surfaces still render ancient 2011-era AdminLTE `.small-box` containers with jarring, oversaturated solid background colors (`#4b77be`, `#00a65a`, `#f39c12`, `#dd4b39`), sharp 2px corners, awkward "تفاصيل أخرى" bottom strips, and unstyled raw tables, completely contradicting the Studio Design #3 aesthetic established on the main dashboard.
- Design evidence: User screenshot `media_1793252185210_4f77148e.png`, `app/web/extras.js`, and `app/web/app.css`.
- Owner: `app/web/extras.js` and `app/web/app.css`.
- Scope and affected surfaces: Overview views for Subscribers, Profiles, Managers, and Tickets.
- Uncertainty: None.

## Design decision

Replace the legacy `.small-box` AdminLTE markup with **Studio Bento KPI Cards**:
- Use balanced card surfaces (`var(--bg-card)`) with subtle borders (`var(--border)`), 16px rounded corners, and delicate colored accent badges (e.g. emerald for active, sky for subscribers, amber for expiring, rose for disabled/offline).
- Replace the dark "تفاصيل أخرى" strip with a clean, ergonomic inline link pill (`استعراض التفاصيل ←`).
- Format the breakdown table ("المشتركون حسب الباقة / العرض") with `.modern-table` and `.table-wrap` styling, showing visual progress bars for subscriber distribution per package.
- Ensure 100% harmonious rendering in both Light and Dark themes.

## Reuse

- Studio Design #3 CSS Tokens: `var(--bg-card)`, `var(--bg-card-subtle)`, `var(--border)`, `var(--text-main)`, `var(--text-muted)`, `var(--accent)`, `var(--accent-subtle)`.
- Components: `.modern-table`, `.table-wrap`, `.status-pill`, and Bento KPI cards from `dashboard.js`.
- Exemplar: Dashboard KPIs in `app/web/dashboard.js`.

## Changes

1. `app/web/extras.js`:
   - Replace `statBox` function with a modern `studioStatBox(colorClass, icon, num, label, link)` that generates Studio Bento KPI cards.
   - Restyle the overview tables for subscribers, profiles, and managers using `.modern-table` and clean percentage distribution meters.
2. `app/web/app.css`:
   - Add dedicated classes for `.studio-overview-grid`, `.studio-kpi-card`, and `.studio-kpi-pill`.
   - Deprecate harsh legacy classes (`.small-box`, `.bg-blue-steel`, `.bg-yellow-active`).

## Validation

- Product: Navigating to `#subscribers?view=overview` displays a cohesive, modern Bento overview aligned with the primary Dashboard.
- Interface: Verified across Light and Dark themes.
- Repository: `cmd.exe /c "cd app && set GOOS=linux&& set GOARCH=amd64&& go build -o ../radmanager_linux ."` → exit code 0.
