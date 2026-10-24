import {LegacyStorage} from '../../../src/lib/legacy-storage';
import {setLibraryAssetBase} from '../../../src/lib/legacy-library-asset-url';

describe('LegacyStorage asset sources', () => {
    afterEach(() => setLibraryAssetBase(''));

    const asset = {assetId: 'abc', dataFormat: 'svg'};

    test('local store is skipped without a library asset base', () => {
        const storage = new LegacyStorage();
        expect(storage.getLocalAssetGetConfig(asset)).toBeNull();
    });

    test('local store serves bundled assets, remote store still targets the asset host', () => {
        const storage = new LegacyStorage();
        storage.setAssetHost('https://assets.example');
        setLibraryAssetBase('http://localhost/library-assets/');
        expect(storage.getLocalAssetGetConfig(asset)).toBe('http://localhost/library-assets/abc.svg');
        expect(storage.getAssetGetConfig(asset)).toBe('https://assets.example/internalapi/asset/abc.svg/get/');
    });
});
