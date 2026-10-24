import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, useIntl} from 'react-intl';

import styles from './mobile-nav.css';

const MOBILE_PANES = {
    code: 'code',
    stage: 'stage',
    sprites: 'sprites'
};

const messages = defineMessages({
    navLabel: {
        id: 'gui.mobileNav.label',
        defaultMessage: 'Editor sections',
        description: 'accessibility label for the bottom navigation bar on phones'
    },
    code: {
        id: 'gui.mobileNav.code',
        defaultMessage: 'Code',
        description: 'Bottom navigation button that shows the code editor on phones'
    },
    stage: {
        id: 'gui.mobileNav.stage',
        defaultMessage: 'Stage',
        description: 'Bottom navigation button that shows the stage on phones'
    },
    sprites: {
        id: 'gui.mobileNav.sprites',
        defaultMessage: 'Sprites',
        description: 'Bottom navigation button that shows the sprite list on phones'
    }
});

const ICONS = {
    [MOBILE_PANES.code]: (
        <path d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6z" />
    ),
    [MOBILE_PANES.stage]: (
        <path d="M21 3H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5v2h8v-2h5a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 14H3V5h18z" />
    ),
    [MOBILE_PANES.sprites]: (
        <path d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z" />
    )
};

const MobileNav = ({activePane, onSelectPane}) => {
    const intl = useIntl();
    return (
        <nav
            aria-label={intl.formatMessage(messages.navLabel)}
            className={styles.mobileNav}
        >
            {Object.keys(MOBILE_PANES).map(pane => (
                <button
                    aria-current={activePane === pane ? 'page' : null}
                    className={classNames(styles.navButton, {[styles.active]: activePane === pane})}
                    key={pane}
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick={() => onSelectPane(pane)}
                >
                    <svg
                        aria-hidden="true"
                        className={styles.navIcon}
                        viewBox="0 0 24 24"
                    >
                        {ICONS[pane]}
                    </svg>
                    <span className={styles.navLabel}>{intl.formatMessage(messages[pane])}</span>
                </button>
            ))}
        </nav>
    );
};

MobileNav.propTypes = {
    activePane: PropTypes.oneOf(Object.keys(MOBILE_PANES)).isRequired,
    onSelectPane: PropTypes.func.isRequired
};

export {MOBILE_PANES};
export default MobileNav;
