import {CLOSE_MENUS_EVENT, requestCloseMenus} from '../../../src/lib/close-menus';

describe('requestCloseMenus', () => {
    test('reports nothing handled when no menu listens', () => {
        expect(requestCloseMenus()).toBe(false);
    });

    test('reports handled when a menu claims the event', () => {
        const listener = e => {
            e.detail.handled = true;
        };
        document.addEventListener(CLOSE_MENUS_EVENT, listener);
        expect(requestCloseMenus()).toBe(true);
        document.removeEventListener(CLOSE_MENUS_EVENT, listener);
    });
});
