import {EditorState, createStandaloneRoot, setAppElement} from '../index-standalone';
import {PLATFORM} from '../lib/platform.js';

const noop = () => {};

/*
 * Render the GUI for the Android (Capacitor) app. This is a separate function because importing anything
 * that instantiates the VM causes unsupported browsers to crash
 * {object} appTarget - the DOM element to render to
 */
export default appTarget => {
    setAppElement(appTarget);

    const state = new EditorState({
        showTelemetryModal: false
    });
    const gui = createStandaloneRoot(state, appTarget);

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
