import {getAndroidExtensions} from '../../src/containers/extension-library.jsx';

describe('getAndroidExtensions', () => {
    const extensions = [
        {extensionId: 'translate', internetConnectionRequired: true},
        {extensionId: 'music', internetConnectionRequired: false},
        {extensionId: 'microbit', bluetoothRequired: true, internetConnectionRequired: true}
    ];

    test('marks internet extensions while offline without hiding them', () => {
        const available = getAndroidExtensions(extensions, false);

        expect(available.map(extension => extension.extensionId)).toEqual(['translate', 'music']);
        expect(available[0].internetUnavailable).toBe(true);
        expect(available[1].internetUnavailable).toBe(false);
    });

    test('clears the offline badge when connectivity returns', () => {
        const available = getAndroidExtensions(extensions, true);

        expect(available[0].internetUnavailable).toBe(false);
    });
});
