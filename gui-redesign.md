# Scratchy-Scratchy — Mobile & Tablet GUI Redesign Plan

> Status: **Implementation in progress (2026-10-25); this is not a completion report.**
> Verified so far: scratch-gui unit (63 suites), scratch-paint unit (15 suites), 12/12 Android Playwright
> tests, GUI lint (0 errors), production builds, and phone/tablet AVD smoke tests. The current-source
> v0.2.0 release APK was built, signed, and installed in place on both phone and tablet AVDs; build
> details and screenshots are in `artifacts/android-emulator/TEST-REPORT.md`.
> Signing correction: `SCRATCHY_DEBUG_USE_RELEASE_KEY=1` explicitly opts a local debug build into the
> existing release signer. The built and installed APKs both report SHA-256
> `57a00d9c454c099e0bbba6f94e885ce14ea675dc003fc845fe8b5ef628f9a596`; `adb install -r` succeeded.
> No uninstall or app-data reset was performed. AVDs are Android 17/API 37; the phone was tested at
> 411×914 CSS px and the tablet at 1280×800 and 800×1280 CSS px. No physical-device test has run.
> Fidelity gap: T-20/T-21 remain partial—the current stage stack is 230px and shows the full sprite
> rail, rather than the accepted 132px stage + current-sprite chip/popover design. B-19's Android AVD
> check verifies the Outline sheet/color control and explicit 0→1 pt Add outline action on a mixed-style
> group, not the single-path SVG stroke, color-only auto-width, or undo acceptance.
> Decisions: **all recommendations in this plan were accepted by the user on 2026-10-25**
> (§5 layout, §10 resolutions, §12 Outline QoL). Wording such as "recommendation" below now
> means *decided scope*, not a proposal awaiting approval. The only remaining conditionals are
> evidence-based ones inside tasks (e.g. T-23 spike outcome, T-26 Cancel semantics, §12.4
> medium-sheet promotion) — those are decided by test results, not by further sign-off.
> Target file for implementation: this plan. Target product: `scratchy-android` (Capacitor 8 Android
> wrapper) running `packages/scratch-gui` with `platform === PLATFORM.ANDROID`.
> Scope rule (from `AGENTS.md`): every change below is gated behind the Android platform check or the
> Android build. Web/desktop Scratch behaviour must be byte-for-byte unaffected.

---

## 0. Sources, method, and honesty notes

This plan is based on three inputs:

1. **Graphify** — `graphify-out/GRAPH_REPORT.md` **does not exist**. Only the detect step was run
   (`graphify-out/.graphify_detect.json`): 3,145 files · ~1.32M words (code 1,173, documents 33,
   images 1,869, video 70), 3,108 of them under `packages/`. No graph was built, so no finding below
   claims graph evidence. The codebase understanding comes from a direct source audit of the Android
   fork diff (`git diff 6a759eb..HEAD`, upstream import → HEAD) plus the files listed in §1.
   *Follow-up (optional, not blocking): finish the graphify run on `packages/scratch-gui` only
   (458 code files) if a queryable graph is wanted later.*
2. **Context7** (library IDs resolved and queried 2026-10-25):
   - `/scratchfoundation/scratch-gui` — "a set of React components that comprise the user interface
     for creating and running Scratch 3.0 projects"; GUI + VM + Blocks are linked packages.
   - `/scratchfoundation/scratch-vm` — represents, runs, and maintains the state of programs written
     in Scratch Blocks; blocks execute against *targets* (sprites/stage) in a runtime.
   - `/scratchfoundation/scratch-blocks` — Blockly fork; Scratch's "block palette" is Blockly's
     *toolbox/flyout* (a secondary workspace); its own roadmap lists "Toolbox (palette) redesign" and
     "Multitouch support" as known gaps — directly relevant to the touch problems in §4.
   - `/websites/capacitorjs` (System Bars / config docs) — on Android WebView < 140,
     `env(safe-area-inset-*)` can be wrong; Capacitor injects `--safe-area-inset-*` CSS variables as
     the fallback. Current code uses that fallback in exactly one file (see B-17).
3. **Direct code audit** of every Android-specific change since the upstream import. Key fact:
   **the fork changed no files in `scratch-vm`, `scratch-render`, or `scratch-paint`.** Block
   *execution* is upstream-identical, so "commands not working" must live in the GUI layer:
   reachability (hidden/removed controls), touch/drag delivery, workspace injection, native
   WebView permissions, or file save/load. §4 enumerates them.

**Verification limit:** no physical device is available. Both local AVDs run Android 17/API 37 and
WebView 145.0.7632.218. `scratchy-phone` is 1080×2400 at 420 dpi (411×914 CSS px); `scratchy-tablet`
is 2560×1600 at 320 dpi (1280×800 landscape and 800×1280 portrait CSS px).

The pre-existing `com.soubarnak.scratchyscratchy` package uses signer SHA-256
`57a00d9c454c099e0bbba6f94e885ce14ea675dc003fc845fe8b5ef628f9a596`. The standard Android debug
signer differed, so `packages/scratchy-android/android/app/build.gradle` now keeps default debug signing unchanged unless
`SCRATCHY_DEBUG_USE_RELEASE_KEY=1` is explicitly set; that opt-in requires the local
`SCRATCHY_KEYSTORE` and `SCRATCHY_KEYSTORE_PASS` inputs. With JDK 21, release version `0.2.0`
(versionCode 3) was built with the matching signer; `adb install -r` returned `Success` on both AVDs,
and neither package was uninstalled or data-cleared. The installed package reports target SDK 36.

Phone AVD smoke tests covered mobile navigation, block tap/drag, Outline-sheet interaction, hardware
Back/fullscreen/exit confirmation, Android share/file picker, recording, offline extension filtering,
and camera permission. Tablet AVD smoke tests covered portrait/landscape and target-pane collapse/expand.
These are emulator results, not physical-device claims. The 12-test production-bundle browser matrix
remains a separate automated check; see `artifacts/android-emulator/TEST-REPORT.md` and §4.

---

## 1. How this codebase works (minimum needed to implement this plan)

### 1.1 Package map

| Package | Role in the mobile app |
|---|---|
| `packages/scratch-gui` | The editor UI (React/Redux). Contains **all** Android layout code: `src/playground/android.jsx`, `src/playground/render-gui-android.jsx`, `src/components/mobile-nav/`, `src/lib/use-layout-mode.js`, `src/lib/layout-constants.js`, `src/lib/screen-utils.js`, plus Android CSS blocks (`:global(.scratchy-android)`) scattered in component CSS. |
| `packages/scratchy-android` | Capacitor 8 shell. `capacitor.config.ts` (`webDir: ../scratch-gui/build-android`, `android.zoomEnabled: false`), `android/app/src/main/java/com/soubarnak/scratchyscratchy/MainActivity.java` (currently an **empty** `BridgeActivity`), `AndroidManifest.xml` (INTERNET, RECORD_AUDIO, CAMERA declared), `scripts/fetch-library-assets.mjs` (bundles ~1,300 library assets for offline use). |
| `packages/scratch-vm` | Executes blocks against targets (sprites + stage); green flag, stop-all, sprite info, extensions (music, pen, video/face sensing, translate, text-to-speech, hardware). Unmodified by the fork. |
| `packages/scratch-blocks` (npm `scratch-blocks@2.1.40`) | The block palette (toolbox/flyout) + coding workspace (Blockly). Unmodified; configured at inject time in `packages/scratch-gui/src/containers/blocks.jsx`. |
| `packages/scratch-render` | WebGL stage renderer (the canvas the sprite runs on). Unmodified. |
| `packages/scratch-paint` / `scratch-svg-renderer` | Costume/backdrop editor used by the Costumes tab. Unmodified; CSS-only phone adaptations in `asset-panel.css`. |
| `packages/scratch-storage` | Project/asset load-save plumbing behind `legacy-storage.ts`. |

### 1.2 The Scratch model (from Context7 + code)

- A **project** = a **stage** (backdrop) + **sprites**. Exactly one *editing target* is selected at a
  time; the Code workspace always shows the selected target's scripts
  (`containers/target-pane.jsx`: `vm.setEditingTarget(id)`).
- **Commands** are blocks from the palette (Motion, Looks, Sound, Events, Control, Sensing,
  Operators, Variables, My Blocks + extensions). Dragging a block from the flyout into the workspace
  and snapping it under a hat block (e.g. "when ⚑ clicked") is the core gesture. The VM runs it
  (`containers/controls.jsx`: `vm.greenFlag()`, `vm.stopAll()`, shift-click green flag = turbo).
