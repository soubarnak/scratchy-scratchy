import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from '@scratch/scratch-vm';
import {defineMessages, injectIntl} from 'react-intl';
import {connect} from 'react-redux';
import intlShape from '../lib/intlShape.js';

import extensionLibraryContent from '../lib/libraries/extensions/index.jsx';

import {PLATFORM} from '../lib/platform';

import LibraryComponent from '../components/library/library.jsx';
import extensionIcon from '../components/action-menu/icon--sprite.svg';

const messages = defineMessages({
    extensionTitle: {
        defaultMessage: 'Choose an Extension',
        description: 'Heading for the extension library',
        id: 'gui.extensionLibrary.chooseAnExtension'
    },
    extensionUrl: {
        defaultMessage: 'Enter the URL of the extension',
        description: 'Prompt for unoffical extension url',
        id: 'gui.extensionLibrary.extensionUrl'
    }
});

const getAndroidExtensions = (extensions, isOnline) => extensions
    .filter(extension => !extension.bluetoothRequired)
    .map(extension => ({
        ...extension,
        internetUnavailable: !isOnline && Boolean(extension.internetConnectionRequired)
    }));

class ExtensionLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelect',
            'handleOnlineStatusChange'
        ]);
        this.state = {
            isOnline: typeof navigator === 'undefined' || navigator.onLine
        };
    }
    componentDidMount () {
        window.addEventListener('online', this.handleOnlineStatusChange);
        window.addEventListener('offline', this.handleOnlineStatusChange);
    }
    componentWillUnmount () {
        window.removeEventListener('online', this.handleOnlineStatusChange);
        window.removeEventListener('offline', this.handleOnlineStatusChange);
    }
    handleOnlineStatusChange () {
        this.setState({isOnline: navigator.onLine});
    }
    handleItemSelect (item) {
        const id = item.extensionId;
        let url = item.extensionURL ? item.extensionURL : id;
        if (!item.disabled && !id) {
            // eslint-disable-next-line no-alert
            url = prompt(this.props.intl.formatMessage(messages.extensionUrl));
        }
        if (id && !item.disabled) {
            if (this.props.vm.extensionManager.isExtensionLoaded(url)) {
                this.props.onCategorySelected(id);
            } else {
                this.props.vm.extensionManager.loadExtensionURL(url).then(() => {
                    this.props.onCategorySelected(id);
                });
            }
        }
    }
    render () {
        // hardware extensions need Bluetooth/serial, which the Android WebView does not provide
        const extensions = this.props.platform === PLATFORM.ANDROID ?
            getAndroidExtensions(extensionLibraryContent, this.state.isOnline) :
            extensionLibraryContent;
        const extensionLibraryThumbnailData = extensions.map(extension => ({
            rawURL: extension.iconURL || extensionIcon,
            ...extension
        }));
        return (
            <LibraryComponent
                data={extensionLibraryThumbnailData}
                filterable={false}
                id="extensionLibrary"
                title={this.props.intl.formatMessage(messages.extensionTitle)}
                visible={this.props.visible}
                onItemSelected={this.handleItemSelect}
                onRequestClose={this.props.onRequestClose}
            />
        );
    }
}

ExtensionLibrary.propTypes = {
    intl: intlShape.isRequired,
    onCategorySelected: PropTypes.func,
    onRequestClose: PropTypes.func,
    platform: PropTypes.oneOf(Object.keys(PLATFORM)),
    visible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    platform: state.scratchGui.platform.platform
});

export default injectIntl(connect(mapStateToProps)(ExtensionLibrary));
export {getAndroidExtensions};
