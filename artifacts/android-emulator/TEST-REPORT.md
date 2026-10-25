# Scratchy-Scratchy Android emulator validation

**Run date:** 2026-10-25
**Result:** the v0.2.0 signed release APK was built, installed in place, and launch-verified on phone and tablet AVDs. Full interaction smoke tests were run on the matching-signed debug build from the same source. No physical device was tested.

## Signing and installation evidence

- Installed package: `com.soubarnak.scratchyscratchy`, version `0.2.0` (versionCode `3`, target SDK `36`).
- The pre-existing package, v0.2.0 release APK, and installed release package share certificate SHA-256 `57a00d9c454c099e0bbba6f94e885ce14ea675dc003fc845fe8b5ef628f9a596` (DN `CN=Scratchy-Scratchy, O=soubarnak`, RSA 4096-bit).
- Release APK: `packages/scratchy-android/android/app/build/outputs/apk/release/app-release.apk`; SHA-256 `85b087fba4e094f3a8035cf6465b8f7cf0fa324e7fb0e2d15c4f747be9718d05`. `apksigner` verifies it with the matching certificate; `unzip -tq` reports no archive errors.
- The earlier full interaction run used matching-signed debug APK SHA-256 `08fd95c5e35e471436772519b56b45af78454f8efd87ef885e45572e224578a0` from the same source before the version bump.
- `adb install -r .../app-release.apk` returned **Success** on `emulator-5554` (`scratchy-phone`) and `emulator-5556` (`scratchy-tablet`). Neither package was uninstalled or data-cleared. Both now report versionCode `3` / versionName `0.2.0`; release-variant launch captures are `55-phone-v0.2.0-release.png` and `56-tablet-v0.2.0-release.png`.
- The phone file-picker test loaded `packages/scratch-vm/test/fixtures/default.sb3`; the final active project on both AVDs is the Scratch cat starter. Package data was not wiped, but the active project state may differ from what was present before testing.
- The stock debug signer (`71ea…`) did not match the pre-existing package (`57a…`). `packages/scratchy-android/android/app/build.gradle` now keeps normal debug signing unchanged and supports an explicit local `SCRATCHY_DEBUG_USE_RELEASE_KEY=1` opt-in using the existing `SCRATCHY_KEYSTORE` environment inputs. No keystore/password is stored in the repository or this report. This matching-signed debug APK is for local AVD testing only; do not distribute it.

## Emulator environment

| AVD | Serial | Android / API | Physical display | Density | WebView | Tested CSS viewport |
|---|---|---|---|---:|---|---|
| `scratchy-phone` | `emulator-5554` | Android 17 / 37 | 1080×2400 | 420 dpi | 145.0.7632.218 | 411×914 portrait; 914×411 landscape |
| `scratchy-tablet` | `emulator-5556` | Android 17 / 37 | 2560×1600 | 320 dpi | 145.0.7632.218 | 1280×800 landscape; 800×1280 portrait |

On the matching-signed debug AVD test build, the WebView measured 411×914 CSS px at DPR 2.625. The `Editor sections` navigation measured y=834.29, height=80, bottom=914.29, so it fits the viewport without being clipped; the v0.2.0 release screenshot confirms the same phone layout. Both camera and microphone runtime permissions were denied on both AVDs at the end of testing; the temporary restore `.sb3` and generated share-cache file were removed.

## Build and automated checks

- `npm run build --workspace=packages/scratchy-android` — **passed**; Android GUI bundle rebuilt, 1,347 library assets linked (0 newly fetched), Capacitor sync completed.
- `npm run apk:release --workspace=packages/scratchy-android -- --no-daemon` with JDK 21 and local keystore environment variables — **passed**. Release `apksigner` verification, package metadata (0.2.0 / code 3), archive integrity, and in-place installation on both AVDs all passed.
- `scratch-gui` unit tests — **63 suites passed**; `scratch-paint` unit tests — **15 suites passed**; GUI lint — **0 errors**.
- Android Playwright matrix — **12/12 passed** across compact phone, landscape, and tablet viewports. This is headless-browser coverage, separate from the AVD checks.

## AVD smoke results

