import {useEffect, useState} from 'react';
import layout, {LAYOUT_MODES} from './layout-constants';
import {getCompactStageScale} from './screen-utils';

// Rem-independent chrome that surrounds the stage in the compact layout, in px:
// menu bar (3rem), bottom nav, stage header (2.75rem + padding), plus a little breathing room.
const COMPACT_CHROME_HEIGHT = 48 + 56 + 60 + 8;
// Stage pane padding (2 * 0.5rem) plus the stage border (2 * 1px), plus slack.
const COMPACT_CHROME_WIDTH = 16 + 2 + 2;

const COMPACT_QUERY = `(max-width: ${layout.compactMaxWidth}px), (max-height: ${layout.compactMaxHeight}px)`;
const MEDIUM_QUERY = `(min-width: ${layout.mediumMinWidth}px) and (max-width: ${layout.fullSizeMinWidth - 1}px)`;

const measure = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    let mode = LAYOUT_MODES.full;
    if (window.matchMedia(COMPACT_QUERY).matches) {
        mode = LAYOUT_MODES.compact;
    } else if (window.matchMedia(MEDIUM_QUERY).matches) {
        mode = LAYOUT_MODES.medium;
    }
    return {
        mode,
        width,
        stageScale: getCompactStageScale(width - COMPACT_CHROME_WIDTH, height - COMPACT_CHROME_HEIGHT)
    };
};

/**
 * Track the responsive layout mode of the window.
 * Always reports `full` when `enabled` is false, so non-Android platforms keep the upstream layout.
 * @param {boolean} enabled - whether responsive layouts apply.
 * @returns {{mode: string, width: number, stageScale: number}} - current layout mode, window width and the
 * scale to use for the compact stage.
 */
const useLayoutMode = enabled => {
    const [state, setState] = useState(() => (
        enabled ? measure() : {mode: LAYOUT_MODES.full, width: Infinity, stageScale: null}
    ));

    useEffect(() => {
        if (!enabled) {
            setState({mode: LAYOUT_MODES.full, width: Infinity, stageScale: null});
            return;
        }
        const update = () => setState(prev => {
            const next = measure();
            return prev.mode === next.mode && prev.width === next.width && prev.stageScale === next.stageScale ?
                prev :
                next;
        });
        update();
        window.addEventListener('resize', update);
        window.addEventListener('orientationchange', update);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('orientationchange', update);
        };
    }, [enabled]);

    return state;
};

export {useLayoutMode};
