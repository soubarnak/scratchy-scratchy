import {App} from '@capacitor/app';
import {Directory, Filesystem} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';

import {EditorState, createStandaloneRoot, setAppElement} from '../index-standalone';
import {setDownloadHandler} from '../lib/download-blob';
import {setWidenFileAccept} from '../lib/file-accept';
import {setLibraryAssetBase} from '../lib/legacy-library-asset-url';
import HashParserHOC from '../lib/hash-parser-hoc.jsx';
import {PLATFORM} from '../lib/platform.js';
import {closeModal} from '../reducers/modals';

const noop = () => {};

const blobToBase64 = blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

// The WebView ignores `<a download>`: write the file to the cache and hand it to the share sheet instead.
const shareBlob = async (filename, blob) => {
    try {
        const {uri} = await Filesystem.writeFile({
            path: filename,
            data: await blobToBase64(blob),
            directory: Directory.Cache
        });
        await Share.share({files: [uri]});
    } catch (err) {
        // Dismissing the share sheet rejects; only report real failures.
        if (!/cancel/i.test(String(err && err.message))) {
            // eslint-disable-next-line no-alert
            alert(`Could not save ${filename}: ${err && err.message}`);
        }
    }
};

/*
 * Render the GUI for the Android (Capacitor) app. This is a separate function because importing anything
 * that instantiates the VM causes unsupported browsers to crash
 * {object} appTarget - the DOM element to render to
 */
export default appTarget => {
    setAppElement(appTarget);
    setDownloadHandler(shareBlob);
    setWidenFileAccept(true);
    // Absolute: scratch-storage resolves relative URLs against the loaded chunk (chunks/), not the page.
    setLibraryAssetBase(new URL('library-assets/', document.baseURI).href);

    const state = new EditorState({
        showTelemetryModal: false
    });
    const gui = createStandaloneRoot(state, appTarget, {
        // Sets the default project id, which makes the project fetcher load the bundled default project.
        wrappers: [HashParserHOC]
    });

    // Back closes the topmost open modal/library first; otherwise confirm before leaving unsaved work.
    App.addListener('backButton', () => {
        const {store} = state;
        const {modals, projectChanged} = store.getState().scratchGui;
        const openModals = Object.keys(modals).filter(name => modals[name]);
        if (openModals.length > 0) {
            store.dispatch(closeModal(openModals[openModals.length - 1]));
            return;
        }
        // eslint-disable-next-line no-alert
        if (!projectChanged || confirm('You have unsaved changes. Exit anyway?')) {
            App.exitApp();
        }
    });

    gui.render({
        platform: PLATFORM.ANDROID,
        canEditTitle: true,
        canSave: false,
        canModifyCloudData: false,
        backpackVisible: false,
        showTelemetryModal: false,
        onClickLogo: noop
    });
};