- Therefore the editor has three inseparable parts: **palette+workspace (Code)**, **stage (output)**,
  **target list (sprites)**. Any layout that puts them on separate screens breaks the
  build → run → tweak loop, because cause (blocks) and effect (sprite) are never visible together.

### 1.3 Current Android layout (what exists today)

- Entry: `playground/android.jsx` → `render-gui-android.jsx` renders the standalone GUI with
  `platform: PLATFORM.ANDROID`, `canSave: false`, `backpackVisible: false`, `onClickLogo: noop`;
  save = share-sheet via Capacitor Filesystem+Share (`shareBlob`), load = widened file chooser
  (`lib/file-accept.js`), hardware back = custom handler (menus → modals → alerts → exit confirm).
- Layout modes (`lib/layout-constants.js`, `lib/use-layout-mode.js`, kept "in sync" by comments
  with CSS media queries): `full` (≥1096px, upstream desktop), `medium` (768–1095px tablet),
  `compact` (≤767px wide **or ≤500px high**, phone). Compact block scale 0.55, flyout width 190px,
  medium block scale 0.8.
- Compact = three full-screen panes switched by a bottom nav
  (`components/mobile-nav/mobile-nav.jsx`: `MOBILE_PANES = {code, stage, sprites}`). In
  `components/gui/gui.jsx` the editor (Code/Costumes/Sounds tabs) is the *code* pane, the stage is
  the *stage* pane, and `TargetPane` (sprite info + sprite list + stage selector) is the *sprites*
  pane. Hidden panes stay mounted with `visibility: hidden` (`gui.css: .mobile-pane-hidden`) so
  Blockly and the renderer keep their size; a synthetic `resize` event is dispatched on pane switch.
  A floating green-flag/stop pill is rendered on the code pane only
  (`gui.jsx`: `isCompact && blocksTabVisible` → `.floatingControls`).
- Medium = upstream two-column layout with the 1024px editor floor removed and a forced small
  stage below 900px width (`screen-utils.js: resolveStageSize`).

---

## 2. Problem statement

1. **Sprite and commands are on different pages.** On a phone you write blocks on the Code page,
   then must switch to the Stage page to see the sprite obey them, then switch to a third Sprites
   page to select a different sprite or change x/y/size. Every iteration costs two nav taps and
   loses context (which script ran? which sprite is selected?). While a project runs on the Stage
   page there is no way to tweak a block and immediately see the change.
2. **The same split repeats inside the Code page:** Costumes and Sounds are tabs of the *code* pane,
   so painting a costume or recording a sound also hides the stage — you cannot preview the costume
   on the sprite while editing it.
3. **Look and feel is a shrunk desktop, not a touch UI.** Block scale 0.55 makes block text and
   the toolbox hard to hit; several controls are 44px-patched one-by-one in CSS while others
   (workspace zoom/undo controls, flyout, sprite-info inputs, block context menus) were never
   audited; safe-area handling is inconsistent; desktop-only chrome is hidden with `display:none`
   instead of being re-homed, which silently deletes features (B-01, B-02).
4. **One confirmed command failure + several unreachable commands.** User clarification
   (2026-10-25): the block commands in general **work**; the confirmed failure is the paint
   editor's **Outline** colour dropdown (tap the ▾ arrow, tap a colour — it does not take
   effect), recorded as B-19. §4 is the full register: 19 items, each with evidence, a fix, and
   an acceptance test. Headlines: Outline dropdown broken in the costume editor (B-19);
   Tutorials/Debug/project-title are unreachable on phones; run/stop
   disappears on the Costumes/Sounds tabs and on the Sprites page; mic/camera-dependent commands
   (record sound, video sensing, face sensing) have no native permission bridge and are untested;
   internet-dependent extensions are offered in an offline-first app; the on-screen keyboard can
   flip the layout mode mid-edit and remount the Blockly workspace.

---

## 3. Goals, non-goals, principles

### Goals

- **G1 One-screen build→run→tweak on phones:** stage (sprite) and code (commands) co-visible;
  run/stop reachable from every editor surface; sprite switching without leaving Code.
- **G2 Tablet parity:** medium layout gets the same co-visibility with a collapsible sprite drawer;
  large tablets keep the desktop layout.
- **G3 Every command reachable and working on touch:** no feature exists only behind
  `display:none`; every item in the §7 command inventory passes on the device matrix.
- **G4 Touch-first look & feel:** ≥48dp targets, readable block text, consistent safe-area,
  no hover-dependent interactions, no precision drag required to insert a block (tap-to-add).
- **G5 Zero desktop/web regression:** all changes platform-gated; upstream tests keep passing.

### Non-goals

- No changes to `scratch-vm`, `scratch-render`, `scratch-paint`, or `scratch-blocks` behaviour.
- No new Scratch features (no new blocks, no cloud save, no account system — `canSave` stays false;
  save stays "Save to computer" → Android share sheet).
- No iOS port. No redesign of the desktop (`full`) layout.
- Bluetooth hardware extensions stay hidden (WebView has no Scratch Link); see B-10 for the rest.

### Principles

- **Never unmount the stage or the workspace.** Keep the current `visibility:hidden` technique;
  unmounting loses Blockly undo/scroll and forces renderer re-creation (render churn was already
  fixed once in `ca8e11c` — do not reintroduce it).
- **One state machine for layout.** Layout decisions currently live in three places that must be
  kept "in sync" by comments (`layout-constants.js`, CSS media queries, `use-layout-mode.js`).
  The redesign keeps the constants file as the single source and adds a test that fails when the
  CSS breakpoints drift (see T-06).
- **Fix at the narrowest layer** (`AGENTS.md`): GUI reachability bugs are fixed in the GUI, the
  permission bug in `MainActivity`, not by workarounds in the VM.

---

## 4. Bug register — "some commands are not working"

Severity: **P0** = command broken/unreachable, **P1** = command degraded or risky,
**P2** = polish/consistency. Every fix lands as its own commit with the failing test first.

