/**
 * The paper import frame script, run under jsdom with paper-core as the frame's
 * `paper` global, the way the sandbox loads it.
 */

const SVG_PATH = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
    '<path d="M10 10 L90 10 L90 90 Z" fill="red"/></svg>';

// Settles with a marker instead of hanging, so a lost rejection fails fast.
const settleWithin = (promise, ms) => Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve('still pending'), ms))
]);

beforeEach(() => {
    jest.resetModules();
    global.paper = require('@scratch/paper/dist/paper-core.min.js');
    require('../../src/helper/paper-import.js');
});

afterEach(() => {
    jest.restoreAllMocks();
    delete global.paper;
    delete window.onSandboxMessage;
});

test('imports an SVG and exports its JSON', async () => {
    const result = await window.onSandboxMessage({svg: SVG_PATH});

    expect(JSON.parse(result.paperJSON)).toBeTruthy();
    expect(result.viewBox).toEqual([0, 0, 100, 100]);
});

test('rejects when exporting the imported item throws', async () => {
    jest.spyOn(global.paper.Item.prototype, 'exportJSON').mockImplementation(() => {
        throw new Error('export failed');
    });

    await expect(settleWithin(window.onSandboxMessage({svg: SVG_PATH}), 1000))
        .rejects.toThrow('export failed');
});
