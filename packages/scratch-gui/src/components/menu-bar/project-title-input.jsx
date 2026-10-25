import classNames from 'classnames';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React, {useCallback} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {setProjectTitle} from '../../reducers/project-title';

import BufferedInputHOC from '../forms/buffered-input-hoc.jsx';
import Input from '../forms/input.jsx';
const BufferedInput = BufferedInputHOC(Input);

import styles from './project-title-input.css';

const messages = defineMessages({
    projectTitlePlaceholder: {
        id: 'gui.gui.projectTitlePlaceholder',
        description: 'Placeholder for project title when blank',
        defaultMessage: 'Project title here'
    }
});

const ProjectTitleInput = ({
    autoFocus,
    className,
    onSubmit,
    onTitleSubmit,
    projectTitle
}) => {
    const intl = useIntl();
    const handleSubmit = useCallback(title => {
        onSubmit(title);
        if (onTitleSubmit) onTitleSubmit();
    }, [onSubmit, onTitleSubmit]);
    return (
        <BufferedInput
            className={classNames(styles.titleField, className)}
            autoFocus={autoFocus}
            maxLength="100"
            placeholder={intl.formatMessage(messages.projectTitlePlaceholder)}
            tabIndex="0"
            type="text"
            value={projectTitle}
            onSubmit={handleSubmit}
        />
    );
};

ProjectTitleInput.propTypes = {
    autoFocus: PropTypes.bool,
    className: PropTypes.string,
    onSubmit: PropTypes.func,
    onTitleSubmit: PropTypes.func,
    projectTitle: PropTypes.string
};

const mapStateToProps = state => ({
    projectTitle: state.scratchGui.projectTitle
});

const mapDispatchToProps = dispatch => ({
    onSubmit: title => dispatch(setProjectTitle(title))
});

export default connect(mapStateToProps, mapDispatchToProps)(ProjectTitleInput);