| ID | Sev | Status | Command / area | Evidence (file) |
|---|---|---|---|---|
| B-01 | P0 | Phone AVD menu: Tutorials/Debug visible; browser tests pass | **Tutorials** and **Debug** buttons unreachable on phones | `menu-bar.jsx` wraps both in `styles.hideCompact`; `menu-bar.css` sets `.hide-compact{display:none}` at compact sizes |
| B-02 | P0 | Phone AVD menu entry visible; rename/keyboard not tested | **Project title rename** unreachable on phones (title field hidden) although Android explicitly enables it | `menu-bar.jsx` title field has `hideCompact`; `render-gui-android.jsx` passes `canEditTitle: true` |
| B-03 | P0 | Phone AVD: Sounds controls visible; Sprites-pane coverage open | **Green flag / Stop** missing on Costumes & Sounds tabs and on the Sprites page | `gui.jsx`: floating controls render only when `isCompact && blocksTabVisible`; sprites pane has no `Controls` at all |
| B-04 | P1 | Implemented; multi-sprite selection check open | **Selecting a sprite is a dead end**: no run controls and no route back to that sprite's code except manual nav | `containers/target-pane.jsx: handleSelectSprite` only calls `vm.setEditingTarget` |
| B-05 | P1 | Phone AVD stage preview visible in Sounds; Paint smoke done | **Costume/sound editing hides the sprite** (no live preview while painting/recording) | Costumes/Sounds are `TabPanel`s inside the code pane in `gui.jsx` |
| B-06 | P1 | Phone AVD Back closes Outline/fullscreen; menus/cards open | **Hardware Back** does not exit stage-fullscreen first, and does not close Blockly context menus, the flyout, or tutorial Cards | `render-gui-android.jsx: onBackButton` handles login menu → `requestCloseMenus()` → redux modals → closable alerts → exit only |
| B-07 | P1 | Unit + phone AVD sharesheet; SB3 archive/cache verified | **Save to computer may hand the share target a deleted file**: the cached `.sb3` is deleted in `finally` as soon as `Share.share()` resolves | `render-gui-android.jsx: shareBlob` |
| B-08 | P2 | Phone AVD exit confirmation; save-failure alert open | Save-failure and exit-confirm use native `alert()`/`confirm()` with **hard-coded English**, bypassing the GUI alert system and `react-intl` (violates the scratch-gui i18n rule in `AGENTS.md`) | `render-gui-android.jsx` (`alert(`, `confirm('You have unsaved changes…')`) |
| B-09 | P1 | Phone AVD valid SB3 picker/import; wrong-type case open | **Load from computer / sprite & costume upload**: `accept` is widened to `*/*` on Android, so any file can be picked; wrong-type selections must fail with a visible error, not a silent no-op | `lib/file-accept.js`, `lib/sb-file-uploader-hoc.jsx`, `components/action-menu/action-menu.jsx` |
| B-10 | P0 | Unit + phone AVD offline extension library/badges checked | **Extension commands offered that cannot work offline**: only `bluetoothRequired` extensions are filtered; `text2speech` and `translate` (`internetConnectionRequired: true`) are offered in an offline-first app and fail without network; `videoSensing`/`faceSensing` depend on B-11 | `containers/extension-library.jsx`; `lib/libraries/extensions/index.jsx` |
| B-11 | P0 | Phone AVD mic record/save + camera grant; physical capture open | **Microphone & camera commands**: sound recording (`lib/audio/audio-recorder.js`), video sensing and face sensing (`lib/video/camera.js`) call `getUserMedia`. `MainActivity` is an empty `BridgeActivity`; Capacitor's `BridgeWebChromeClient` handles WebView permission requests against the declared Android permissions. Phone AVD exercised the permission prompt, sound recording/save, and video permission; physical capture remains unverified | `scratchy-android/.../MainActivity.java`, Capacitor `BridgeWebChromeClient`, `AndroidManifest.xml` |
| B-12 | P1 | Phone/tablet rotation smoke; workspace state retention open | **Workspace remount on layout-mode change**: rotating the phone, or anything crossing the 767px/500px thresholds, changes `blocksLayoutMode`, which is part of the `Blocks` React `key` — Blockly is re-injected, losing undo history, scroll, and zoom mid-session | `gui.jsx` (`key={blocksId/colorMode/theme/blocksLayoutMode}`), `lib/use-layout-mode.js` |
| B-13 | P1 | Phone AVD tap/drag pass; wide-block cases open | **Flyout monkey-patch**: after inject, `blocks.jsx` replaces `flyout.getFlyoutScale`/`flyout.getWidth` (190px). Blocks wider than 190px may clip, and drag-from-flyout offsets/scrolling may misbehave at 0.55 scale | `containers/blocks.jsx` (post-inject override + `workspace.resize()`) |
| B-14 | P1 | Open; touch long-press unverified | **Block context menu (Duplicate / Delete / Help / Add Comment) and long-press on touch**: global `-webkit-touch-callout: none` + `touch-action: none` on the workspace may suppress the long-press path; scratch-blocks upstream lists multitouch as a known gap (Context7) | `playground/android.css`, `components/blocks/blocks.css` |
| B-15 | P2 | Phone AVD fullscreen + Back verified | **Stage fullscreen on phones**: the stage-size toggle is hidden on compact but the fullscreen button is not; fullscreen stage + bottom nav (z-index = menu bar) may overlap or trap the user | `stage-header.css` (toggle hidden), `mobile-nav.css` (`z-index: $z-index-menu-bar`), `gui.jsx` (nav rendered unconditionally) |
| B-16 | P0 | Unit-tested; device keyboard case open | **On-screen keyboard flips layout mode mid-edit**: compact triggers at `max-height: 500px`; opening the keyboard (rename sprite, answer an "ask" block, edit a block text field) shrinks viewport height, so a medium/landscape device can drop into compact — and via B-12 remount the workspace — while typing | `lib/layout-constants.js` (`compactMaxHeight: 500`), `lib/use-layout-mode.js` (listens to `resize`) |
| B-17 | P2 | AVD WebView 145 safe-area smoke; legacy WebView open | **Safe-area inconsistency**: only `modal.css` uses Capacitor's `--safe-area-inset-*` fallback (needed on Android WebView < 140, per Context7); `gui.css`, `menu-bar.css`, `mobile-nav.css` use `env()` alone, so chrome can slide under the status bar/cutout on older WebViews | grep `safe-area-inset` across `src/components/**` |
| B-18 | P2 | Automated + phone/tablet AVD smoke; physical gaps remain | **No automated coverage for the mobile shell**: no tests reference `MobileNav`, the compact/medium GUI layout, the back handler, or `shareBlob`; only `screen-utils`, `close-menus`, `download-blob`, `legacy-storage` utils are tested | `packages/scratch-gui/test/unit/**` |

### Fixes (one per ID; implement in Phase 1, §6)

- **B-01/B-02** — Stop deleting features with CSS. On compact, move Tutorials, Debug, and the
  project-title field into a single **overflow (⋯) menu** in the menu bar (reuse `MenuBarMenu` /
  `useMenuNavigation` from the existing Settings/File/Edit menus). Title becomes a menu item that
  opens the existing title input in a modal-style prompt (reuse `containers/prompt.jsx` patterns).
  Remove the three `hideCompact` usages; keep `hideCompact` only for genuinely web-only items
  (Share/Community/account, which are already inert with `canSave:false, enableCommunity:false`).
- **B-03** — Render one `Controls` (green flag + stop) instance in the **stage strip** (§5), visible
  in Code, Costumes, Sounds, and Sprites contexts. Delete the code-pane-only floating pill.
- **B-04** — In the unified layout the sprite rail lives on the Code screen (§5.2), so selecting a
  sprite updates the workspace in place. On the (tablet) sprite drawer, selecting a sprite also
  closes the drawer. No change to `TargetPane` selection semantics.
- **B-05** — The stage strip (§5) stays visible above the Costumes/Sounds tabs too, so the selected
  sprite is always previewable; add "view on stage" parity by keeping the same strip mounted.
- **B-06** — Extend `onBackButton` priority chain: (1) Blockly context menu / flyout open → close;
  (2) stage fullscreen → exit fullscreen (`stageSize` redux state); (3) tutorial Cards visible →
  close; (4) existing menu → modal → alert chain; (5) exit confirm. Each new step gets a unit test
  alongside `test/unit/util/close-menus.test.js`.
- **B-07** — Do not delete the cache file in `finally`. Write to a timestamped cache filename and
  clean up files older than 24h on app start (Filesystem `readdir` + `deleteFile`). Unit-test the
  lifecycle in the existing `download-blob` test style.
- **B-08** — Route save failures through the GUI alert system (`showStandardAlert` / alerts reducer,
  as `sb-file-uploader-hoc` already does) and the exit confirm through a GUI confirmation modal;
  all strings via `react-intl` `defineMessages`, then run `npm run i18n:src` in `scratch-gui`.
- **B-09** — Keep the widened `accept` (WebViews filter everything otherwise) but validate after
  selection: project upload must end in `.sb/.sb2/.sb3`, sprite/costume/sound uploads must match
  their existing uploader type checks in `lib/file-uploader.js`; failures show the standard
  "couldn't load" alert. Add unit tests for the validation branch.
- **B-10** — Filter the Android extension library by capability, not just Bluetooth: hide
  `bluetoothRequired` (unchanged) and, when the device is offline (`navigator.onLine` +
  Capacitor Network status if added — otherwise `navigator.onLine` only, no new dependency),
  mark `internetConnectionRequired` extensions with a "needs internet" badge instead of hiding
  them (they work on Wi-Fi). Hardware extensions that need Scratch Link peripherals
  (`microbit`, `ev3`, `boost`, `wedo2`, `gdxfor` — all already `bluetoothRequired`) stay hidden.
