# Stream RADIUS Utilities, Card Designer & Network Fleet Modernization

Written against: 2fb7297c48f3dfc1619e2e1fa3dc984fb60e58b9

## Evidence chain

- Surface: `#cardtpl` (`app/web/cardtpl.js`), `#nas` (`app/web/nas.js`), `#cafe` (`app/web/cafe.js`), and `#ports` (`app/web/tools.js`).
- Problem:
  1. `#cardtpl` suffers from micro-control clutter (6 crammed checkboxes and unpadded numbers) and floating actions.
  2. `#nas` and `#cafe` stretch empty states across the entire 1920px screen width with giant dashed borders and isolated buttons.
  3. `#ports` misaligns routing and port forwarding inputs with the data tables below.
  4. Topbar `.icon-btn` elements render as bright solid blue circles in light mode due to legacy `button { background: var(--blue) }` inheritance.
- Design evidence: Screenshots `media_1793252328429_da826900.png`, `media_1793252361265_71fa8aef.png`, `media_1793252386562_61d2ca16.png`, and `media_1793252408483_3d12c2af.png`.
- Owner: `app/web/cardtpl.js`, `app/web/nas.js`, `app/web/cafe.js`, `app/web/tools.js`, and `app/web/app.css`.
- Scope and affected surfaces: All remaining utility views, NAS fleet, cafe cards, and port routing.
- Uncertainty: None.

## Design decision

1. **Global Canvas Layout Constraint**:
   Wrap `#content > div` in `max-width: 1140px; margin: 0 auto;` to eliminate horizontal overstretch across all secondary pages.
2. **Topbar Icon Button Normalization**:
   Explicitly style `.icon-btn` with `background: transparent !important; color: var(--text-muted) !important; border: 1px solid var(--border) !important;` to eliminate solid blue circle artifacts.
3. **Card Designer Studio Workspace (`#cardtpl`)**:
   Establish a balanced 2-column layout:
   - Primary Pane: The interactive drag-and-drop Card Preview.
   - Inspector Pane: Organized Bento properties for dimensions, elements toggles, font size, and background image with an integrated action footer.
4. **Studio Empty State Pattern (`#nas`, `#cafe`, `#ports`)**:
   Replace massive 1900px dashed boxes with centered, compact Studio Empty Bento Cards (`max-width: 480px; margin: 40px auto; padding: 32px; text-align: center;`) featuring an icon badge, friendly subtitle, and primary call-to-action button.
5. **Port Forwarding Bento Panels (`#ports`)**:
   Consolidate Static Routes and Port Forwarding into clean Bento Cards with form inputs integrated directly into the table headers.

## Reuse

- Studio Design #3 Tokens: `var(--bg-card)`, `var(--bg-card-subtle)`, `var(--border)`, `var(--text-main)`, `var(--text-muted)`, `var(--accent)`.
- Components: `.bento-subcard`, `.modern-table`, `.status-pill`, `.btn-primary`.

## Changes

1. `app/web/app.css`:
   - Enforce global `#content > div { max-width: 1140px; margin: 0 auto; }`.
   - Clean up `.icon-btn` styling on `#topbar`.
   - Add `.studio-empty-state`, `.cardtpl-workspace`, and `.ports-panel`.
2. `app/web/cardtpl.js`:
   - Restructure into 2-column workspace with categorized property inspector.
3. `app/web/nas.js`, `app/web/cafe.js`, `app/web/tools.js`:
   - Upgrade to compact Studio Empty State cards and Bento layout.

## Validation

- Product: Card designer, NAS fleet, cafe cards, and port routing look polished, centered, and cohesive with the Dashboard.
- Interface: Verified across Light and Dark themes.
- Repository: `cmd.exe /c "cd app && set GOOS=linux&& set GOARCH=amd64&& go build -o ../radmanager_linux ."` → exit code 0.
