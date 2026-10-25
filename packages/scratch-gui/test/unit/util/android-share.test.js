import {
    cleanupStaleShareFiles,
    createShareBlobHandler,
    createShareCachePath,
    isShareCancel,
    sanitizeFilename
} from '../../../src/lib/android-share';

describe('Android share cache', () => {
    test('sanitizes names and retains the project extension in a timestamped cache path', () => {
        expect(sanitizeFilename('../My Project.sb3')).toBe('.._My Project.sb3');
        expect(createShareCachePath('My Project.sb3', 1234)).toBe('scratchy-share-1234-My Project.sb3');
        expect(createShareCachePath('///', 1234)).toBe('scratchy-share-1234-Project.sb3');
    });

    test('keeps a shared cache file for deferred receiving apps', async () => {
        const writeBlob = jest.fn().mockResolvedValue('file://project.sb3');
        const share = jest.fn().mockResolvedValue(null);
        const notifyError = jest.fn();
        const handler = createShareBlobHandler({writeBlob, share, notifyError, now: () => 1000});

        await handler('project.sb3', new Blob(['project']));

        expect(writeBlob).toHaveBeenCalledWith('scratchy-share-1000-project.sb3', expect.any(Blob));
        expect(share).toHaveBeenCalledWith({files: ['file://project.sb3']});
        expect(notifyError).not.toHaveBeenCalled();
    });

    test('does not report a user cancellation as a save failure', async () => {
        const notifyError = jest.fn();
        const handler = createShareBlobHandler({
            writeBlob: jest.fn().mockResolvedValue('file://project.sb3'),
            share: jest.fn().mockRejectedValue({code: 'SHARE_CANCELLED'}),
            notifyError
        });

        await handler('project.sb3', new Blob(['project']));

        expect(isShareCancel({message: 'User cancelled'})).toBe(true);
        expect(notifyError).not.toHaveBeenCalled();
    });

    test('reports real save failures', async () => {
        const error = new Error('disk full');
        const notifyError = jest.fn();
        const handler = createShareBlobHandler({
            writeBlob: jest.fn().mockRejectedValue(error),
            share: jest.fn(),
            notifyError,
            now: () => 2000
        });

        await handler('project.sb3', new Blob(['project']));

        expect(notifyError).toHaveBeenCalledWith('scratchy-share-2000-project.sb3', error);
    });

    test('deletes only timestamped share files older than 24 hours', async () => {
        const now = 3 * 24 * 60 * 60 * 1000;
        const readdir = jest.fn().mockResolvedValue({files: [
            {name: 'scratchy-share-1-old.sb3'},
            {name: `scratchy-share-${now - 1000}-recent.sb3`},
            {name: 'other-cache-file.sb3'}
        ]});
        const deleteFile = jest.fn().mockResolvedValue(null);

        const deleted = await cleanupStaleShareFiles({directory: 'CACHE', readdir, deleteFile, now});

        expect(deleted).toEqual(['scratchy-share-1-old.sb3']);
        expect(deleteFile).toHaveBeenCalledWith({path: 'scratchy-share-1-old.sb3', directory: 'CACHE'});
        expect(deleteFile).toHaveBeenCalledTimes(1);
    });
});
