import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';

import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuItem, MenuSection} from '../menu/menu.jsx';
import ProjectTitleInput from './project-title-input.jsx';
import useMenuNavigation from '../../hooks/use-menu-navigation';
import styles from './menu-bar.css';

const messages = defineMessages({
    more: {
        id: 'gui.mobileOverflow.more',
        defaultMessage: 'More editor options',
        description: 'Accessible name for the compact Android overflow menu'
    },
    tutorials: {
        id: 'gui.mobileOverflow.tutorials',
        defaultMessage: 'Tutorials',
        description: 'Menu item that opens the Scratch tutorials library'
    },
    debug: {
        id: 'gui.mobileOverflow.debug',
        defaultMessage: 'Debug',
        description: 'Menu item that opens the project debug panel'
    },
    editTitle: {
        id: 'gui.mobileOverflow.editTitle',
        defaultMessage: 'Edit project title',
        description: 'Menu item that opens the project title editor'
    },
    titlePrompt: {
        id: 'gui.mobileOverflow.titlePrompt',
        defaultMessage: 'Project title',
        description: 'Accessible label for the project title editor dialog'
    },
    done: {
        id: 'gui.mobileOverflow.done',
        defaultMessage: 'Done',
        description: 'Close the project title editor dialog'
    }
});

const AndroidOverflowMenu = ({canEditTitle, isRtl, onOpenDebugModal, onOpenTipLibrary}) => {
    const intl = useIntl();
    const [isTitlePromptOpen, setIsTitlePromptOpen] = useState(false);
    const {
        menuRef,
        isExpanded,
        handleKeyDown,
        handleKeyDownOpenMenu,
        handleOnOpen,
        handleOnClose
    } = useMenuNavigation({depth: 1, isRtl});

    const closeAfter = handler => (...args) => {
        try {
            return handler && handler(...args);
        } finally {
            handleOnClose();
        }
    };
    const openTitlePrompt = useCallback(() => setIsTitlePromptOpen(true), []);
    const closeTitlePrompt = useCallback(() => setIsTitlePromptOpen(false), []);
    const closeOnBackdrop = useCallback(event => {
        if (event.target === event.currentTarget) closeTitlePrompt();
    }, [closeTitlePrompt]);
    const handleTitleKeyDown = useCallback(event => {
        if (event.key === 'Escape') closeTitlePrompt();
    }, [closeTitlePrompt]);

    return (
        <>
            <button
                aria-expanded={isExpanded()}
                aria-label={intl.formatMessage(messages.more)}
                className={classNames(styles.menuBarItem, styles.androidOverflowButton, {
                    [styles.active]: isExpanded()
                })}
                onClick={handleOnOpen}
                onKeyDown={handleKeyDown}
                ref={menuRef}
                type="button"
            >
                <span aria-hidden="true">⋯</span>
            </button>
            <MenuBarMenu
                className={styles.menuBarMenu}
                open={isExpanded()}
                place={isRtl ? 'left' : 'right'}
                onRequestClose={handleOnClose}
            >
                <MenuSection>
                    <MenuItem
                        onClick={closeAfter(onOpenTipLibrary)}
                        isDataMenuItem
                        onParentKeyDown={handleKeyDownOpenMenu}
                    >
                        {intl.formatMessage(messages.tutorials)}
                    </MenuItem>
                    <MenuItem
                        onClick={closeAfter(onOpenDebugModal)}
                        isDataMenuItem
                        onParentKeyDown={handleKeyDownOpenMenu}
                    >
                        {intl.formatMessage(messages.debug)}
                    </MenuItem>
                    {canEditTitle ? (
                        <MenuItem
                            onClick={closeAfter(openTitlePrompt)}
                            isDataMenuItem
                            onParentKeyDown={handleKeyDownOpenMenu}
                        >
                            {intl.formatMessage(messages.editTitle)}
                        </MenuItem>
                    ) : null}
                </MenuSection>
            </MenuBarMenu>
            {isTitlePromptOpen ? (
                <div
                    className={styles.mobileTitleBackdrop}
                    onClick={closeOnBackdrop}
                >
                    <section
                        aria-label={intl.formatMessage(messages.titlePrompt)}
                        aria-modal="true"
                        className={styles.mobileTitlePrompt}
                        onKeyDown={handleTitleKeyDown}
                        role="dialog"
                    >
                        <label>
                            {intl.formatMessage(messages.titlePrompt)}
                            <ProjectTitleInput
                                autoFocus
                                onTitleSubmit={closeTitlePrompt}
                            />
                        </label>
                        <button
                            className={styles.mobileTitleDone}
                            onClick={closeTitlePrompt}
                            type="button"
                        >
                            {intl.formatMessage(messages.done)}
                        </button>
                    </section>
                </div>
            ) : null}
        </>
    );
};

AndroidOverflowMenu.propTypes = {
    canEditTitle: PropTypes.bool,
    isRtl: PropTypes.bool.isRequired,
    onOpenDebugModal: PropTypes.func.isRequired,
    onOpenTipLibrary: PropTypes.func.isRequired
};

export default AndroidOverflowMenu;
