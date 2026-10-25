// @ts-check
const path = require('path');
const {pathToFileURL} = require('url');
const {defineConfig} = require('@playwright/test');

module.exports = defineConfig({
    testDir: './test/playwright',
    testMatch: 'android-outline.spec.js',
    reporter: 'list',
    use: {
        baseURL: `${pathToFileURL(path.resolve(__dirname, 'build-android'))}/`,
        browserName: 'chromium',
        viewport: {width: 390, height: 844},
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
        launchOptions: {
            args: ['--no-sandbox', '--allow-file-access-from-files']
        }
    }
});
