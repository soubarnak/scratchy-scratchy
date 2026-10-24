import {createContext} from 'react';

/**
 * Scale factor for the stage when the phone (compact) layout is active. The GUI measures the pane the stage lives in
 * and provides the result here; the Stage component reads it when its size is `STAGE_DISPLAY_SIZES.compact`.
 * `null` means "use the default scale".
 */
export const CompactStageScaleContext = createContext(null);
