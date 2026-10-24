import {getCompactStageScale, getStageDimensions, resolveStageSize} from '../../../src/lib/screen-utils';
import {LAYOUT_MODES, STAGE_DISPLAY_SIZES, STAGE_SIZE_MODES} from '../../../src/lib/layout-constants';

describe('resolveStageSize', () => {
    test('full layout keeps the upstream behaviour', () => {
        expect(resolveStageSize(STAGE_SIZE_MODES.large, true)).toBe(STAGE_DISPLAY_SIZES.large);
        expect(resolveStageSize(STAGE_SIZE_MODES.large, false)).toBe(STAGE_DISPLAY_SIZES.largeConstrained);
        expect(resolveStageSize(STAGE_SIZE_MODES.small, true)).toBe(STAGE_DISPLAY_SIZES.small);
        expect(resolveStageSize(STAGE_SIZE_MODES.large, false, LAYOUT_MODES.full, 800))
            .toBe(STAGE_DISPLAY_SIZES.largeConstrained);
    });

    test('compact layout always uses the compact stage size', () => {
        expect(resolveStageSize(STAGE_SIZE_MODES.large, false, LAYOUT_MODES.compact, 390))
            .toBe(STAGE_DISPLAY_SIZES.compact);
        expect(resolveStageSize(STAGE_SIZE_MODES.small, false, LAYOUT_MODES.compact, 390))
            .toBe(STAGE_DISPLAY_SIZES.compact);
    });

    test('medium layout forces the small stage on narrow tablets', () => {
        expect(resolveStageSize(STAGE_SIZE_MODES.large, false, LAYOUT_MODES.medium, 800))
            .toBe(STAGE_DISPLAY_SIZES.small);
    });

    test('medium layout honours the stage size toggle on wider tablets', () => {
        expect(resolveStageSize(STAGE_SIZE_MODES.large, false, LAYOUT_MODES.medium, 1024))
            .toBe(STAGE_DISPLAY_SIZES.largeConstrained);
        expect(resolveStageSize(STAGE_SIZE_MODES.small, false, LAYOUT_MODES.medium, 1024))
            .toBe(STAGE_DISPLAY_SIZES.small);
    });
});

describe('getStageDimensions', () => {
    test('compact stage uses the given scale and keeps the 4:3 ratio', () => {
        const dimensions = getStageDimensions(STAGE_DISPLAY_SIZES.compact, false, 0.8);
        expect(dimensions.scale).toBe(0.8);
        expect(dimensions.width).toBe(384);
        expect(dimensions.height).toBe(288);
    });

    test('compact stage falls back to the default scale', () => {
        expect(getStageDimensions(STAGE_DISPLAY_SIZES.compact, false).scale).toBe(0.75);
    });

    test('the compact scale is ignored for other stage sizes', () => {
        expect(getStageDimensions(STAGE_DISPLAY_SIZES.small, false, 0.8).scale).toBe(0.5);
    });
});

describe('getCompactStageScale', () => {
    test('fits the stage to the pane width', () => {
        expect(getCompactStageScale(360, 800)).toBe(0.75);
    });

    test('fits the stage to the pane height when that is the tighter limit', () => {
        expect(getCompactStageScale(800, 180)).toBe(0.5);
    });

    test('clamps to a sane range', () => {
        expect(getCompactStageScale(2000, 2000)).toBe(1.5);
        expect(getCompactStageScale(10, 10)).toBe(0.25);
    });
});