- **B-11** — In `MainActivity.java`, install a `WebChromeClient` (via Capacitor's bridge
  `setWebChromeClient` path or a `BridgeActivity` plugin) whose `onPermissionRequest` grants
  `RESOURCE_AUDIO_CAPTURE`/`RESOURCE_VIDEO_CAPTURE` only after the corresponding Android runtime
  permission is granted, requesting it on demand. In the GUI, surface `getUserMedia` rejection
  from `audio-recorder.js`/`camera.js` as a standard alert ("Microphone/Camera permission is
  needed…") instead of an unhandled promise rejection. Acceptance = device-matrix rows for
  Record Sound, Video Sensing, Face Sensing in §7.
- **B-12** — Remove `blocksLayoutMode` from the `Blocks` `key`. Apply scale/flyout changes to the
  live workspace (`workspace.setScale` equivalent via Blockly zoom APIs + flyout re-layout) or,
  if a re-inject is unavoidable, snapshot and restore workspace XML + undo stack around it
  (VM already owns block state; verify undo explicitly in the §7 matrix). Rotation must not lose
  an in-progress drag.
- **B-13** — Replace the post-inject monkey-patch with supported configuration where possible
  (flyout width via workspace options at inject), and add a Playwright/emulator check that the
  widest block in each category is fully visible and draggable from the flyout at compact scale.
  If clipping is confirmed, raise compact flyout width to the widest category block and let the
  workspace keep the remaining width (floor: workspace ≥ 45% of screen width).
- **B-14** — Device-test long-press (≥500ms) on a block: context menu must open. If suppressed,
  the fix is in order of preference: (a) scratch-blocks gesture config at inject in
  `containers/blocks.jsx`; (b) scope `-webkit-touch-callout:none` to chrome elements only,
  excluding `.blocklySvg`. Also verify block field dropdowns, colour/angle pickers, and the
  variable rename prompt on touch; all are part of the §7 inventory.
- **B-15** — Hide `MobileNav` while `isFullScreen`, and make Back exit fullscreen (B-06). Verify
  the fullscreen stage does not render under the nav on the device matrix.
- **B-16** — Layout mode must be stable while a text input is focused: in `use-layout-mode.js`,
  ignore height-only resizes when `document.activeElement` is an input/textarea/contenteditable
  (the Blockly field editor included), and add hysteresis — a mode change requires the new mode
  to persist for two consecutive resize frames or an `orientationchange`. Add unit tests with a
  mocked `matchMedia`/`window.innerHeight` sequence simulating keyboard open/close.
- **B-17** — Introduce one CSS helper: define `--sa-top/right/bottom/left` once on
  `:global(.scratchy-android)` as `max(env(safe-area-inset-*), var(--safe-area-inset-*))`
  (the pattern already proven in `modal.css`) and replace raw `env()` uses in `gui.css`,
  `menu-bar.css`, `mobile-nav.css`. Per Context7, this is the supported fallback for
  Android WebView < 140.
- **B-18** — Covered by the test tasks T-05/T-06 in §6.

---

## 5. Target UX design

### 5.1 Design tokens & touch rules (all layouts)

| Token | Value | Notes |
|---|---|---|
| Minimum touch target | **48×48dp** (44px absolute floor, matching existing patches) | Applies to nav, menu items, stage controls, sprite cards, action-menu buttons, workspace zoom controls |
| Compact block scale | Raise floor from 0.55 → **0.65** default; user zoom persists per session | Block text must stay ≥ 11px effective; flyout width = widest block in category (B-13) |
| Spacing scale | 4 / 8 / 12 / 16 / 24px (existing `$space` multiples) | No new spacing system |
| Safe area | `--sa-*` variables (B-17) on menu bar, bottom nav, modals, stage strip | Both portrait & landscape cutouts |
| Colour/typography | Unchanged Scratch palette + existing colour modes (default/high-contrast) and themes | Do not fork colours; high-contrast mode must be re-checked at new sizes (§7) |
| Motion | 150–200ms ease-out for strip expand/collapse and drawer; respect `prefers-reduced-motion` | No layout animation that resizes Blockly more than once per gesture (B-12) |
| Feedback | Every tappable element gets a pressed state; long-press (500ms) = context menu everywhere (B-14) | No hover-only affordances |

### 5.2 Phone portrait (compact) — the core fix: one "Create" screen

Replace the three exclusive panes (Code / Stage / Sprites) with **one Create screen**:

a persistent, collapsible **stage strip** on top (sprite always visible, run controls always
present) and the editor below it. The bottom nav shrinks from 3 destinations to 2
(**Create** / **Sprites**) — Sprites becomes a full-screen picker for managing many sprites,
while day-to-day sprite switching happens in the strip's sprite rail.

```
┌───────────────────────────────────┐
│ ☰ Scratchy   ⋯ (title/tutorials)  │  menu bar (44px + --sa-top)
├───────────────────────────────────┤
│ ┌─────────────────┐  ▶  ■  ⛶     │  STAGE STRIP (collapsed: 132px tall)
│ │   stage canvas  │  Sprite1 ▾   │  • canvas keeps 4:3, letterboxed
│ │   (sprite runs) │  x 0  y 0    │  • ▶/■ = Controls (always here)
│ └─────────────────┘  [Sprites ›] │  • sprite chip = switch target
├───────────────────────────────────┤
│ Code │ Costumes │ Sounds          │  existing react-tabs, unchanged
│ ┌──┬───────────────────────────┐  │
│ │▓▓│  workspace (blocks)       │  │  palette rail + workspace
│ │▓▓│                           │  │  (flyout per B-13)
│ └──┴───────────────────────────┘  │
├───────────────────────────────────┤
│   〈/〉 Create      ▦ Sprites     │  bottom nav (56px + --sa-bottom)
└───────────────────────────────────┘
```

- **Collapsed strip (default while coding):** 132px tall. Canvas left (4:3, ~160×120 max),
  right column = green flag, stop, fullscreen (expand) buttons (48dp each), current-sprite chip
  (thumbnail + name, tap = open sprite rail popover to switch target without leaving Create),
  and a compact x/y readout. Tapping the canvas or ⛶ expands the strip.
- **Expanded strip (Run mode):** strip grows to ≤ 55% of viewport height, canvas centred at the
  `getCompactStageScale` fit, workspace below shrinks but **stays mounted and visible** — you can
  tap a block stack to run it and watch the sprite, or drag a value and see the effect live.
  A chevron collapses back. Green-flag overlay, ask-and-wait question UI, monitors, and video
  sensing all render inside the canvas as they do today (`components/stage/stage.jsx`).
- **Sprite rail popover:** horizontal scrolling strip of sprite thumbnails + Stage (backdrop)
  chip + "＋" (opens the existing sprite library / paint / surprise / upload actions from
  `TargetPane`). Selecting one calls the existing `vm.setEditingTarget` path (B-04) and the
  workspace swaps scripts in place. Full sprite *management* (rename, x/y/size/direction,
  duplicate, export, delete) stays in the Sprites destination (existing `TargetPane` +
  `SpriteInfo`), now reachable but no longer required for basic switching.
- **Costumes/Sounds tabs:** the strip remains above them (B-05), so painting a costume previews
  on the sprite live. Paint editor keeps its current phone CSS (scrollable toolbar strip).
- **Blocks insertion without precision drag:** keep drag-from-flyout, and add **tap-to-add**:
  tapping a block in the flyout inserts it into the workspace (below the selected stack, or at
  workspace centre if none) using the existing Blockly flyout→workspace creation APIs. This is
  the single biggest usability win for small screens and directly addresses scratch-blocks'
  multitouch gap noted in Context7. (Implementation spike first — see T-03.)

State changes are minimal: `mobilePane` (`code|stage|sprites`) in `gui.jsx` becomes
`mobileView` (`create|sprites`) plus `stageStripExpanded: boolean`. The stage is no longer a
pane; `paneClass(MOBILE_PANES.stage)` and the `display:contents` stage-and-target wrapper go
away on compact. The stage, workspace, and target pane **never unmount** (§3 principles).

### 5.3 Phone landscape (compact by height ≤ 500px)

Side-by-side: stage strip becomes a **right column** (40% width, canvas + controls + sprite chip
stacked), editor takes the left 60%. Same components, `flex-direction: row` at the compact
landscape media query. This also fixes today's landscape behaviour where a short viewport gets a
full-screen stage page with a tiny scaled canvas (`getCompactStageScale` height clamp 0.25).

```
┌──────────────────────────┬────────────────┐
│ Code│Costumes│Sounds     │  stage canvas  │
│ ┌──┬───────────────────┐ │  ▶  ■  ⛶      │
│ │▓▓│ workspace         │ │  Sprite1 ▾     │
│ └──┴───────────────────┘ │  x 0   y 0     │
├──────────────────────────┴────────────────┤
│        〈/〉 Create      ▦ Sprites          │
└───────────────────────────────────────────┘
```

### 5.4 Tablet (medium, 768–1095px)

Keep the two-column desktop-derived layout, with three changes:

1. **Sprite drawer:** `TargetPane` becomes a collapsible right-hand drawer under the stage
   (toggle in the stage header, 48dp). Collapsed = a 56px rail showing the current sprite +
   backdrop chips (tap to switch, long-press/chevron to expand). This gives medium the same
   co-visibility win: stage + sprite switching + code on one screen at 768px, where today the
   forced small stage + full target pane crowds out the workspace (`resolveStageSize` small-stage
   rule below 900px stays, but the drawer collapse returns the width to the editor).
2. **Run controls in the stage header stay** (they already exist there via `StageHeader` →
   `Controls`); remove nothing. Bottom nav is **not** shown on medium (unchanged).
3. Stage size toggle remains available (it is only hidden on compact today — keep that).

### 5.5 Large tablet / foldables (≥1096px, `full`)

Unchanged upstream layout. The redesign must not touch it; it is the regression baseline in §7.

### 5.6 Look & feel polish (compact + medium)

- **Menu bar:** logo + Settings + File + Edit + ⋯ overflow (B-01/B-02). All items ≥48px tall;
  dropdown menus full-width-ish sheets anchored under the bar (existing `modal.css` phone rules
  are the pattern), 48px rows, scrim tap-to-dismiss (already handled by `containers/menu.jsx`
  pointer-up outside-tap + `close-menus.js`).
- **Bottom nav:** 2 items on compact (Create / Sprites), active item = filled icon + label +
  top border indicator (existing `.active` style), `aria-current="page"` (already present).
- **Cards/sheets:** libraries (sprite/costume/sound/backdrop/extension) keep the existing
  full-screen phone modal treatment; grid goes 2-up < 560px, 3-up ≥ 560px (existing
  `library-item.css` rules), filter strip stays one scrollable line.
- **Typography:** no size below 12px on chrome; block text governed by block scale (§5.1).
- **Empty/loading states:** unchanged (Loader, alerts) — but all new strings via `react-intl`.

---

## 6. Implementation plan (phased, file-level)

Order matters: **Phase 0 → 1 (bugs) → 2 (phone layout) → 3 (tablet) → 4 (polish) → 5 (gate)**.
Each task is one PR-sized commit series; Conventional Commits (`feat:`, `fix:`) per repo rules.

### Phase 0 — Reproduction harness (no user-visible change)

- **T-01 Device/emulator matrix runner.** Document + script the manual matrix in §7: Android 17
  phone emulator (Pixel-class, 390×844), phone landscape, 10" tablet emulator (800×1280 and
  1280×800). Physical device deferred per §10.2 — not in the current matrix. Record WebView version per device (B-17 depends
  on it). Existing build: `npm run build -w scratchy-android` then `npm run apk -w
  scratchy-android` (Node 24, JDK 21, SDK 36 per `README.md`).
