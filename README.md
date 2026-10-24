# Scratchy-Scratchy

An unofficial, offline-capable Android app that wraps the [Scratch](https://scratch.mit.edu) editor
from [scratchfoundation/scratch-editor](https://github.com/scratchfoundation/scratch-editor) with a
phone and tablet interface. It is not affiliated with, endorsed by, or sponsored by the Scratch
Foundation or MIT. "Scratch" and the Scratch Cat are trademarks of MIT; see `TRADEMARK`.

Licensed under AGPL-3.0, like upstream. If you distribute the APK, you must offer this source.
The upstream README is kept as `README.upstream.md`.

## What is different from upstream

- `packages/scratch-gui`: a new `BUILD_TYPE=android` build and entry (`src/playground/android.*`,
  `render-gui-android.jsx`), a compact phone layout with a bottom nav (Code / Stage / Sprites),
  a medium tablet layout, and touch tuning. All of it applies only when `platform === ANDROID`.
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

Tested on Android 17 emulators (phone and tablet). Not tested on a physical device. Recording sounds,
camera and video sensing, and the extension library are untested.
