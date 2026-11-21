import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import RecordingStepComponent from '../components/record-modal/recording-step.jsx';
import AudioRecorder from '../lib/audio/audio-recorder.js';
import {defineMessages, injectIntl} from 'react-intl';
import intlShape from '../lib/intlShape.js';
import {connect} from 'react-redux';
import {showStandardAlert} from '../reducers/alerts';

const messages = defineMessages({
    alertMsg: {
        defaultMessage: 'Could not start recording',
        description: 'Alert for recording error',
        id: 'gui.recordingStep.alertMsg'
    }
});

class RecordingStep extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleRecord',
            'handleStopRecording',
            'handleStarted',
            'handleLevelUpdate',
            'handleRecordingError'
        ]);

        this.state = {
            listening: false,
            level: 0,
            levels: null
        };
    }
    componentDidMount () {
        this.audioRecorder = new AudioRecorder();
        this.audioRecorder.startListening(this.handleStarted, this.handleLevelUpdate, this.handleRecordingError);
    }
    componentWillUnmount () {
        this.audioRecorder.dispose();
    }
    handleStarted () {
        this.setState({listening: true});
    }
    handleRecordingError () {
        if (this.props.onShowRecordingPermissionError) {
            this.props.onShowRecordingPermissionError();
        }
        alert(this.props.intl.formatMessage(messages.alertMsg)); // eslint-disable-line no-alert
    }
    handleLevelUpdate (level) {
        this.setState({
            level: level,
            levels: this.props.recording ? (this.state.levels || []).concat([level]) : this.state.levels
        });
    }
    handleRecord () {
        this.audioRecorder.startRecording();
        this.props.onRecord();
    }
    handleStopRecording () {
        const {samples, sampleRate, levels, trimStart, trimEnd} = this.audioRecorder.stop();
        this.props.onStopRecording(samples, sampleRate, levels, trimStart, trimEnd);
    }
    render () {
        const {
            intl, // eslint-disable-line no-unused-vars
            onRecord,
            onStopRecording,
            onShowRecordingPermissionError: _onShowRecordingPermissionError,
            ...componentProps
        } = this.props;
        return (
            <RecordingStepComponent
                level={this.state.level}
                levels={this.state.levels}
                listening={this.state.listening}
                onRecord={this.handleRecord}
                onStopRecording={this.handleStopRecording}
                {...componentProps}
            />
        );
    }
}

RecordingStep.propTypes = {
    intl: intlShape.isRequired,
    onShowRecordingPermissionError: PropTypes.func,
    onRecord: PropTypes.func.isRequired,
    onStopRecording: PropTypes.func.isRequired,
    recording: PropTypes.bool
};

const mapDispatchToProps = dispatch => ({
    onShowRecordingPermissionError: () => dispatch(showStandardAlert('recordingPermissionError'))
});

export default injectIntl(connect(null, mapDispatchToProps)(RecordingStep));
