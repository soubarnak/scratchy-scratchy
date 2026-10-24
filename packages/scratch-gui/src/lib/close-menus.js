const CLOSE_MENUS_EVENT = 'scratch-gui:close-menus';

/**
 * Ask every open dropdown menu to close, e.g. from a hardware back button.
 * @returns {boolean} - whether any menu was open and has been asked to close.
 */
const requestCloseMenus = () => {
    const detail = {handled: false};
    document.dispatchEvent(new CustomEvent(CLOSE_MENUS_EVENT, {detail}));
    return detail.handled;
};

export {CLOSE_MENUS_EVENT, requestCloseMenus};
