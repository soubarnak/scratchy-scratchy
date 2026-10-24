import {buildLibraryAssetUrl, setLibraryAssetBase} from '../../../src/lib/legacy-library-asset-url';

describe('buildLibraryAssetUrl', () => {
    afterEach(() => setLibraryAssetBase(''));

    test('defaults to the Scratch CDN', () => {
        expect(buildLibraryAssetUrl('abc', 'svg'))
            .toBe('https://cdn.assets.scratch.mit.edu/internalapi/asset/abc.svg/get/');
    });

    test('uses the configured base path', () => {
        setLibraryAssetBase('./library-assets/');
        expect(buildLibraryAssetUrl('abc', 'svg')).toBe('./library-assets/abc.svg');
    });
});
