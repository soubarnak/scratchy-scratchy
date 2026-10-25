import {CLOSE_BLOCKS_EVENT, requestCloseBlocks} from '../../../src/lib/close-blocks';

describe('requestCloseBlocks', () => {
    test('returns false when no Blockly surface handles the request', () => {
        expect(requestCloseBlocks()).toBe(false);
    });

    test('reports when an open Blockly surface handles the request', () => {
        const handle = event => {
            event.detail.handled = true;
        };
        document.addEventListener(CLOSE_BLOCKS_EVENT, handle);

        expect(requestCloseBlocks()).toBe(true);

        document.removeEventListener(CLOSE_BLOCKS_EVENT, handle);
    });
});
