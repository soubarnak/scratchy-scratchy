import keyMirror from 'keymirror';

/**
 * Names for each state of the stage size toggle
 * @enum {string}
 */
const STAGE_SIZE_MODES = keyMirror({
    /**
     * The "large stage" button is pressed; the user would like a large stage.
     */
    large: null,

    /**
     * The "small stage" button is pressed; the user would like a small stage.
     */
    small: null
});

/**
 * Names for each stage render size
 * @enum {string}
 */
const STAGE_DISPLAY_SIZES = keyMirror({
    /**
     * Large stage with wide browser
     */
    large: null,

    /**
     * Large stage with narrow browser
     */
    largeConstrained: null,

    /**
     * Small stage (ignores browser width)
     */
    small: null,

    /**
     * Phone layout: the stage is scaled to fit its own pane (see getStageDimensions)
     */
    compact: null
});

/**
 * Names for the responsive layout modes used by the Android platform.
 * Full is the upstream desktop layout; web and desktop platforms always use it.
 * @enum {string}
 */
const LAYOUT_MODES = keyMirror({
    full: null,
    medium: null,
    compact: null
});

// zoom level to start with
const BLOCKS_DEFAULT_SCALE = 0.675;

const STAGE_DISPLAY_SCALES = {};
STAGE_DISPLAY_SCALES[STAGE_DISPLAY_SIZES.large] = 1; // large mode, wide browser (standard)
STAGE_DISPLAY_SCALES[STAGE_DISPLAY_SIZES.largeConstrained] = 0.85; // large mode but narrow browser
STAGE_DISPLAY_SCALES[STAGE_DISPLAY_SIZES.small] = 0.5; // small mode, regardless of browser size
STAGE_DISPLAY_SCALES[STAGE_DISPLAY_SIZES.compact] = 0.75; // phone layout; real scale comes from the pane size

// Zoom levels for the Android platform
const BLOCKS_MEDIUM_SCALE = 0.8;
const BLOCKS_COMPACT_SCALE = 0.55;
// scratch-blocks fixes the palette at 250px; on phones it is narrower so the workspace keeps some room
const BLOCKS_COMPACT_FLYOUT_WIDTH = 190;

export default {
    standardStageWidth: 480,
    standardStageHeight: 360,
    fullSizeMinWidth: 1096,
    fullSizePaintMinWidth: 1250,

    // Keep these in sync with the media queries in the css files that mention `scratchy-android`.
    compactMaxWidth: 767,
    compactMaxHeight: 500,
    mediumMinWidth: 768,
    // Below this width the medium layout forces the small stage so the editor keeps enough room.
    mediumSmallStageMaxWidth: 900
};

export {
    BLOCKS_COMPACT_FLYOUT_WIDTH,
    BLOCKS_COMPACT_SCALE,
    BLOCKS_DEFAULT_SCALE,
    BLOCKS_MEDIUM_SCALE,
    LAYOUT_MODES,
    STAGE_DISPLAY_SCALES,
    STAGE_DISPLAY_SIZES,
    STAGE_SIZE_MODES
};
