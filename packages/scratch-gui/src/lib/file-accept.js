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
