import {costumeUpload, soundUpload, spriteUpload} from '../../../src/lib/file-uploader';

describe('unsupported asset uploads', () => {
    test.each([
        ['costume', onError => costumeUpload(new ArrayBuffer(0), 'text/plain', {}, jest.fn(), onError)],
        ['sound', onError => soundUpload(new ArrayBuffer(0), 'text/plain', {}, jest.fn(), onError)],
        ['sprite', onError => spriteUpload(new ArrayBuffer(0), 'text/plain', 'file', {}, jest.fn(), onError)]
    ])('%s uploads report an unsupported file type', (kind, upload) => {
        const onError = jest.fn();

        upload(onError);

        expect(onError).toHaveBeenCalledWith(expect.stringMatching(/unexpected file type/i));
    });
});
