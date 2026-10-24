import {App} from '@capacitor/app';
import {Directory, Filesystem} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';

import {EditorState, createStandaloneRoot, setAppElement} from '../index-standalone';
import {setDownloadHandler} from '../lib/download-blob';
import {setWidenFileAccept} from '../lib/file-accept';
import {setLibraryAssetBase} from '../lib/legacy-library-asset-url';
import HashParserHOC from '../lib/hash-parser-hoc.jsx';
import {PLATFORM} from '../lib/platform.js';
import {closeAlert} from '../reducers/alerts';
import {closeLoginMenu} from '../reducers/menus';
import {closeModal} from '../reducers/modals';

const noop = () => {};

// Slice size for base64 encoding; a multiple of 3 so each slice encodes without padding and slices concatenate.
const CHUNK_BYTES = 0x7ff8;

const bytesToBase64 = bytes => {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x2000) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x2000));
    }
    return btoa(binary);
};

// eslint-disable-next-line no-control-regex
const UNSAFE_FILENAME_CHARS = /[\\/:*?"<>|\u0000-\u001f\u007f]/g;

const sanitizeFilename = filename => {
    const clean = String(filename || '').replace(UNSAFE_FILENAME_CHARS, '_')
        .trim();
    return clean.replace(/^[._\s]+$/, '') ? clean : 'Project.sb3';
};

const isShareCancel = err => !!err && (
    /cancel|abort|dismiss/i.test(String(err.code)) || /cancel/i.test(String(err.message))
);

// Write the blob to the cache in chunks so the whole file is never held as one giant base64 string.
const writeBlob = async (path, blob) => {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let uri;
    for (let offset = 0; offset < bytes.length || offset === 0; offset += CHUNK_BYTES) {
        const data = bytesToBase64(bytes.subarray(offset, offset + CHUNK_BYTES));
        if (offset === 0) {
            ({uri} = await Filesystem.writeFile({path, data, directory: Directory.Cache}));
        } else {
            await Filesystem.appendFile({path, data, directory: Directory.Cache});
        }
    }
    return uri;
};

// The WebView ignores `<a download>`: write the file to the cache and hand it to the share sheet instead.
const shareBlob = async (filename, blob) => {
    const path = sanitizeFilename(filename);
    try {
        const uri = await writeBlob(path, blob);
        await Share.share({files: [uri]});
    } catch (err) {
        // Dismissing the share sheet rejects; only report real failures.
        if (!isShareCancel(err)) {
            // eslint-disable-next-line no-alert
            alert(`Could not save ${path}: ${err && err.message}`);
        }
    } finally {
        // The shared copy is no longer needed once the share sheet resolves or rejects.
        await Filesystem.deleteFile({path, directory: Directory.Cache}).catch(noop);
    }
};

let backButtonHandle = null;

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

    // Record the order modals open in, so back can close the most recent one.
    const modalOrder = [];
    state.store.subscribe(() => {
        const {modals} = state.store.getState().scratchGui;
        for (const name of Object.keys(modals)) {
            const index = modalOrder.indexOf(name);
            if (modals[name] && index === -1) modalOrder.push(name);
            else if (!modals[name] && index !== -1) modalOrder.splice(index, 1);
        }
    });

    // Back closes, in order: an open menu, the newest modal, a closable alert; otherwise confirm before leaving.
    const onBackButton = () => {
        const {store} = state;
        const {menus, modals, alerts, projectChanged} = store.getState().scratchGui;
        if (menus.loginMenu) {
            store.dispatch(closeLoginMenu());
            return;
        }
        const openModals = modalOrder.filter(name => modals[name]);
        if (openModals.length > 0) {
            store.dispatch(closeModal(openModals[openModals.length - 1]));
            return;
        }
        const alertIndex = alerts.alertsList.map(a => !!a.closeButton).lastIndexOf(true);
        if (alertIndex !== -1) {
            store.dispatch(closeAlert(alertIndex));
            return;
        }
        // eslint-disable-next-line no-alert
        if (!projectChanged || confirm('You have unsaved changes. Exit anyway?')) {
            App.exitApp();
        }
    };

    // Drop any earlier registration so the handler can never run twice.
    const previousHandle = backButtonHandle;
    backButtonHandle = null;
    Promise.resolve(previousHandle)
        .then(handle => handle && handle.remove())
        .catch(noop)
        .then(() => App.addListener('backButton', onBackButton))
        .then(handle => {
            backButtonHandle = handle;
        })
        .catch(err => {
            console.error('Could not register back button handler:', err); // eslint-disable-line no-console
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
