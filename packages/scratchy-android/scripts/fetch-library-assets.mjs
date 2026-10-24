// Download every Scratch library asset into a persistent cache, then link it into the GUI build so the
// APK works offline. Port of scratch-desktop's scripts/fetchMediaLibraryAssets.js.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const libraryDir = path.resolve(root, '../scratch-gui/src/lib/libraries');
const cacheDir = path.resolve(root, '.asset-cache');
const outDir = path.resolve(root, '../scratch-gui/build-android/library-assets');

const ASSET_URL = 'https://cdn.assets.scratch.mit.edu/internalapi/asset';
const CONCURRENCY = 5;
const RETRIES = 4;

const readLibrary = async name => JSON.parse(await fs.readFile(path.join(libraryDir, `${name}.json`), 'utf8'));

const collectSimple = (library, dest, label) => {
    for (const item of library) {
        const names = [item.md5, item.baseLayerMD5, item.md5ext].filter(Boolean);
        if (names.length < 1) {
            console.warn(`${label} has no MD5 property: ${item.name}`);
        }
        names.forEach(name => dest.add(name));
    }
};

const collectAssets = async () => {
    const dest = new Set();
    collectSimple(await readLibrary('backdrops'), dest, 'Backdrop');
    collectSimple(await readLibrary('costumes'), dest, 'Costume');
    collectSimple(await readLibrary('sounds'), dest, 'Sound');
    for (const sprite of await readLibrary('sprites')) {
        collectSimple(sprite.costumes || [], dest, `Costume of ${sprite.name}`);
        collectSimple(sprite.sounds || [], dest, `Sound of ${sprite.name}`);
    }
    return dest;
};

const exists = file => fs.access(file).then(() => true, () => false);

const fetchAsset = async md5ext => {
    // Assets are content-addressed, so an existing file is correct. Download to .tmp and rename so an
    // interrupted run never leaves a partial file that looks complete.
    const dest = path.join(cacheDir, md5ext);
    if (await exists(dest)) return false;
    let lastError;
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
        try {
            const response = await fetch(`${ASSET_URL}/${md5ext}/get/`);
            if (!response.ok) throw new Error(`status ${response.status}`);
            await fs.writeFile(`${dest}.tmp`, Buffer.from(await response.arrayBuffer()));
            await fs.rename(`${dest}.tmp`, dest);
            return true;
        } catch (err) {
            lastError = err;
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
    }
    throw new Error(`Failed to fetch ${md5ext}: ${lastError.message}`);
};

const main = async () => {
    await fs.mkdir(cacheDir, {recursive: true});
    const assets = [...await collectAssets()];
    console.log(`Total library assets: ${assets.length}`);

    const queue = assets.slice();
    let fetched = 0;
    const failures = [];
    const worker = async () => {
        while (queue.length > 0) {
            const md5ext = queue.pop();
            try {
                if (await fetchAsset(md5ext) && ++fetched % 100 === 0) console.log(`Fetched ${fetched}...`);
            } catch (err) {
                failures.push(err.message);
            }
        }
    };
    await Promise.all(Array.from({length: CONCURRENCY}, worker));
    if (failures.length > 0) {
        console.error(failures.join('\n'));
        throw new Error(`${failures.length} asset(s) failed`);
    }
    console.log(`Fetched ${fetched} new asset(s).`);

    // Link (or copy across filesystems) into the GUI build output that Capacitor packages.
    await fs.rm(outDir, {recursive: true, force: true});
    await fs.mkdir(outDir, {recursive: true});
    for (const md5ext of assets) {
        const src = path.join(cacheDir, md5ext);
        const dest = path.join(outDir, md5ext);
        await fs.link(src, dest).catch(() => fs.copyFile(src, dest));
    }
    console.log(`Linked ${assets.length} assets into ${outDir}`);
};

main().catch(err => {
    console.error(err);
    process.exit(1);
});
