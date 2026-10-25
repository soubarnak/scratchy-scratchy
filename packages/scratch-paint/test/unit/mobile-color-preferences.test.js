import {getMobileColorPreferences, saveMobileColorPreferences} from '../../src/lib/mobile-color-preferences';
import log from '../../src/log/log';

describe('mobile color preferences', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    test('stores recent colors and widths separately for each project', () => {
        saveMobileColorPreferences('project-a', {color: '#ff0000', lastStrokeWidth: 4});
        saveMobileColorPreferences('project-b', {color: '#00ff00'});

        expect(getMobileColorPreferences('project-a')).toEqual({
            recentColors: ['#FF0000'],
            lastStrokeWidth: 4
        });
        expect(getMobileColorPreferences('project-b')).toEqual({
            recentColors: ['#00FF00'],
            lastStrokeWidth: null
        });
    });

    test('keeps the twelve most recent unique valid colors', () => {
        for (let index = 0; index < 14; index++) {
            const color = `#${index.toString(16).padStart(6, '0')}`;
            saveMobileColorPreferences('project', {color});
        }
        saveMobileColorPreferences('project', {color: '#00000D'});

        const preferences = getMobileColorPreferences('project');
        expect(preferences.recentColors).toHaveLength(12);
        expect(preferences.recentColors[0]).toBe('#00000D');
        expect(preferences.recentColors).not.toContain('#000000');
    });

    test('ignores invalid preference data and preserves valid stored width', () => {
        window.localStorage.setItem('scratch-paint.mobile-color-preferences.project', '{bad json');
        jest.spyOn(log, 'warn').mockImplementation(() => {});
        expect(getMobileColorPreferences('project')).toEqual({recentColors: [], lastStrokeWidth: null});
        log.warn.mockRestore();
        window.localStorage.removeItem('scratch-paint.mobile-color-preferences.project');

        saveMobileColorPreferences('project', {lastStrokeWidth: 2});
        saveMobileColorPreferences('project', {color: '#abcdef'});
        expect(getMobileColorPreferences('project')).toEqual({
            recentColors: ['#ABCDEF'],
            lastStrokeWidth: 2
        });
    });
});
