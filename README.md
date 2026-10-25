# Scratchy-Scratchy

An unofficial, offline-capable Android app that wraps the [Scratch](https://scratch.mit.edu) editor
from [scratchfoundation/scratch-editor](https://github.com/scratchfoundation/scratch-editor) with a
phone and tablet interface. It is not affiliated with, endorsed by, or sponsored by the Scratch
Foundation or MIT. "Scratch" and the Scratch Cat are trademarks of MIT; see `TRADEMARK`.

Licensed under AGPL-3.0, like upstream. If you distribute the APK, you must offer this source.
The upstream README is kept as `README.upstream.md`.

## What is different from upstream

- `packages/scratch-gui`: a new `BUILD_TYPE=android` build and entry (`src/playground/android.*`,
  `render-gui-android.jsx`), a compact phone layout with Create / Sprites navigation and a
  persistent stage strip, a medium tablet layout, and touch tuning. All of it applies only when
  `platform === ANDROID`.
- `packages/scratchy-android`: a Capacitor 8 project. Saving opens the Android share sheet, loading uses
  the system file chooser, and the mic and camera permissions are declared.
- All library sprites, costumes, sounds and backdrops are bundled in the APK, so the libraries work offline.
  Hardware extensions that need Bluetooth are hidden.

## Build a debug APK

Requirements: Node 24, JDK 21, Android SDK with platform 36 and build-tools.

```bash
npm ci
# build workspace dependencies (scratch-vm, scratch-render, scratch-storage, ...) first,
# see the root package.json scripts
export JAVA_HOME=/usr/lib/jvm/openjdk21 ANDROID_HOME=$HOME/Android/Sdk
npm run build -w scratchy-android   # GUI build, fetch library assets, cap sync
npm run apk -w scratchy-android     # packages/scratchy-android/android/app/build/outputs/apk/debug/app-debug.apk
```

The first build downloads about 1300 library assets from the Scratch CDN into
`packages/scratchy-android/.asset-cache` (git-ignored).

## Status

The Android production bundle and debug APK build successfully. A 12-test Playwright suite in
headless Chromium passes compact phone (360×844 / 390×844), landscape (844×390), and tablet
(768×1024 / 800×1280) regressions, including Outline editing, tap/drag block insertion, stage/sprite
navigation, and editor layout.

The **v0.2.0 prerelease APK** is available from the [GitHub release](https://github.com/soubarnak/scratchy-scratchy/releases/tag/v0.2.0). The signed release variant was
installed in place on both `scratchy-phone` and `scratchy-tablet` AVDs (`adb install -r`: `Success`),
without uninstalling or clearing app data. APK SHA-256: `85b087fba4e094f3a8035cf6465b8f7cf0fa324e7fb0e2d15c4f747be9718d05`; signer SHA-256
(`57a00d9c…a596`) matches the existing app. For local in-place debug updates,
`packages/scratchy-android/android/app/build.gradle` supports the explicit
`SCRATCHY_DEBUG_USE_RELEASE_KEY=1` opt-in with local `SCRATCHY_KEYSTORE` credentials; without it,
debug builds keep Android's standard debug key. Do not commit the keystore or passwords.

Phone and tablet AVD smoke results, signer/build evidence, limitations, and screenshots are indexed in
[`artifacts/android-emulator/TEST-REPORT.md`](artifacts/android-emulator/TEST-REPORT.md). No physical-device
run has been performed.
