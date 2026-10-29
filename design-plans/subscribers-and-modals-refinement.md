# Stream RADIUS Subscribers Console, Diagnostic Drawer & 360 Modal Refinement

Written against: 2fb7297c48f3dfc1619e2e1fa3dc984fb60e58b9

## Evidence chain

- Surface: `#subscribers` page (`app/web/subscribers.js`), Diagnostic Drawer (`#diagDrawer` in `app/web/subscribers.js`), and Subscriber 360 Modal (`openSubscriber` in `app/web/app.js`).
- Problem:
  1. The `#subscribers` toolbar is a cluttered 4-row layout with misaligned date pickers, cut-off dropdowns, and fragmented action buttons.
  2. The Subscriber 360 Modal dumps 4 raw un-paginated tables and cramped key-value pairs without tabs or modern KPI cards.
  3. The Diagnostic Drawer suffers from stark header contrast, an oversized blue circular close button, and uncoordinated corrective action buttons.
- Design evidence: Screenshots `media_1793252128678_465ca61a.png`, `media_1793252145451_aa4319be.png`, `media_1793252164789_ae7fb36b.png`, and Studio Design #3 token standards in `app/web/app.css`.
- Owner: `app/web/subscribers.js`, `app/web/app.js`, and `app/web/app.css`.
- Scope and affected surfaces: `#subscribers` table & toolbars, `#diagDrawer`, and `openSubscriber(id)`.
- Uncertainty: None.

## Design decision

1. **Subscribers Operational Toolbar (`app/web/subscribers.js`)**:
   - Merge the 4 scattered filter rows into a clean 2-tier **Studio NOC Toolbar**:
     - Tier 1: Search input + primary actions (`إضافة مشترك`, `عمليات سريعة`, `تجديد`).
     - Tier 2: Filter pills (Status, Profile, Manager) + table density & export controls (`CSV`, `Excel`, `عرض الأعمدة`).
   - Reorder table columns so `اسم المستخدم` (Username) is pinned right after `#`, with `التشخيص` (Diagnosis) styled as a sleek inline action pill.

2. **Subscriber 360 Profile Modal (`app/web/app.js`)**:
   - Replace raw `.kv` text with a 4-card Bento Summary Grid (Balance, Remaining Quota, IP/MAC, Expiry).
   - Convert the 4 stacked database tables into **Segmented Tabs**:
     `[ 💳 الفواتير والمدفوعات ] [ 🌐 الجلسات وسجل الاتصال ] [ ⚙️ إعدادات الراديوس ] [ 📜 سجل العمليات ]`.
   - Apply `.modern-table` styling and standard close button positioning (`left: 18px` in RTL).

3. **Diagnostic Drawer (`app/web/subscribers.js`)**:
   - Harmonize drawer header to use `var(--bg-card-subtle)` with consistent border and typography.
   - Replace oversized blue close button with a refined 36px rounded close icon button matching `.modal-x`.
   - Re-align telemetry metric boxes with clear typography and color-coded status badges.

## Reuse

- Tokens: `var(--bg-card)`, `var(--bg-card-subtle)`, `var(--border)`, `var(--text-main)`, `var(--text-muted)`, `var(--accent)`.
- Components: `.modern-table`, `.status-pill`, `.kpi-mini-card`, `.btn-primary`.
- Exemplar: Dashboard Bento KPIs in `app/web/dashboard.js`.

## Changes

1. `app/web/subscribers.js`:
   - Consolidate toolbar layout into unified NOC Toolbar.
   - Harmonize `#diagDrawer` header, close button, and telemetry cards.
2. `app/web/app.js`:
   - Redesign `openSubscriber(id)` with Bento KPI cards and tabbed data tables.
3. `app/web/app.css`:
   - Add styles for `.noc-toolbar-tier`, `.sub360-kpis`, `.sub360-tabs`, and refined `.drawer-close-btn`.

## Validation

- Product: Browsing `#subscribers`, inspecting diagnostics, and opening subscriber 360 card feels unified, legible, and ergonomic.
- Interface: Verified across Light and Dark themes.
- Repository: `cmd.exe /c "cd app && set GOOS=linux&& set GOARCH=amd64&& go build -o ../radmanager_linux ."` → exit code 0.
