import {useEffect, useRef, useState} from 'react';
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

const isEditingField = element => Boolean(element && (
    element.isContentEditable ||
    element.matches('input, textarea, select, [contenteditable="true"], [role="textbox"]') ||
    element.closest('.blocklyHtmlInput')
));

const shouldDeferModeChange = (previous, next, activeElement) => (
    previous.width === next.width &&
    previous.mode !== next.mode &&
    isEditingField(activeElement)
);

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
    const currentState = useRef(state);
    currentState.current = state;

    useEffect(() => {
        if (!enabled) {
            const fullLayout = {mode: LAYOUT_MODES.full, width: Infinity, stageScale: null};
            currentState.current = fullLayout;
            setState(fullLayout);
            return;
        }

        let pendingMode = null;
        let pendingFrames = 0;
        let pendingFrame = null;
        let isMounted = true;

        const update = force => {
            const next = measure();
            const previous = currentState.current;
            if (previous.mode === next.mode) {
                pendingMode = null;
                pendingFrames = 0;
                if (previous.width !== next.width || previous.stageScale !== next.stageScale) {
                    currentState.current = next;
                    setState(next);
                }
                return;
            }
            if (shouldDeferModeChange(previous, next, document.activeElement)) {
                pendingMode = null;
                pendingFrames = 0;
                return;
            }
            if (!force) {
                if (pendingMode === next.mode) {
                    pendingFrames += 1;
                } else {
                    pendingMode = next.mode;
                    pendingFrames = 1;
                }
                if (pendingFrames < 2) {
                    if (pendingFrame === null) {
                        pendingFrame = window.requestAnimationFrame(() => {
                            pendingFrame = null;
                            if (isMounted) update(false);
                        });
                    }
                    return;
                }
            }
            pendingMode = null;
            pendingFrames = 0;
            currentState.current = next;
            setState(next);
        };
        const handleResize = () => update(false);
        const handleOrientationChange = () => update(true);

        update(true);
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleOrientationChange);
        document.addEventListener('focusout', handleResize);
        return () => {
            isMounted = false;
            if (pendingFrame !== null) window.cancelAnimationFrame(pendingFrame);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleOrientationChange);
            document.removeEventListener('focusout', handleResize);
        };
    }, [enabled]);

    return state;
};

export {isEditingField, shouldDeferModeChange, useLayoutMode};
