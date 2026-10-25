import React from 'react';
import {defineMessages, FormattedMessage, useIntl} from 'react-intl';
import PropTypes from 'prop-types';

import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import Modal from '../modal/modal.jsx';
import styles from './android-exit-confirmation.css';

const messages = defineMessages({
    title: {
        id: 'gui.androidExit.title',
        defaultMessage: 'Exit Scratch?',
        description: 'Title for the Android unsaved-project exit confirmation'
    },
    message: {
        id: 'gui.androidExit.message',
        defaultMessage: 'You have unsaved changes. Exit anyway?',
        description: 'Warning shown before exiting Scratch with unsaved project changes'
    },
    stay: {
        id: 'gui.androidExit.stay',
        defaultMessage: 'Stay',
        description: 'Cancel leaving Scratch from the Android exit confirmation'
    },
    exit: {
        id: 'gui.androidExit.exit',
        defaultMessage: 'Exit',
        description: 'Confirm leaving Scratch from the Android exit confirmation'
    }
});

const AndroidExitConfirmation = ({isRtl, onCancel, onConfirm}) => {
    const intl = useIntl();
    return (
        <Modal
            className={styles.modal}
            contentLabel={intl.formatMessage(messages.title)}
            isRtl={isRtl}
            onRequestClose={onCancel}
        >
            <Box
                className={styles.content}
                direction="column"
            >
                <p className={styles.message}><FormattedMessage {...messages.message} /></p>
                <div className={styles.buttonRow}>
                    <Button onClick={onCancel}>
                        <FormattedMessage {...messages.stay} />
                    </Button>
                    <Button onClick={onConfirm}>
                        <FormattedMessage {...messages.exit} />
                    </Button>
                </div>
            </Box>
        </Modal>
    );
};

AndroidExitConfirmation.propTypes = {
    isRtl: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired
};

export default AndroidExitConfirmation;
