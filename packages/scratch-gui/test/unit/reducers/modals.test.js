import modalsReducer, {
    closeExitConfirmation,
    modalsInitialState,
    openExitConfirmation
} from '../../../src/reducers/modals';

describe('exit confirmation modal', () => {
    test('opens and closes through the normal modal reducer', () => {
        const opened = modalsReducer(modalsInitialState, openExitConfirmation());
        expect(opened.exitConfirmation).toBe(true);

        const closed = modalsReducer(opened, closeExitConfirmation());
        expect(closed.exitConfirmation).toBe(false);
    });
});
