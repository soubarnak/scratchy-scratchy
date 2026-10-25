const STORAGE_KEY_PREFIX = 'scratch-paint.mobile-color-preferences.';
const MAX_RECENT_COLORS = 12;
import log from '../log/log';

const DEFAULT_PREFERENCES = {recentColors: [], lastStrokeWidth: null};

const storageKeyFor = projectId => {
    const projectKey = typeof projectId === 'string' || typeof projectId === 'number' ?
        String(projectId) : 'unsaved';
    return `${STORAGE_KEY_PREFIX}${projectKey}`;
};

const isHexColor = color => typeof color === 'string' && /^#[\da-f]{3,8}$/i.test(color);

const getMobileColorPreferences = projectId => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

    try {
        const value = window.localStorage.getItem(storageKeyFor(projectId));
        if (!value) return DEFAULT_PREFERENCES;
        const saved = JSON.parse(value);
        return {
            recentColors: Array.isArray(saved.recentColors) ?
                saved.recentColors.filter(isHexColor).slice(0, MAX_RECENT_COLORS) : [],
            lastStrokeWidth: Number.isFinite(saved.lastStrokeWidth) && saved.lastStrokeWidth >= 0 ?
                saved.lastStrokeWidth : null
        };
    } catch (error) {
        log.warn(`Unable to read mobile paint preferences for project ${projectId}: ${error}`);
        return DEFAULT_PREFERENCES;
    }
};

const saveMobileColorPreferences = (projectId, update) => {
    if (typeof window === 'undefined') return;

    const current = getMobileColorPreferences(projectId);
    const recentColors = isHexColor(update.color) ? [
        update.color.toUpperCase(),
        ...current.recentColors.filter(color => color.toUpperCase() !== update.color.toUpperCase())
    ].slice(0, MAX_RECENT_COLORS) : current.recentColors;
    const lastStrokeWidth = Number.isFinite(update.lastStrokeWidth) && update.lastStrokeWidth >= 0 ?
        update.lastStrokeWidth : current.lastStrokeWidth;

    try {
        window.localStorage.setItem(storageKeyFor(projectId), JSON.stringify({
            recentColors,
            lastStrokeWidth
        }));
    } catch (error) {
        log.warn(`Unable to save mobile paint preferences for project ${projectId}: ${error}`);
    }
};

export {getMobileColorPreferences, saveMobileColorPreferences};