- **T-02 Command inventory baseline.** Walk the §7 inventory on the *current* build; mark each
  row Pass / Fail / Unreachable with a screen recording for failures. This converts "some
  commands are not working" into the definitive failing list and may add rows to §4 (append,
  don't renumber). Failing rows that can be expressed as unit tests get them now (red), per
  `AGENTS.md` rule 5.

### Phase 1 — Fix broken commands (§4), independent of the redesign

- **T-10 Menu reachability (B-01, B-02, B-08).** Files: `components/menu-bar/menu-bar.jsx`,
  `components/menu-bar/menu-bar.css`, new overflow menu component next to `file-menu.jsx` /
  `edit-menu.jsx` (reuse `MenuBarMenu`, `useMenuNavigation`, `closeAfter` pattern already in
  those files), `playground/render-gui-android.jsx` (remove `alert`/`confirm`, dispatch GUI
  alerts), `reducers/alerts` usage only — no reducer changes. Strings via `defineMessages`;
  run `npm run i18n:src --workspace=packages/scratch-gui`.
- **T-11 Run controls everywhere (B-03).** Files: `components/gui/gui.jsx` (remove
  `.floatingControls` pill), `components/controls/` (reuse as-is). Interim fix ahead of Phase 2:
  render the pill whenever `isCompact` regardless of active tab, and add `Controls` to the
  sprites pane header. (Phase 2 supersedes placement; keep this task small.)
- **T-12 Back-button chain (B-06, B-15).** Files: `playground/render-gui-android.jsx`,
  `lib/close-menus.js` (+ a sibling helper for Blockly context-menu/flyout state if needed),
  unit tests in `test/unit/util/` beside `close-menus.test.js`. Hide `MobileNav` when
  `isFullScreen` in `gui.jsx`.
- **T-13 Save/load robustness (B-07, B-09).** Files: `playground/render-gui-android.jsx`
  (timestamped cache files + 24h cleanup on start), `lib/file-accept.js`,
  `lib/sb-file-uploader-hoc.jsx`, `lib/file-uploader.js` (post-selection validation + standard
  alerts), tests beside `test/unit/util/download-blob.test.js` and
  `test/unit/util/sb-file-uploader-hoc.test.jsx`.
- **T-14 Extension capability filter (B-10).** Files: `containers/extension-library.jsx`,
  `lib/libraries/extensions/index.jsx` (no data changes — read existing
  `internetConnectionRequired`/`bluetoothRequired` flags), offline badge via existing
  library-item badge patterns. Unit test the filter function.
- **T-15 Mic/camera permission bridge (B-11).** Files:
  `scratchy-android/android/app/src/main/java/com/soubarnak/scratchyscratchy/MainActivity.java`
  (WebChromeClient `onPermissionRequest` + runtime permission request),
  `packages/scratch-gui/src/lib/audio/audio-recorder.js` and `src/lib/video/camera.js`
  (rejection → standard alert; do **not** change VM-facing APIs). Device-verify Record Sound,
  Video Sensing, Face Sensing (§7 rows).
- **T-16 Layout stability (B-12, B-16).** Files: `lib/use-layout-mode.js` (focus guard +
  hysteresis + unit tests with mocked `matchMedia`), `components/gui/gui.jsx` (remove
  `blocksLayoutMode` from `Blocks` key; apply scale via live workspace where possible),
  `containers/blocks.jsx` (flyout width/scale as inject-time options instead of post-inject
  monkey-patch, B-13). Acceptance: rotation + keyboard open/close preserve undo, scroll, zoom.
- **T-17 Touch gestures audit (B-14).** Device-first: long-press context menu, field dropdowns,
  colour/angle pickers, drag sprite on stage, pinch-zoom workspace. Fix in
  `containers/blocks.jsx` inject config or scope the `touch-callout` CSS in
  `playground/android.css`. Record outcome per §7 row even if "works as-is".
- **T-18 Safe-area unification (B-17).** Files: `components/gui/gui.css`,
  `components/menu-bar/menu-bar.css`, `components/mobile-nav/mobile-nav.css`,
  `components/modal/modal.css` (adopt its proven pattern as the source). Add the `--sa-*`
  definitions under `:global(.scratchy-android)` in `playground/android.css`.

### Phase 2 — Phone unified Create screen (§5.2, §5.3)

> **Progress (2026-10-25):** Create/Sprites navigation, a persistent stage pane, and compact/tablet/
> landscape switching are implemented; tap-to-add insertion and drag both have Playwright coverage.
> T-20/T-21 remain partial: the strip is 230px with an always-visible all-sprite rail, not the accepted
> 132px layout with a current-sprite chip and popover. T-23's insertion works, but its requested brief
> highlight feedback is not implemented. Finish these details before closing Phase 2.

- **T-20 Stage strip component.** New `components/stage-strip/stage-strip.jsx` + `.css`
  (presentational, per scratch-gui convention: components presentational, containers connect).
  Props: `stageSize`, `vm`, `expanded`, `onToggleExpanded`, `editingTarget` summary
  (name/thumbnail/x/y from existing target state). Internally renders the existing
  `StageWrapper` (which already brings `StageHeader` → `Controls`) in collapsed form —
  collapse hides the header chrome except `Controls` via CSS, canvas letterboxed.
  The strip is mounted **once**, above the tabs, in both collapsed and expanded states
  (height animated via CSS on the wrapper, canvas resized once per expand/collapse through
  the existing `stageScale`/`getCompactStageScale` path in `screen-utils.js`).
- **T-21 Sprite rail popover.** New `components/sprite-rail/` (thumbnail chips from existing
  `sprite-selector-item` rendering where reusable) wired through `containers/target-pane.jsx`
  handlers (`onSelectSprite`, `onNewSpriteClick`, library/paint/surprise/upload actions).
  No VM or reducer changes.
