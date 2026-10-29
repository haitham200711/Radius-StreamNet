# Stream RADIUS Enterprise Forms & Live Telemetry Modernization

Written against: 2fb7297c48f3dfc1619e2e1fa3dc984fb60e58b9

## Evidence chain

- Surface: `#user?new=1` (`app/web/user.js`), `#profile` (`app/web/profiles.js`), `#online` (`app/web/online.js`), `#managers?view=overview` (`app/web/extras.js`), and "إضافة مدير" modal (`app/web/managers.js`).
- Problem:
  1. The "إضافة مدير" modal renders absurdly oversized 44px checkboxes centered in the modal due to global `input { height: 44px !important }` rules.
  2. Full-page forms (`#user?new=1` and `#profile`) stretch unbounded across 1920px displays with dozens of disconnected inputs floating in blank space without cards or visual grouping.
  3. The `#online` telemetry page renders bi-directional font errors (`B 0` instead of `0 B`), overstretched cards, and clunky floating action buttons.
- Design evidence: Screenshots `media_1793252212745_22ae0334.png`, `media_1793252241429_ba4428ed.png`, `media_1793252255708_8c76426a.png`, `media_1793252275909_d1d7e668.png`, and `media_1793252291652_3c18ff80.png`.
- Owner: `app/web/user.js`, `app/web/profiles.js`, `app/web/online.js`, `app/web/managers.js`, and `app/web/app.css`.
- Scope and affected surfaces: All core creation forms, modals with checkboxes, and live telemetry surfaces.
- Uncertainty: None.

## Design decision

1. **Fix Checkbox Sizing Bug**:
   Exclude checkboxes and radio buttons from 44px text input styling:
   `.modal-box input:not([type="checkbox"]):not([type="radio"]) { height: 44px; ... }`
   And style checkboxes cleanly:
   `input[type="checkbox"] { width: 18px !important; height: 18px !important; min-height: 18px !important; accent-color: var(--accent); vertical-align: middle; }`.
2. **Constrain & Group Enterprise Forms (`#user?new=1`, `#profile`)**:
   Wrap form containers in `.studio-form-container { max-width: 1040px; margin: 0 auto; }`.
   Group fields into thematic Bento Sub-Cards with icons and clear headers (e.g. "بيانات الحساب الأساسية", "تحديد السرعات والـ Pool", "المعلومات الشخصية والفوترة").
3. **Harmonize Live Telemetry Page (`#online`)**:
   Upgrade telemetry KPI cards to Studio Bento format, wrap metric values in `<bdi dir="ltr" class="mono">` to fix `0 B` rendering, and consolidate floating session action buttons into a cohesive toolbar.
4. **Generalize Overview Bento Pages**:
   Apply the Studio Bento overview cards across all remaining `*?view=overview` routes.

## Reuse

- Studio Design #3 Tokens: `var(--bg-card)`, `var(--bg-card-subtle)`, `var(--border)`, `var(--text-main)`, `var(--text-muted)`, `var(--accent)`.
- Components: `.bento-subcard`, `.modern-table`, `.status-pill`.

## Changes

1. `app/web/app.css`:
   - Enforce `:not([type="checkbox"]):not([type="radio"])` on text input rules.
   - Add `.studio-form-container`, `.bento-subcard`, and `.telemetry-bento-grid`.
2. `app/web/user.js`:
   - Wrap subscriber creation form in `.studio-form-container` with grouped Bento sub-cards.
3. `app/web/profiles.js`:
   - Wrap profile creation form in `.studio-form-container` with grouped Bento sub-cards.
4. `app/web/online.js`:
   - Modernize telemetry KPI cards and wrap units in `<bdi dir="ltr">`.
5. `app/web/managers.js`:
   - Fix modal checkbox alignment with inline toggle badges.

## Validation

- Product: Creating profiles and subscribers feels organized, clear, and cohesive. Checkboxes render at standard 18px size.
- Interface: Verified across Light and Dark themes.
- Repository: `cmd.exe /c "cd app && set GOOS=linux&& set GOARCH=amd64&& go build -o ../radmanager_linux ."` → exit code 0.
