import PropTypes from 'prop-types';
// The package uses Babel's classic JSX runtime, which requires the React binding.
// eslint-disable-next-line no-unused-vars
import React, {useCallback} from 'react';
import {defineMessages, useIntl} from 'react-intl';

import Input from './forms/input.jsx';
import InputGroup from './input-group/input-group.jsx';
import LiveInputHOC from './forms/live-input-hoc.jsx';
import styles from './stroke-width-indicator.css';

import {MAX_STROKE_WIDTH} from '../reducers/stroke-width';

const LiveInput = LiveInputHOC(Input);
const messages = defineMessages({
    width: {
        id: 'paint.mobileColorSheet.outlineWidth',
        defaultMessage: 'Outline width: {width} pt',
        description: 'Current outline width in points in the mobile color sheet'
    },
    widthPreview: {
        id: 'paint.mobileColorSheet.outlinePreview',
        defaultMessage: 'Outline preview, {width} pt',
        description: 'Accessible description of the live outline width preview'
    },
    decrease: {
        id: 'paint.mobileColorSheet.decreaseWidth',
        defaultMessage: 'Decrease outline width',
        description: 'Accessible label for the decrement outline width button'
    },
    increase: {
        id: 'paint.mobileColorSheet.increaseWidth',
        defaultMessage: 'Increase outline width',
        description: 'Accessible label for the increment outline width button'
    },
    none: {
        id: 'paint.mobileColorSheet.widthNone',
        defaultMessage: 'None',
        description: 'Preset for no outline width'
    },
    thin: {
        id: 'paint.mobileColorSheet.widthThin',
        defaultMessage: 'Thin',
        description: 'Preset for a thin one-point outline'
    },
    medium: {
        id: 'paint.mobileColorSheet.widthMedium',
        defaultMessage: 'Medium',
        description: 'Preset for a two-point outline'
    },
    thick: {
        id: 'paint.mobileColorSheet.widthThick',
        defaultMessage: 'Thick',
        description: 'Preset for a four-point outline'
    }
});
const PRESETS = [
    {width: 0, label: messages.none},
    {width: 1, label: messages.thin},
    {width: 2, label: messages.medium},
    {width: 4, label: messages.thick}
];

const StrokeWidthIndicatorComponent = props => {
    const intl = useIntl();
    const width = props.strokeWidth || 0;
    const updateWidth = useCallback(delta => props.onChangeStrokeWidth(Math.max(0, Math.min(
        MAX_STROKE_WIDTH,
        width + delta
    ))), [props.onChangeStrokeWidth, width]);
    const decreaseWidth = useCallback(() => updateWidth(-1), [updateWidth]);
    const increaseWidth = useCallback(() => updateWidth(1), [updateWidth]);
    const selectPreset = useCallback(event => {
        const presetWidth = Number(event.currentTarget.dataset.width);
        if (presetWidth === 0 && props.onSetNoOutline) props.onSetNoOutline();
        props.onChangeStrokeWidth(presetWidth);
    }, [props.onChangeStrokeWidth, props.onSetNoOutline]);
    if (!props.showMobileControls) {
        return (
            <InputGroup disabled={props.disabled}>
                <LiveInput
                    range
                    small
                    disabled={props.disabled}
                    max={MAX_STROKE_WIDTH}
                    min="0"
                    type="number"
                    value={props.strokeWidth ? props.strokeWidth : 0}
                    onSubmit={props.onChangeStrokeWidth}
                />
            </InputGroup>
        );
    }

    return (
        <div className={styles.mobileWidthControls}>
            <div className={styles.mobileWidthHeader}>
                <span
                    aria-label={intl.formatMessage(messages.widthPreview, {width})}
                    className={styles.mobileWidthPreview}
                    role="img"
                    style={{
                        borderColor: props.previewColor && props.previewColor !== 'MIXED' ?
                            props.previewColor : 'transparent',
                        borderWidth: width > 0 ? `${width * 4 / 3}px` : 0
                    }}
                />
                <div className={styles.mobileWidthStepper}>
                    <button
                        aria-label={intl.formatMessage(messages.decrease)}
                        disabled={width === 0}
                        onClick={decreaseWidth}
                        type="button"
                    >−</button>
                    <output aria-label={intl.formatMessage(messages.width, {width})}>
                        {intl.formatMessage(messages.width, {width})}
                    </output>
                    <button
                        aria-label={intl.formatMessage(messages.increase)}
                        disabled={width >= MAX_STROKE_WIDTH}
                        onClick={increaseWidth}
                        type="button"
                    >＋</button>
                </div>
            </div>
            <div className={styles.mobileWidthPresets}>
                {PRESETS.map(preset => (
                    <button
                        aria-pressed={width === preset.width}
                        key={preset.width}
                        data-width={preset.width}
                        onClick={selectPreset}
                        type="button"
                    >
                        {intl.formatMessage(preset.label)}
                    </button>
                ))}
            </div>
        </div>
    );
};

StrokeWidthIndicatorComponent.propTypes = {
    disabled: PropTypes.bool.isRequired,
    onChangeStrokeWidth: PropTypes.func.isRequired,
    onSetNoOutline: PropTypes.func,
    previewColor: PropTypes.string,
    showMobileControls: PropTypes.bool,
    strokeWidth: PropTypes.number
};

export default StrokeWidthIndicatorComponent;