- **T-22 GUI restructure.** `components/gui/gui.jsx`: replace `MOBILE_PANES` state with
  `mobileView` (`create|sprites`) + `stageStripExpanded`; stage strip rendered outside the
  pane switch; `TargetPane` remains the Sprites view; delete `.mobile-pane-hidden` stage
  rules and the `display:contents` wrapper in `gui.css` for compact; landscape row layout
  via one media query. `components/mobile-nav/mobile-nav.jsx`: 2 items
  (`create`, `sprites`), same `MOBILE_PANES`-style export renamed to `MOBILE_VIEWS`
  (internal to the package — rename freely per `AGENTS.md`, update the one importer).
  New strings → `defineMessages` + `npm run i18n:src`.
- **T-23 Tap-to-add blocks (spike → implement).** Spike (timebox 1 day): confirm scratch-blocks
  flyout APIs can create a block in the main workspace programmatically on tap without a drag
  (`containers/blocks.jsx` owns the workspace ref). If yes: tap = insert + slight highlight
  animation; drag keeps working. If no: fallback is enlarging flyout hit areas only, and this
  task closes as documented limitation.
- **T-24 Costumes/Sounds strip parity (B-05).** Confirm strip stays mounted/visible across all
  three tabs (it does by construction in T-22); verify paint-editor canvas + strip coexist at
  360px width; adjust `asset-panel.css` phone rules only if the matrix shows overlap.

### Phase 2.5 — Outline function: mobile colour sheet & QoL (§12)

> **Progress (2026-10-25):** the sticky controls, compact Fill/Outline sheet, width controls, teaching
> states, recents, and same-as-fill hint are implemented. Browser tests cover picker stacking/color-state
> propagation, teaching states, width toggles, and recents; the full §12.5 checklist is still open.

Depends on T-19 (Outline works at desktop parity first). Design and rationale in §12.

- **T-25 Sticky Fill/Outline group.** On compact, pin the Fill + Outline + stroke-width group to
  the left edge of the paint toolbar (`position: sticky; left: 0` inside the existing scroll
  strip, solid background) so the colour controls can never scroll off-screen or be swallowed
  at the strip edge (kills H4 permanently). Files: `components/asset-panel/asset-panel.css` +
  hashed-class overrides only; no scratch-paint markup change.
- **T-26 Colour bottom sheet (compact only).** Replace the `react-popover` presentation for
  Fill/Outline on compact with a full-width bottom sheet: 48dp swatch grid, recent colours,
  Fill|Outline segmented switch inside the sheet, outline-width stepper + presets, explicit
  "No outline / Add outline" toggle, eyedropper, and an Advanced (HSL sliders) disclosure.
  Implementation preference order: (a) GUI-side wrapper that re-parents the existing
  `ColorPicker` container into a sheet on compact — no scratch-paint change; (b) if (a) proves
  impossible without forking rendering, a platform-gated presentation prop added to
  scratch-paint's `color-indicator.jsx` (upstream-safe default = popover). Live preview reuses
  the existing apply-on-change / commit-on-close semantics (`_hasChanged` → `onUpdateImage`
  on close in `containers/color-indicator.jsx`); Cancel = close without commit only if the
  spike shows the apply path is reversible via existing undo — otherwise sheet has Apply only
  and Cancel is dropped (never fake a revert).
- **T-27 Disabled-state teaching (H2).** When Outline is disabled (Brush/Text/Fill mode) or
  absent (bitmap), tapping it opens the sheet in an explanatory state: "Outline works on
  shapes" + one-tap "Switch to Select tool" (and for bitmap: "Convert to vector" using the
  existing format conversion path, labelled with its undoability). Files: GUI wrapper around
  the costume tab + existing mode dispatch; strings via `react-intl` in scratch-paint or GUI
  per where the hint renders — follow the host package's i18n flow.
- **T-29 Same-as-fill hint.** In the T-26 sheet, when the active outline colour equals the
  fill colour (both non-null, solid), show the "same as fill — outline won't show" inline
  note (§12.3). One comparison + one `react-intl` string; add it to the §12.5 checklist run.
- **T-28 Recents & last-used.** Persist last 12 used colours + last outline width per project
  in `localStorage` (existing `lib/local-storage.js` pattern in scratch-gui); show recents as
  the sheet's first row. No VM/storage-format change — never write these into the `.sb3`.

### Phase 3 — Tablet drawer (§5.4)

- **T-30 Collapsible target drawer.** `components/target-pane/` gets a `collapsed` presentation
  (rail mode) toggled from `containers/stage-header.jsx` (48dp button). Files:
  `components/gui/gui.css` (`.android-medium` rules), `components/target-pane/target-pane.jsx`,
  `containers/target-pane.jsx` (pass-through prop only). Medium block scale stays 0.8.
