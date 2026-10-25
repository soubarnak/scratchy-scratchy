let widen = false;

/**
 * Some WebViews (Android) filter out every file when `accept` lists only extensions.
 * @param {boolean} value - true to accept any file type; extension checks then happen after selection.
 */
export const setWidenFileAccept = value => {
    widen = value;
};

/**
 * @param {string} accept - the `accept` attribute value for a file input.
 * @returns {string} - accept, or a wildcard when widening is on.
 */
export const getFileAccept = accept => (widen ? '*/*' : accept);

/**
 * Check a selected filename after Android's wildcard file picker returns it.
 * @param {string} fileName - selected file name.
 * @returns {boolean} whether the file uses a supported Scratch project extension.
 */
export const isScratchProjectFile = fileName => /\.(sb|sb2|sb3)$/i.test(fileName);
