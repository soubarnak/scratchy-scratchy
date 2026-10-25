import {App} from '@capacitor/app';
import {Directory, Filesystem} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';

import {EditorState, createStandaloneRoot, setAppElement} from '../index-standalone';
import {setDownloadHandler} from '../lib/download-blob';
import {cleanupStaleShareFiles, createShareBlobHandler} from '../lib/android-share';
import {setWidenFileAccept} from '../lib/file-accept';
import {requestCloseMenus} from '../lib/close-menus';
import {requestCloseBlocks} from '../lib/close-blocks';
import {setLibraryAssetBase} from '../lib/legacy-library-asset-url';
import HashParserHOC from '../lib/hash-parser-hoc.jsx';
import {PLATFORM} from '../lib/platform.js';
import {closeAlert, showStandardAlert} from '../reducers/alerts';
import {closeCards} from '../reducers/cards';
import {closeLoginMenu} from '../reducers/menus';
import {closeExitConfirmation, closeModal, openExitConfirmation} from '../reducers/modals';
import {setFullScreen} from '../reducers/mode';

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

let backButtonHandle = null;

/*
 * Render the GUI for the Android (Capacitor) app. This is a separate function because importing anything
 * that instantiates the VM causes unsupported browsers to crash
 * {object} appTarget - the DOM element to render to
 */
export default appTarget => {
    setAppElement(appTarget);
    setWidenFileAccept(true);
    // Absolute: scratch-storage resolves relative URLs against the loaded chunk (chunks/), not the page.
    setLibraryAssetBase(new URL('library-assets/', document.baseURI).href);

    const state = new EditorState({
        showTelemetryModal: false
    });
    const shareBlob = createShareBlobHandler({
        writeBlob,
        share: options => Share.share(options),
        notifyError: (path, error) => {
            console.error('Could not save shared project:', {path, error}); // eslint-disable-line no-console
            state.store.dispatch(showStandardAlert('saveError'));
        }
    });
    setDownloadHandler(shareBlob);
    cleanupStaleShareFiles({
        directory: Directory.Cache,
        readdir: options => Filesystem.readdir(options),
        deleteFile: options => Filesystem.deleteFile(options)
    }).catch(error => {
        console.warn('Could not clean stale shared projects:', error); // eslint-disable-line no-console
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

    // Back closes transient UI before asking whether to discard unsaved work.
    const onBackButton = () => {
        const {store} = state;
        const appState = store.getState().scratchGui;
        const {menus, modals, alerts, projectChanged} = appState;
        if (requestCloseBlocks()) return;
        if (appState.mode.isFullScreen) {
            store.dispatch(setFullScreen(false));
            return;
        }
        if (appState.cards.visible) {
            store.dispatch(closeCards());
            return;
        }
        if (menus.loginMenu) {
            store.dispatch(closeLoginMenu());
            return;
        }
        if (requestCloseMenus()) return;
        const escapeEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(escapeEvent);
        if (escapeEvent.defaultPrevented) return;
        const openModals = modalOrder.filter(name => modals[name]);
        if (openModals.length > 0) {
            store.dispatch(closeModal(openModals[openModals.length - 1]));
            return;
        }
        const alertIndex = alerts.alertsList.map(alert => !!alert.closeButton).lastIndexOf(true);
        if (alertIndex !== -1) {
            store.dispatch(closeAlert(alertIndex));
            return;
        }
        if (projectChanged) {
            store.dispatch(openExitConfirmation());
        } else {
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
        onClickLogo: noop,
        onConfirmExit: () => {
            state.store.dispatch(closeExitConfirmation());
            App.exitApp();
        }
    });
};
