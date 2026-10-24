import downloadBlob, {setDownloadHandler} from '../../../src/lib/download-blob';

describe('downloadBlob', () => {
    afterEach(() => setDownloadHandler(null));

    test('calls the registered handler instead of the default download', () => {
        const handler = jest.fn();
        const blob = new Blob(['x']);
        setDownloadHandler(handler);
        downloadBlob('a.sb3', blob);
        expect(handler).toHaveBeenCalledWith('a.sb3', blob);
        expect(document.querySelector('a')).toBeNull();
    });

    test('falls back to an anchor download when the handler is cleared', () => {
        window.URL.createObjectURL = jest.fn(() => 'blob:x');
        window.URL.revokeObjectURL = jest.fn();
        const handler = jest.fn();
        setDownloadHandler(handler);
        setDownloadHandler(null);
        downloadBlob('a.sb3', new Blob(['x']));
        expect(handler).not.toHaveBeenCalled();
        expect(document.querySelector('a').download).toBe('a.sb3');
    });
});
