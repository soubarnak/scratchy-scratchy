import {isEditingField, shouldDeferModeChange} from '../../../src/lib/use-layout-mode';

describe('use-layout-mode resize guards', () => {
    const previous = {mode: 'medium', width: 800, stageScale: 0.8};

    test('defers a height-only layout change while a text field has focus', () => {
        const input = document.createElement('input');
        const next = {mode: 'compact', width: 800, stageScale: 0.34};

        expect(isEditingField(input)).toBe(true);
        expect(shouldDeferModeChange(previous, next, input)).toBe(true);
    });

    test('allows width and orientation changes while a field has focus', () => {
        const input = document.createElement('input');
        const next = {mode: 'compact', width: 390, stageScale: 0.34};

        expect(shouldDeferModeChange(previous, next, input)).toBe(false);
        expect(shouldDeferModeChange(previous, next, document.body)).toBe(false);
    });
});