- **T-31 Medium regression pass.** Re-run §7 on tablet sizes incl. 768×1024 portrait (the
  tightest medium case) and the <900px small-stage rule in `screen-utils.test.js` (extend
  existing tests, don't rewrite).

### Phase 4 — Polish & accessibility

- **T-40** Pressed-state + focus-visible styles for nav/strip/drawer; `aria-current`,
  `aria-expanded` on strip toggle and drawer; focus moves predictably on view switch
  (existing `ModalFocusContext` patterns). Screen-reader pass (TalkBack) on Create screen.
- **T-41** `prefers-reduced-motion` guard for strip/drawer transitions; high-contrast colour
  mode screenshot pass at compact sizes.
- **T-42** i18n sweep: `npm run i18n:src`, no hard-coded English in any new JSX (existing
  offence fixed in T-10).

### Phase 5 — Verification gate (§7) & release readiness

- **T-50** Full §7 matrix green on the emulator set (§10.2). Physical-device pass is a pre-release gate, tracked in §9.
- **T-51** Repo gates: `npm run test:unit --workspace=packages/scratch-gui` (targeted),
  `npm run test:lint --workspace=packages/scratch-gui`, package build
  (`npm run build --workspace=packages/scratch-gui`), Android build
  (`npm run build -w scratchy-android` + `npm run apk -w scratchy-android`). Do **not** run the
  slow integration/smoke suites unless a failure points there (`AGENTS.md`).
- **T-52** Update `README.md` status line (device tested, recording/camera/extensions status)
  and this plan's §4 statuses. Conventional Commits throughout; `graphify-out/` stays out of
  git (it is currently untracked — add to `.gitignore` only if the user wants the graph kept).

> **Gate progress (2026-10-25):** T-51 local checks pass: scratch-gui unit (63 suites), scratch-paint
> unit (15 suites), GUI lint (0 errors), 12/12 Android Playwright tests, Android bundle rebuild, and the
> v0.2.0 release APK built with JDK 21 and the matching signer; it installs on both AVDs. T-52's
> README, §4 statuses, and evidence report are updated. T-50 is partially met: phone portrait/landscape and tablet
> landscape/portrait AVD smoke checks plus the browser matrix pass. Other §7 acceptance rows and the
> physical-device pre-release gate remain open.

---

## 7. Acceptance: command inventory & test matrix

Every row must pass on: **(a)** phone emulator portrait 390×844, **(b)** phone landscape
844×390, **(c)** tablet emulator 800×1280; **(d)** one physical phone — *deferred* (§10.2), required before public release, not for plan sign-off. Mark N/A with a reason
where a row is desktop-only.

### 7.1 Run & stage commands

Green flag · shift/turbo (via Edit menu on mobile) · stop · click a stack to run it ·
fullscreen enter/exit (+ Back exits it, B-15) · stage size toggle (tablet) · drag sprite on
stage · ask-and-wait answer with keyboard open (B-16) · monitors toggle · video sensing on/off
(B-11).

### 7.2 Block (command) palette — every category

Motion · Looks · Sound · Events · Control · Sensing · Operators · Variables (make/rename/
delete) · My Blocks (make a block, edit, custom procedure modal) · extension categories after
adding each offered extension (B-10). For each: drag block from flyout, tap-to-add (T-23),
snap/unsnap, long-press context menu (Duplicate/Delete/Help/Add Comment, B-14), field
dropdowns, text/number field edit with keyboard (B-16), colour & angle pickers, delete by
drag-to-flyout and by menu, undo/redo after rotation (B-12), pinch zoom + pan.

### 7.3 Sprite & stage commands

Select sprite from rail (B-04) and from Sprites view · add from library / paint / surprise /
upload (B-09) · rename · x/y/size/direction/rotation-style/show-hide in SpriteInfo ·
duplicate · export (share sheet, B-07 path) · delete + Edit → Restore · select Stage · add
backdrop (library/paint/upload) · backdrop count/name display.

### 7.4 Costume & sound commands

**Outline regression (B-19) — exact repro:** open a vector costume → select a shape → tap the
Outline ▾ arrow → tap a colour swatch → the shape's outline colour/width must change; repeat
with the Fill ▾ (control case — Fill and Outline share the same component, so Fill-pass +
Outline-fail vs both-fail discriminates the root cause) · Outline in Select/Line/Oval/Rect
modes vs Brush/Text/Fill modes (disabled-by-design check) · stroke-width control next to it ·
Paint editor tools (fill, brush, shapes, text, select/nudge with arrows replaced by drag) ·
add costume (library/paint/upload/camera if offered — B-11 decides) · sound record (B-11) ·
play/trim/effects (faster/slower/echo/reverse) · add sound (library/upload) · rename/delete
costume & sound. Stage strip preview visible throughout (B-05).

### 7.5 Menu & file commands

File → New (confirm-unsaved flow) · Load from computer (valid + invalid file, B-09) ·
Save to computer → share sheet → reopen the saved `.sb3` (B-07) · Edit → Restore, Turbo on/off ·
Settings → language change (incl. an RTL language), colour mode, theme · Tutorials open/close
(B-01) · Debug modal (B-01) · project title rename (B-02) · Android Back through every layer
(B-06) · logo button (currently `noop` on Android — confirm intentional, document it).

### 7.6 Shell commands

Rotate at every screen (no state loss, B-12/B-16) · keyboard open/close in every text field ·
split-screen / resized window crossing each breakpoint · app background/foreground mid-run ·
offline: libraries load, project runs, internet extensions badged (B-10) · low-memory:
background then return, workspace intact.

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Resizing the stage strip re-creates the WebGL renderer or loses drawn state | Strip never unmounts Stage; resize goes through existing `stageScale` path; verify pen trails & clones survive expand/collapse in §7.1 |
| Blockly workspace remount regressions (B-12) while removing the layout key | Snapshot/restore XML around any unavoidable re-inject; undo-after-rotation is an explicit §7.2 row |
| Tap-to-add (T-23) not supported cleanly by scratch-blocks 2.1.40 | Timeboxed spike with documented fallback; drag remains fully functional either way |
| Capacitor WebView version variance on physical devices (safe-area, `getUserMedia`) | B-17 fallback vars; B-11 explicit permission bridge; record WebView version in T-01 |
| Scope creep into desktop layout | Every CSS rule stays under `:global(.scratchy-android)` or `.android-*` classes; `full` layout is the §7 baseline |
| New strings break i18n extraction | `npm run i18n:src` is part of T-10/T-22 Definition of Done |

## 9. Definition of done (whole plan)

- [ ] §4 register: every P0/P1 fixed or explicitly closed with device evidence; statuses updated.
- [ ] §7 matrix green on (a)–(d); recordings/screenshots attached to the PR.
- [ ] Unit tests added for: back-button chain, layout-mode keyboard stability, extension filter,
      save-file lifecycle, upload validation (existing test folders, Jest).
- [ ] `npm run test:unit` + `test:lint` pass in `packages/scratch-gui`; Android APK builds.
- [ ] Desktop/web (`full` layout) spot-check unchanged; no VM/render/paint/blocks changes.
- [ ] §12.5 Outline sheet checklist green on compact (sheet, width presets, teaching state,
      recents, same-as-fill hint, eyedropper, one-undo commit); B-19 closed with selected-vector stroke
      application and undo verified.
- [ ] Accepted decisions (§10, §12) implemented as written; any deviation re-approved by user.
- [ ] `README.md` status section updated; no hard-coded English in new UI strings.

## 10. Open questions — resolved 2026-10-25

1. **Which commands fail?** ✅ Answered: the block commands work. The failing item is the paint
   editor **Outline** colour dropdown → new register item **B-19** (below the §4 table) with
   ranked root-cause hypotheses and an emulator repro protocol (task T-19). The user's report
   was cut off mid-sentence ("click on the dropdown arrow and click on the …"); assumed ending:
   "…colour and nothing happens." If the actual symptom differs (picker never opens, opens then
   instantly closes, colour applies but outline width stays 0), tell us — the repro in §7.4
   discriminates all three anyway.
2. **Physical device?** ✅ Answered: **emulator only, for now.** §7 rows (a)–(c) are the
   acceptance gate; row (d) physical phone is deferred and must be run before any public APK
   release — it stays on the §9 checklist as residual risk, not a Phase 0–5 blocker.
3. **Sprites destination after the sprite rail ships?** ✅ **Accepted decision: keep it.** The rail covers day-to-day sprite *switching*; the Sprites view remains
   the *management* surface (rename, x/y/size/direction numeric inputs, duplicate, export,
   delete, stage/backdrop). Removing it would force unproven long-press management UX and hide
   precise numeric inputs that are also the accessible path. Cost of keeping: one nav slot
   (nav stays 2 items: Create / Sprites). Revisit only after T-17 touch data shows management
   is genuinely used inside the rail.
4. **Logo button `noop` on Android?** ✅ Answered: **fine as-is.** No change; not part of B-01.

## 11. Bug B-19 — Paint editor Outline dropdown (confirmed by user)

**Symptom:** In the Costumes (paint) editor on Android, tapping the **Outline** colour button's
▾ arrow and tapping a colour does not change the selected shape's outline. Other commands work.
**Status:** Root cause reproduced and the Android-only z-index fix passes the 390×844 Playwright
regression. On `scratchy-phone`, the Outline sheet also opened and accepted a color tap on a selected
vector group: the Outline swatch changed to `#FFAB19`, and `Add outline` moved the displayed width
from 0 to 1 pt. Because the selection was a mixed-style group, this does not verify auto-width on a
single no-stroke path, the serialized SVG stroke, or one-step undo. See
`artifacts/android-emulator/TEST-REPORT.md`. The picker
was portaled to `document.body` with `z-index:auto`, so the paint canvas/editor layers painted over it and the screen hit-test landed on
`.paint-editor_top-align-row_*`, not `.Popover-body`. The fix adds an Android-only popover layer
at `$z-index-card`; the new Playwright test failed before and passes after. T-19 remains open for single-path SVG, auto-width, and undo checks listed below.

**Code path:** `StrokeColorIndicator` (`packages/scratch-paint/src/containers/stroke-color-indicator.jsx`,
label "Outline", `outline: true`) and Fill share `makeColorIndicator`
(`containers/color-indicator.jsx`) → `components/color-indicator.jsx` renders a `react-popover`
(`isOpen = state.scratchPaint.modals.strokeColor`, `preferPlace="below"`,
`onOuterAction = handleCloseColor`) around `components/color-button/color-button.jsx`
(swatch + ▾, whole button is the click target → `openStrokeColor()`). Colour taps call
`handleChangeColor` → `applyColorToSelection(...)`; for stroke it also forces stroke width
0→1 when leaving "no fill" (`containers/color-indicator.jsx`). The picker
(`components/color-picker/color-picker.jsx`) uses `onClick` swatches plus mouse-oriented
sliders (`components/forms/slider.jsx`).

**Diagnosis — H5 confirmed (root cause): the portal is behind the editor.** `react-popover`
defaults `appendTarget` to `document.body`, so the phone CSS `overflow:hidden` does **not** clip
the picker. However, its root `.Popover` is positioned with `z-index:auto`. On a touch-open at
390×844, the box existed in the DOM and reported `visibility:visible`, `opacity:1`, and bounds
`x=70..246, y=201..473`, but `document.elementFromPoint()` at its center returned the
underlying `.paint-editor_top-align-row_*`; a screenshot showed no picker. This explains why
tapping ▾ works but selecting a colour does not. **Fix applied:** Android-only
`:global(.scratchy-android) :global(.Popover) { z-index: $z-index-card; }` in
`packages/scratch-gui/src/components/gui/gui.css` (token 480: above paint layers, below alerts,
menu bar, and modals). Regression:
`packages/scratch-gui/test/playwright/android-outline.spec.js` was red before the CSS fix and
green after rebuilding `BUILD_TYPE=android`.

**Remaining checks (not the observed root cause):**

- **H2 — Disabled-by-design.** Outline is disabled in Brush, Text, and Fill modes
  (`stroke-color-indicator.jsx`) and absent for bitmap costumes. The accepted T-27 teaching
  state still explains this; emulator verification should use a vector costume in Select mode.
- **Colour-application check.** The phone AVD confirms the real Outline sheet accepts a color tap
  on a selected vector group, and `Add outline` changes the displayed width from 0 to 1 pt. A single
  no-stroke path, color-only auto-width, serialized SVG stroke change, and one-step undo remain open.
- The earlier clipping, `onOuterAction` race, and horizontal-scroll hypotheses are **not** the
  observed failure: the body is portaled outside the clipped toolbar, and the screen hit-test
  was landing on the canvas before the colour-picker element could receive a tap.

**Fix acceptance:** Android Playwright hit-test passes, and the phone AVD confirms the Outline sheet
opens, accepts a color tap, and applies `Add outline` from 0 to 1 pt on a selected vector group.
Remaining §7.4 acceptance: a single no-stroke path's SVG stroke and color-only auto-width; one-step
undo; gradient + swap; outside-tap dismissal without mutation; Fill parity; bitmap behavior per T-27.

**T-19 status:** the Android-layer stacking root cause and 390×844 hit-test regression are verified.
On the phone AVD, the selected mixed-style group accepted `#FFAB19`; the control swatch updated, and
`Add outline` changed the displayed width from 0 to 1 pt. The interaction does not prove a single
no-stroke SVG path changed, color-only auto-width, or one-step undo. T-19 remains open for those checks
plus gradients, swap, outside dismissal, and Fill parity. See
`artifacts/android-emulator/TEST-REPORT.md`.
---

## 12. The Outline function — included spec & mobile QoL innovation (accepted 2026-10-25)

> All eight recommendations in §12.3 (bottom sheet, unified Fill|Outline sheet, width-with-
> colour, sticky colour group, teaching disabled state, recents, Advanced disclosure,
> same-as-fill hint) are **accepted scope**, scheduled as Phase 2.5 (T-25…T-29). They are
> written below as requirements, not options.

### 12.1 What the Outline function is (current, upstream behaviour to preserve)

In the vector costume editor, every shape has a **fill** (inside) and an **outline** (stroke:
the border line drawn around the shape). The Outline control
(`packages/scratch-paint/src/containers/stroke-color-indicator.jsx`, label "Outline") sets:

- **Outline colour** — solid colour or gradient (horizontal / vertical / radial, two colour
  stops with a swap button), including "no fill" (transparent = no outline). Picking a real
  colour when the outline was transparent automatically sets outline width to 1 so the result
  is visible; picking "no fill" sets width to 0 (`containers/color-indicator.jsx`).
- **Outline width** — the adjacent stroke-width control (points). Colour and width together
  are the whole function; one without the other is invisible.
- **Eyedropper** — pick a colour from the canvas (suspended while eyedropping: the picker
  refuses to close, `handleCloseColor`).
- Changes apply live to the selection but only commit to the costume (single undo step) when
  the picker closes (`componentWillReceiveProps` → `onUpdateImage`).
- Available only for **vector** costumes and only in Select / Reshape / Line / Oval / Rect
  modes; disabled in Brush / Text / Fill modes, absent in bitmap mode. This availability rule
  is upstream design and is **kept** — the innovation is making it visible and reachable, not
  changing what it means.

Desktop parity for all of the above is the T-19 exit criterion. Everything below is additive
mobile QoL on top of a working function.

### 12.2 Problems with Outline on mobile today (beyond the B-19 breakage)

1. It lives in a horizontally scrolling toolbar strip — it can be off-screen, half-visible,
   or have its tap eaten by the strip's scroll gesture (H4).
2. Its picker is a small desktop popover anchored "below" a button in a clipped strip (H1/H3):
   small swatches, mouse-sized HSL sliders, no room for the width control next to the colour.
3. Colour and width are two separate controls in two separate places, but the user thinks in
   one thought: "give it a thick black border." Two popovers = two chances to get lost.
4. When it's disabled (brush/bitmap), it looks identical to when it's broken (B-19/H2) — the
   single most confusing failure mode this feature has.
5. No memory: re-finding the exact costume colour you used 10 seconds ago means re-mixing HSL.

### 12.3 Target design — one Colour sheet for Fill + Outline (compact; medium optional)

```
        tap Outline ▾ (sticky, always visible)
                    │
   ┌────────────────▼─────────────────┐
   │  Colour            [Fill|Outline]│  segmented switch, 48dp
   │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │  recent colours (T-28)
   │  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘  │
   │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │  palette grid, 48dp swatches
   │  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘  │
   │  Outline width  [−]  2pt  [+]    │  stepper + live preview chip
   │  ( None )( Thin )( Med )(Thick) │  width presets: 0 / 1 / 2 / 4pt
   │  [ No outline ]      [ 🎨 drop ] │  explicit off + eyedropper
   │  ▸ Advanced (hue / sat / bright) │  existing sliders, 44dp handles
   │            [      Apply       ]  │  full-width, commits + closes
   └──────────────────────────────────┘
     shape on canvas updates live behind the sheet
```

- **Bottom sheet, not popover** (T-26): full-width, anchored to the bottom, canvas visible in
  the top ~45% so the selected shape previews live while picking — the paint-editor version of
  the §5 stage strip idea. Sheet drag handle to dismiss = same as Apply-cancel semantics
  decided in T-26 (no fake revert).
- **Fill and Outline in one sheet** with a segmented switch: one place for "colour", mirroring
  how every mobile drawing app (and desktop Figma) presents it. The existing gradient type
  row, second-stop swatch, and swap button move inside unchanged (they're already touch-
  tolerable at 48dp); "Advanced" hides the three HSL sliders behind a disclosure so the
  common path (tap a swatch, tap Apply) is two taps.
- **Width travels with colour**: stepper (− value +) with 48dp buttons, preset chips
  None/Thin/Med/Thick (0/1/2/4pt), and a preview chip that renders a box with the actual
  current outline so "2pt" is seen, not imagined. Selecting a colour from "No outline" still
  auto-sets width 1 (existing behaviour), and the stepper immediately reflects it.
- **Sticky colour group** (T-25): Fill/Outline/width controls pin to the toolbar's left edge;
  tools scroll *under* them. The two most-used costume controls can never scroll away.
- **Teaching disabled state** (T-27): disabled Outline opens the sheet in explain mode —
  "Outline borders a shape. You're painting with the Brush, which has no outline." +
  [Switch to Select tool]. Bitmap costume: "…this costume is a picture (bitmap)." +
  [Convert to vector]. A dead button always says why and offers the one-tap way out.
- **Recents** (T-28): last 12 colours used anywhere in the costume editor + last outline
  width, first row of the sheet, persisted in `localStorage` (not in the project file).
- **Same-as-fill warning (accepted, T-29):** if the chosen outline equals the fill colour,
  show a subtle "same as fill — outline won't show" note inside the sheet. Small, but in
  scope: it prevents the one invisible-outline case that auto-width (colour-from-none → 1pt)
  cannot rescue.

### 12.4 Tablet (medium) behaviour

Keep the popover (there's room and it isn't clipped at ≥768px), but adopt two sheet ideas that
cost nothing: width presets next to the width control, and the recents row in the popover.
If medium device testing (§7) shows popover taps are still fiddly, promote the sheet to
medium too — one presentation, fewer code paths. Decide from T-31 evidence, not preference.

### 12.5 Acceptance additions (extend §7.4)

- [x] Outline ▾ remains reachable at 360px and 390px in the Playwright compact toolbar test (T-25);
      physical-device reachability remains unverified.
- [ ] Sheet: tap swatch → shape outline previews live → Apply commits as **one** undo step;
      undo once fully reverts colour+width together.
- [ ] Width stepper/presets update the preview chip and the shape; None = width 0 + "no fill".
- [ ] Fill|Outline switch inside the sheet preserves each side's colour/gradient/width.
- [x] The sheet warns when a chosen outline matches the fill (T-29; Playwright).
- [x] Brush mode → tap Outline → explanation + Switch-to-Select works and lands in Select mode (Playwright).
- [x] Bitmap costume → explanation + Convert-to-vector path works (Playwright).
- [x] Recents shows the selected colour after closing/reopening the sheet (Playwright); costume-editor
      teardown/reopen persistence still needs the full checklist run.
- [ ] Eyedropper from the sheet picks a canvas colour into the active (Fill/Outline) side.
- [ ] Desktop/web paint editor pixel-unchanged (upstream popover, no sheet) — regression row.
   the rail + long-press "manage" enough? (Plan keeps it; removing it is a one-line nav change.)
4. Is the logo button's Android `noop` intentional (branding only)? If it should open an
   About screen, that is a new task, not part of B-01.
