const CLOSE_BLOCKS_EVENT = 'scratch-gui:close-blocks';

/**
 * Ask an open Blockly menu or field editor to close before Android Back continues.
 * @returns {boolean} whether Blockly handled the request.
 */
const requestCloseBlocks = () => {
    const detail = {handled: false};
    document.dispatchEvent(new CustomEvent(CLOSE_BLOCKS_EVENT, {detail}));
    return detail.handled;
};

export {CLOSE_BLOCKS_EVENT, requestCloseBlocks};
