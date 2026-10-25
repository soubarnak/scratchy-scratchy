import PropTypes from 'prop-types';
// The package uses Babel's classic JSX runtime, which requires the React binding.
// eslint-disable-next-line no-unused-vars
import React, {useCallback, useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {defineMessages, useIntl} from 'react-intl';
import Popover from 'react-popover';

import ColorButton from './color-button/color-button.jsx';
import ColorPicker from '../containers/color-picker.jsx';
import StrokeWidthIndicator from '../containers/stroke-width-indicator.jsx';
import InputGroup from './input-group/input-group.jsx';
import Label from './forms/label.jsx';
import GradientTypes from '../lib/gradient-types';
import {isBitmap} from '../lib/format';
import {getMobileColorPreferences} from '../lib/mobile-color-preferences';
import styles from './color-indicator.css';

const noop = () => null;

const QUICK_COLORS = [
    '#000000', '#FFFFFF', '#4C97FF', '#59C059', '#FFAB19', '#FF6680',
    '#9966FF', '#FFBF00', '#0FBD8C', '#0DA2FF', '#FF66B3', '#8A5534'
];

const messages = defineMessages({
    colorSections: {
        id: 'paint.mobileColorSheet.colorSections',
        defaultMessage: 'Choose fill or outline',
        description: 'Accessible label for switching between fill and outline in the mobile color sheet'
    },
    fill: {
        id: 'paint.mobileColorSheet.fill',
        defaultMessage: 'Fill',
        description: 'Fill color section in the mobile paint color sheet'
    },
    outline: {
        id: 'paint.mobileColorSheet.outline',
        defaultMessage: 'Outline',
        description: 'Outline color section in the mobile paint color sheet'
    },
    fillColor: {
        id: 'paint.mobileColorSheet.fillColor',
        defaultMessage: 'Fill color',
        description: 'Accessible name for the fill color dialog'
    },
    outlineColor: {
        id: 'paint.mobileColorSheet.outlineColor',
        defaultMessage: 'Outline color',
        description: 'Accessible name for the outline color dialog'
    },
    apply: {
        id: 'paint.mobileColorSheet.apply',
        defaultMessage: 'Apply',
        description: 'Commit changes and close the mobile color sheet'
    },
    quickColors: {
        id: 'paint.mobileColorSheet.quickColors',
        defaultMessage: 'Quick colors',
        description: 'Label for the quick color swatches in the mobile color sheet'
    },
    recentColors: {
        id: 'paint.mobileColorSheet.recentColors',
        defaultMessage: 'Recent colors',
        description: 'Label for recently used color swatches in the mobile color sheet'
    },
    useColor: {
        id: 'paint.mobileColorSheet.useColor',
        defaultMessage: 'Use color {color}',
        description: 'Accessible label for a color swatch'
    },
    noOutline: {
        id: 'paint.mobileColorSheet.noOutline',
        defaultMessage: 'No outline',
        description: 'Turn off the selected shape outline'
    },
    addOutline: {
        id: 'paint.mobileColorSheet.addOutline',
        defaultMessage: 'Add outline',
        description: 'Turn on a selected shape outline'
    },
    sameAsFill: {
        id: 'paint.mobileColorSheet.sameAsFill',
        defaultMessage: 'Same as fill — the outline may not be visible',
        description: 'Warning when an outline color matches its fill color'
    },
    advanced: {
        id: 'paint.mobileColorSheet.advanced',
        defaultMessage: 'Advanced color controls',
        description: 'Disclosure label for detailed color and gradient controls'
    },
    disabledHelp: {
        id: 'paint.mobileColorSheet.disabledHelp',
        defaultMessage: 'Outline borders vector shapes. Switch to Select to edit a shape outline.',
        description: 'Explain why Outline is unavailable in the current paint tool'
    },
    bitmapHelp: {
        id: 'paint.mobileColorSheet.bitmapHelp',
        defaultMessage: 'Outline editing is available for vector costumes.',
        description: 'Explain why Outline is unavailable for a bitmap costume'
    },
    switchToSelect: {
        id: 'paint.mobileColorSheet.switchToSelect',
        defaultMessage: 'Switch to Select tool',
        description: 'Switch to the Select tool from the Outline help sheet'
    },
    convertToVector: {
        id: 'paint.mobileColorSheet.convertToVector',
        defaultMessage: 'Convert to vector',
        description: 'Convert a bitmap costume to vector format from the Outline help sheet'
    }
});

const MobileColorSheet = props => {
    const intl = useIntl();
    const touchStartY = useRef(null);
    const [selectedSection, setSelectedSection] = useState(props.outline ? 'outline' : 'fill');
    const preferences = getMobileColorPreferences(props.projectId);
    const recentColors = preferences.recentColors;
    const colors = recentColors.length ? recentColors : QUICK_COLORS;
    const bitmapOutlineHelp = !props.outline && isBitmap(props.format) && selectedSection === 'outline';
    const outlineHelp = selectedSection === 'outline' &&
        (bitmapOutlineHelp || (props.outline && props.disabled));
    const dialogLabel = selectedSection === 'outline' ? messages.outlineColor : messages.fillColor;

    const selectFill = useCallback(() => {
        if (props.outline && props.onSwitchToOtherColor) {
            props.onSwitchToOtherColor();
        } else {
            setSelectedSection('fill');
        }
    }, [props.outline, props.onSwitchToOtherColor]);
    const selectOutline = useCallback(() => {
        if (isBitmap(props.format)) {
            setSelectedSection('outline');
        } else if (!props.outline && props.onSwitchToOtherColor) {
            props.onSwitchToOtherColor();
        } else {
            setSelectedSection('outline');
        }
    }, [props.format, props.outline, props.onSwitchToOtherColor]);
    const closeOnBackdrop = useCallback(event => {
        if (event.target === event.currentTarget) props.onCloseColor();
    }, [props.onCloseColor]);
    const closeOnEscape = useCallback(event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        props.onCloseColor();
    }, [props.onCloseColor]);
    useEffect(() => {
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [closeOnEscape]);
    const startSheetDismiss = useCallback(event => {
        touchStartY.current = event.touches[0].clientY;
    }, []);
    const finishSheetDismiss = useCallback(event => {
        const touchEndY = event.changedTouches[0].clientY;
        if (touchStartY.current !== null && touchEndY - touchStartY.current > 60) {
            props.onCloseColor();
        }
        touchStartY.current = null;
    }, [props.onCloseColor]);
    const switchToVector = useCallback(() => {
        props.onCloseColor();
        props.onSwitchToVector();
    }, [props.onCloseColor, props.onSwitchToVector]);
    const toggleOutline = useCallback(() => {
        if (props.color !== null && props.strokeWidth > 0) {
            props.onDisableOutline();
        } else {
            props.onEnableOutline();
        }
    }, [props.color, props.strokeWidth, props.onDisableOutline, props.onEnableOutline]);
    const selectColor = useCallback(
        event => props.onChangeColor(event.currentTarget.dataset.color),
        [props.onChangeColor]
    );
    const clearOutline = useCallback(() => props.onDisableOutline(), [props.onDisableOutline]);

    if (typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <div
            className={styles.mobileColorBackdrop}
            onClick={closeOnBackdrop}
        >
            <section
                aria-label={intl.formatMessage(dialogLabel)}
                aria-modal="true"
                className={styles.mobileColorSheet}
                role="dialog"
            >
                <div
                    aria-hidden="true"
                    className={styles.mobileColorHandle}
                    onTouchEnd={finishSheetDismiss}
                    onTouchStart={startSheetDismiss}
                />
                <header className={styles.mobileColorHeader}>
                    <div
                        aria-label={intl.formatMessage(messages.colorSections)}
                        className={styles.mobileColorSegments}
                        role="group"
                    >
                        <button
                            aria-pressed={selectedSection === 'fill'}
                            className={selectedSection === 'fill' ? styles.segmentSelected : styles.segment}
                            onClick={selectFill}
                            type="button"
                        >
                            {intl.formatMessage(messages.fill)}
                        </button>
                        <button
                            aria-pressed={selectedSection === 'outline'}
                            className={selectedSection === 'outline' ? styles.segmentSelected : styles.segment}
                            onClick={selectOutline}
                            type="button"
                        >
                            {intl.formatMessage(messages.outline)}
                        </button>
                    </div>
                    <button
                        aria-label={intl.formatMessage(messages.apply)}
                        className={styles.doneButton}
                        onClick={props.onCloseColor}
                        type="button"
                    >
                        {intl.formatMessage(messages.apply)}
                    </button>
                </header>
                {outlineHelp ? (
                    <div className={styles.mobileColorHelp}>
                        <p>{intl.formatMessage(bitmapOutlineHelp ? messages.bitmapHelp : messages.disabledHelp)}</p>
                        {bitmapOutlineHelp ? (
                            <button
                                className={styles.actionButton}
                                onClick={switchToVector}
                                type="button"
                            >
                                {intl.formatMessage(messages.convertToVector)}
                            </button>
                        ) : (
                            <button
                                className={styles.actionButton}
                                onClick={props.onSwitchToSelect}
                                type="button"
                            >
                                {intl.formatMessage(messages.switchToSelect)}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={styles.mobileColorContent}>
                        {selectedSection === 'outline' && props.outline ? (
                            <>
                                <button
                                    aria-pressed={props.color !== null && props.strokeWidth > 0}
                                    className={styles.outlineToggle}
                                    onClick={toggleOutline}
                                    type="button"
                                >
                                    {intl.formatMessage(props.color !== null && props.strokeWidth > 0 ?
                                        messages.noOutline : messages.addOutline)}
                                </button>
                                <StrokeWidthIndicator
                                    deferUpdateImage
                                    onMobileWidthChange={props.onMobileWidthChange}
                                    onSetNoOutline={clearOutline}
                                    previewColor={props.color}
                                    projectId={props.projectId}
                                    showMobileControls
                                    onUpdateImage={props.onUpdateImage}
                                />
                                {props.sameAsFill ? (
                                    <p className={styles.sameAsFill}>{intl.formatMessage(messages.sameAsFill)}</p>
                                ) : null}
                            </>
                        ) : null}
                        <div
                            aria-label={intl.formatMessage(recentColors.length ?
                                messages.recentColors : messages.quickColors)}
                            className={styles.mobileColorSwatches}
                            role="group"
                        >
                            {colors.map(color => (
                                <button
                                    aria-label={intl.formatMessage(messages.useColor, {color})}
                                    aria-pressed={props.color === color}
                                    className={styles.mobileColorSwatch}
                                    key={color}
                                    style={{backgroundColor: color}}
                                    data-color={color}
                                    onClick={selectColor}
                                    type="button"
                                />
                            ))}
                        </div>
                        <details className={styles.advancedColorControls}>
                            <summary>{intl.formatMessage(messages.advanced)}</summary>
                            <ColorPicker
                                color={props.color}
                                color2={props.color2}
                                largeTouchTarget
                                key={`${props.colorIndex}/${props.color}/${props.color2}`}
                                gradientType={props.gradientType}
                                shouldShowGradientTools={props.shouldShowGradientTools}
                                onChangeColor={props.onChangeColor}
                                onChangeGradientType={props.onChangeGradientType}
                                onSwap={props.onSwap}
                            />
                        </details>
                    </div>
                )}
            </section>
        </div>,
        document.body
    );
};

MobileColorSheet.propTypes = {
    color: PropTypes.string,
    color2: PropTypes.string,
    disabled: PropTypes.bool.isRequired,
    format: PropTypes.string,
    gradientType: PropTypes.oneOf(Object.keys(GradientTypes)).isRequired,
    colorIndex: PropTypes.number.isRequired,
    onChangeColor: PropTypes.func.isRequired,
    onChangeGradientType: PropTypes.func.isRequired,
    onCloseColor: PropTypes.func.isRequired,
    onEnableOutline: PropTypes.func,
    onDisableOutline: PropTypes.func,
    onMobileWidthChange: PropTypes.func,
    onSwitchToOtherColor: PropTypes.func,
    onSwitchToSelect: PropTypes.func,
    onSwitchToVector: PropTypes.func,
    onSwap: PropTypes.func.isRequired,
    onUpdateImage: PropTypes.func.isRequired,
    outline: PropTypes.bool.isRequired,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    sameAsFill: PropTypes.bool,
    shouldShowGradientTools: PropTypes.bool.isRequired,
    strokeWidth: PropTypes.number
};

const ColorIndicatorComponent = props => {
    const intl = useIntl();
    if (props.isCompactAndroid) {
        return (
            <>
                <div className={styles.mobileColorIndicator}>
                    <button
                        aria-expanded={props.colorModalVisible}
                        aria-haspopup="dialog"
                        aria-label={props.outline ? intl.formatMessage(messages.outlineColor) :
                            intl.formatMessage(messages.fillColor)}
                        className={styles.mobileColorTrigger}
                        disabled={props.disabled && !props.outline}
                        onClick={props.onOpenColor}
                        type="button"
                    >
                        <ColorButton
                            color={props.color}
                            color2={props.color2}
                            gradientType={props.gradientType}
                            outline={props.outline}
                            onClick={noop}
                        />
                    </button>
                    <span className={styles.mobileColorLabel}>{props.label}</span>
                </div>
                {props.colorModalVisible ? <MobileColorSheet {...props} /> : null}
            </>
        );
    }

    return (
        <InputGroup
            className={props.className}
            disabled={props.disabled}
        >
            <Popover
                body={
                    <ColorPicker
                        color={props.color}
                        color2={props.color2}
                        gradientType={props.gradientType}
                        shouldShowGradientTools={props.shouldShowGradientTools}
                        onChangeColor={props.onChangeColor}
                        onChangeGradientType={props.onChangeGradientType}
                        onSwap={props.onSwap}
                    />
                }
                isOpen={props.colorModalVisible}
                preferPlace="below"
                onOuterAction={props.onCloseColor}
            >
                <Label text={props.label}>
                    <ColorButton
                        color={props.color}
                        color2={props.color2}
                        gradientType={props.gradientType}
                        onClick={props.onOpenColor}
                        outline={props.outline}
                    />
                </Label>
            </Popover>
        </InputGroup>
    );
};

ColorIndicatorComponent.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string,
    color2: PropTypes.string,
    colorModalVisible: PropTypes.bool.isRequired,
    disabled: PropTypes.bool.isRequired,
    fillColor: PropTypes.string,
    format: PropTypes.string,
    gradientType: PropTypes.oneOf(Object.keys(GradientTypes)).isRequired,
    isCompactAndroid: PropTypes.bool,
    label: PropTypes.string.isRequired,
    onChangeColor: PropTypes.func.isRequired,
    onChangeGradientType: PropTypes.func.isRequired,
    onCloseColor: PropTypes.func.isRequired,
    onEnableOutline: PropTypes.func,
    onDisableOutline: PropTypes.func,
    onOpenColor: PropTypes.func.isRequired,
    onSwitchToOtherColor: PropTypes.func,
    onSwitchToSelect: PropTypes.func,
    onSwitchToVector: PropTypes.func,
    onSwap: PropTypes.func.isRequired,
    onUpdateImage: PropTypes.func.isRequired,
    outline: PropTypes.bool.isRequired,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    sameAsFill: PropTypes.bool,
    shouldShowGradientTools: PropTypes.bool.isRequired,
    strokeWidth: PropTypes.number
};

export default ColorIndicatorComponent;
