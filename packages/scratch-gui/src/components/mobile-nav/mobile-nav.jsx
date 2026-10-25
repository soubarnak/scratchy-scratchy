import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, useIntl} from 'react-intl';

import styles from './mobile-nav.css';

const MOBILE_VIEWS = {
    create: 'create',
    sprites: 'sprites'
};

const messages = defineMessages({
    navLabel: {
        id: 'gui.mobileNav.label',
        defaultMessage: 'Editor sections',
        description: 'accessibility label for the bottom navigation bar on phones'
    },
    create: {
        id: 'gui.mobileNav.create',
        defaultMessage: 'Create',
        description: 'Bottom navigation button for the combined stage and code editor on phones'
    },
    sprites: {
        id: 'gui.mobileNav.sprites',
        defaultMessage: 'Sprites',
        description: 'Bottom navigation button that shows the sprite manager on phones'
    }
});

const ICONS = {
    [MOBILE_VIEWS.create]: (
        <path d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6z" />
    ),
    [MOBILE_VIEWS.sprites]: (
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
            {Object.keys(MOBILE_VIEWS).map(pane => (
                <button
                    aria-current={activePane === pane ? 'page' : null}
                    className={classNames(styles.navButton, {[styles.active]: activePane === pane})}
                    key={pane}
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick={() => onSelectPane(pane)}
                    type="button"
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
    activePane: PropTypes.oneOf(Object.keys(MOBILE_VIEWS)).isRequired,
    onSelectPane: PropTypes.func.isRequired
};

export {MOBILE_VIEWS};
export default MobileNav;
