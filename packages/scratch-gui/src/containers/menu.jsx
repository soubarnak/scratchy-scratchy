import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';

import MenuComponent from '../components/menu/menu.jsx';
import {CLOSE_MENUS_EVENT} from '../lib/close-menus';

class Menu extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'addListeners',
            'removeListeners',
            'handleClick',
            'handleCloseRequest',
            'ref'
        ]);
    }
    componentDidMount () {
        if (this.props.open) this.addListeners();
    }
    componentDidUpdate (prevProps) {
        if (this.props.open && !prevProps.open) this.addListeners();
        if (!this.props.open && prevProps.open) this.removeListeners();
    }
    componentWillUnmount () {
        this.removeListeners();
    }
    addListeners () {
        // The Blockly workspace suppresses compat events like `mouseup`.
        // Listen for `pointerup` instead.
        document.addEventListener('pointerup', this.handleClick);
        document.addEventListener(CLOSE_MENUS_EVENT, this.handleCloseRequest);
    }
    removeListeners () {
        document.removeEventListener('pointerup', this.handleClick);
        document.removeEventListener(CLOSE_MENUS_EVENT, this.handleCloseRequest);
    }
    handleCloseRequest (e) {
        if (!this.props.open) return;
        if (e.detail) e.detail.handled = true;
        this.props.onRequestClose();
    }
    handleClick (e) {
        if (this.props.open && !this.menu.contains(e.target)) {
            this.props.onRequestClose();
        }
    }
    ref (c) {
        this.menu = c;
    }
    render () {
        const {
            open,
            children,
            ...props
        } = this.props;
        if (!open) return null;
        return (
            <MenuComponent
                ref={this.ref}
                {...props}
            >
                {children}
            </MenuComponent>
        );
    }
}

Menu.propTypes = {
    children: PropTypes.node,
    onRequestClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired
};

export default Menu;
