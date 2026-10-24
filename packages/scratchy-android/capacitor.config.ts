import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.soubarnak.scratchyscratchy',
    appName: 'Scratchy-Scratchy',
    webDir: '../scratch-gui/build-android',
    android: {
        zoomEnabled: false
    }
};

export default config;
