import VideoProvider from '../../../src/lib/video/video-provider';

describe('VideoProvider error callback', () => {
    test('forwards a media permission failure to the GUI callback', () => {
        const onError = jest.fn();
        const provider = new VideoProvider(onError);
        const error = new Error('Permission denied');

        provider.onError(error);

        expect(onError).toHaveBeenCalledWith(error);
    });
});