- **Phone layout/navigation:** app launched; `Create` and `Sprites` navigation remained visible at the bottom of the 411×914 viewport. The overflow menu exposed Tutorials, Debug, and Edit project title. Block tap and drag insertion were exercised (`03`, `04`, `10`, `53`). The title menu entry was seen, but title editing and keyboard behavior were not fully exercised.
- **Back/fullscreen:** hardware Back dismissed the Outline sheet and exited stage fullscreen before the exit confirmation (`07`–`09`, `14`). Blockly long-press/context menus and tutorial Cards remain unverified.
- **File/share:** Android share sheet exposed a generated `.sb3`; the file was ZIP-validated and its test cache entry removed (`12`). Android DocumentsUI opened and a valid local `.sb3` project loaded; the temporary Downloads copy was removed (`13`, `48`). Wrong-type upload behavior was not tested on-device.
- **Sound recording:** microphone permission was granted for the test, recording started/stopped and `recording1` appeared in Sounds (`21`, `23`, `24`). Permission was denied again afterward.
- **Extensions/camera:** offline extension library/badges were inspected; Video Sensing blocks loaded, and the camera permission prompt/grant was exercised (`26`, `28`–`30`). This does not substitute for a physical camera test.
- **Orientation/tablet pane:** phone landscape was captured (`31`). On the tablet at 800×1280, target-pane collapse measured 974→72 CSS px and expansion restored 974 px; screenshots show collapsed and expanded states (`35`–`37`). Tablet was returned to landscape (`49`).
- **Outline (partial B-19):** on a selected mixed-style vector group, the phone AVD accepted `#FFAB19` and the Outline control swatch updated (`38`–`41`). The group displayed width 0 pt until explicit **Add outline**, which moved it to 1 pt (`42`). This verifies the real sheet/touch path and explicit enable action, **not** color-only auto-width on a single no-stroke path, serialized SVG output, or one-step undo.

## Curated screenshots

All are PNG captures under this directory:

| Evidence | Screenshot |
|---|---|
| Pre-release debug test build: phone | [`53-phone-final-settled.png`](53-phone-final-settled.png) |
| Pre-release debug test build: tablet | [`54-tablet-final-current-source.png`](54-tablet-final-current-source.png) |
| v0.2.0 release APK: phone | [`55-phone-v0.2.0-release.png`](55-phone-v0.2.0-release.png) |
| v0.2.0 release APK: tablet | [`56-tablet-v0.2.0-release.png`](56-tablet-v0.2.0-release.png) |
| Overflow menu: Tutorials / Debug / Edit title | [`10-phone-overflow.png`](10-phone-overflow.png) |
| Block tap and drag | [`03-phone-block-tap.png`](03-phone-block-tap.png), [`04-phone-block-drag.png`](04-phone-block-drag.png) |
| Hardware Back and fullscreen | [`07-phone-outline-hardware-back.png`](07-phone-outline-hardware-back.png), [`08-phone-stage-fullscreen.png`](08-phone-stage-fullscreen.png), [`09-phone-fullscreen-hardware-back.png`](09-phone-fullscreen-hardware-back.png) |
| Native share and picker | [`12-phone-native-share-sheet.png`](12-phone-native-share-sheet.png), [`13-phone-file-picker.png`](13-phone-file-picker.png) |
| Recording and saved sound | [`21-phone-record-after-grant.png`](21-phone-record-after-grant.png), [`23-phone-recording-stopped.png`](23-phone-recording-stopped.png), [`24-phone-record-saved.png`](24-phone-record-saved.png) |
| Offline extensions / camera | [`26-phone-extension-library-offline.png`](26-phone-extension-library-offline.png), [`29-phone-video-sensing-loaded.png`](29-phone-video-sensing-loaded.png), [`30-phone-camera-after-grant.png`](30-phone-camera-after-grant.png) |
| Tablet portrait collapse/expand | [`35-tablet-portrait.png`](35-tablet-portrait.png), [`36-tablet-portrait-collapsed.png`](36-tablet-portrait-collapsed.png), [`37-tablet-portrait-expanded.png`](37-tablet-portrait-expanded.png) |
| Outline control interaction | [`38-phone-costume-before-outline-test.png`](38-phone-costume-before-outline-test.png), [`39-phone-costume-selected-shape.png`](39-phone-costume-selected-shape.png), [`40-phone-outline-sheet-selected-shape.png`](40-phone-outline-sheet-selected-shape.png), [`41-phone-outline-applied-selected-path.png`](41-phone-outline-applied-selected-path.png), [`42-phone-outline-added-to-selected-path.png`](42-phone-outline-added-to-selected-path.png) |

## Remaining limits

There was no physical-device run. Several accepted plan gates remain open: project-title editing/keyboard behavior, long-press and Blockly context menus, wider flyout blocks, single-path Outline auto-width/SVG/undo, complete Fill/gradient/swap parity, and physical microphone/camera behavior. The plan remains **in progress**; this report is emulator evidence, not a completion claim.