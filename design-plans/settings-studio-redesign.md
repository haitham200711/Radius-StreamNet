# Stream RADIUS Settings Console — Studio Design #3 Redesign

Written against: 2fb7297c48f3dfc1619e2e1fa3dc984fb60e58b9

## Evidence chain

- Surface: `#settings` route (`app/web/settings.js`, styles in `app/web/app.css` lines 3225-3375).
- Problem: The current settings interface creates an awkward "sidebar-in-a-sidebar" effect by placing a 280px vertical list of 24 items immediately adjacent to the main right-hand navigation sidebar in RTL; it stretches form inputs to unnatural 500px+ widths across wide viewports, dumps all 12 general settings fields into an ungrouped flat container, duplicates header banners, and isolates the "حفظ الإعدادات" button in an empty white void at the bottom left.
- Design evidence: Rendered screenshot `media_1793251853598_7196584c.png`, `app/web/settings.js`, and the established Studio Design #3 token system in `app/web/app.css`.
- Owner: `app/web/settings.js` and `app/web/app.css`.
- Scope and affected surfaces: `#settings` console, `SETTINGS_CATEGORIES` navigation, and form sub-cards.
- Uncertainty: None.

## Design decision

Replace the awkward secondary vertical navigation sidebar with a sleek **Top Horizontal Studio Category Switcher** that cleanly partitions settings into 5 logical pillars:
1. **النظام والشبكة** (General, NAS, Advanced, ADV Radius, Licensing)
2. **بوابة المشترك والفواتير** (Subscriber Portal, Invoice Template)
3. **التنبيهات والرسائل** (WhatsApp, SMS, Auto-Bot)
4. **المدفوعات والمحافظ** (Payment Gateways, Electronic Wallets, Remote Backup)
5. **خدمات مكملة** (Integrations & Utilities)

Within each category, secondary tabs appear as clean, modern horizontal segmented pills.
Constrain the overall settings container to a centered, ergonomic `max-width: 1140px; margin: 0 auto;`.
Reorganize the form body from a flat unstructured list into **Thematic Bento Sub-Cards** with distinct headers, icons, and 2/3-column responsive input grids:
- **Card 1: هوية وبيانات النظام الأساسية** (عنوان الموقع، اسم المؤسسة، عملة النظام، اللغة الافتراضية)
- **Card 2: حالة التشغيل والسياسات** (حالة الموقع، حظر تسجيل الدخول، توقيت وساعة السيرفر)
- **Card 3: معلومات التواصل والمقر** (البريد، الهاتف، الموقع، العنوان الجغرافي)
Anchor the "حفظ الإعدادات" button within a unified sticky/bottom confirmation action bar.

## Reuse

- Studio Design #3 CSS Tokens: `var(--bg-card)`, `var(--bg-card-subtle)`, `var(--border)`, `var(--text-main)`, `var(--text-muted)`, `var(--accent)`, `var(--accent-subtle)`.
- Pill tabs and bento card primitives: `.dz-card`, `.modern-table`, `.status-pill`, and `.btn-primary`.
- Exemplar: Dashboard Studio Ribbon and Quick Modal Bento KPIs in `app/web/dashboard.js`.

## Changes

1. `app/web/settings.js`
   - Change: Replace the dual-column layout with a unified single-column container (`max-width: 1140px`) featuring a top category ribbon + segmented tab bar. Remove duplicate header banners, unifying into a single high-clarity header. Reorganize `bodies["إعدادات عامة"]` into 3 thematic Bento sub-cards with clear titles and icons.
   - Preserve: All form field names (`s_title`, `currency`, `def_lang`, `t_zone`, `site_status`, `block_login`, `company`, `com_email`, `website`, `com_phone`, `country`, `address`), API submission handler (`#sf.onsubmit`), mode toggle (`#modeBtn`), and existing sub-panels (`waPanel`, `smsPanel`).
   - Verify: Form values correctly populate from `api("settings")`, category and tab switches update URL hash `#settings?tab=...`, and submitting the form successfully calls `PUT api("settings")` with a confirmation toast.

2. `app/web/app.css`
   - Change: Replace `.settings-studio-layout` (which enforced a rigid `280px 1fr` dual-column grid) with `.settings-studio-container` (`max-width: 1140px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;`). Add modern styles for `.settings-pills-nav`, `.settings-subtabs-nav`, `.settings-subcard`, and `.settings-action-bar`.
   - Preserve: Universal modal, table, and dark/light mode token definitions.
   - Verify: Light and dark mode render crisp borders and legible typography on all screen sizes (mobile, tablet, desktop).

## Scope

- Inherit: All `#settings` sub-pages and tabs.
- Verify: Dashboard, Subscribers, Online, and Modals remain unaffected.
- Exclude: Unrelated backend APIs or FreeRADIUS authentication routines.

## Validation

- Product: Navigating to `#settings` displays an organized, modern Studio Console without dual-sidebar clutter or dead white space.
- Interface: Form inputs are grouped logically into crisp Bento sub-cards with balanced 2/3-column widths. Tab switching is smooth and responsive.
- System: Dual Light/Dark themes respect `localStorage.getItem("stream_theme")`.
- Repository: `cmd.exe /c "cd app && set GOOS=linux&& set GOARCH=amd64&& go build -o ../radmanager_linux ."` → exit code 0.

## Stop conditions

- Stop if API contract for `PUT /api/settings` requires missing parameters.

## Design documentation

- After acceptance and validation: Record the new Settings Bento layout in `DESIGN.md`.
