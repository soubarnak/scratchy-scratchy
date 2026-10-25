const SHARE_CACHE_PREFIX = 'scratchy-share-';
const SHARE_CACHE_RETENTION_MS = 24 * 60 * 60 * 1000;
// eslint-disable-next-line no-control-regex
const UNSAFE_FILENAME_CHARS = /[\\/:*?"<>|\u0000-\u001f\u007f]/g;

const sanitizeFilename = filename => {
    const clean = String(filename || '').replace(UNSAFE_FILENAME_CHARS, '_')
        .trim();
    return clean.replace(/^[._\s]+$/, '') ? clean : 'Project.sb3';
};

const createShareCachePath = (filename, timestamp = Date.now()) => (
    `${SHARE_CACHE_PREFIX}${timestamp}-${sanitizeFilename(filename)}`
);

const isShareCancel = error => Boolean(error && (
    /cancel|abort|dismiss/i.test(String(error.code)) || /cancel/i.test(String(error.message))
));

const createShareBlobHandler = ({writeBlob, share, notifyError, now = Date.now}) => async (filename, blob) => {
    const path = createShareCachePath(filename, now());
    try {
        const uri = await writeBlob(path, blob);
        await share({files: [uri]});
    } catch (error) {
        if (!isShareCancel(error)) notifyError(path, error);
    }
};

const cleanupStaleShareFiles = async ({directory, readdir, deleteFile, now = Date.now()}) => {
    const {files = []} = await readdir({directory});
    const stalePaths = files.reduce((paths, file) => {
        const match = file.name.match(/^scratchy-share-(\d+)-/);
        if (match && now - Number(match[1]) > SHARE_CACHE_RETENTION_MS) paths.push(file.name);
        return paths;
    }, []);
    await Promise.all(stalePaths.map(path => deleteFile({path, directory})));
    return stalePaths;
};

export {
    cleanupStaleShareFiles,
    createShareBlobHandler,
    createShareCachePath,
    isShareCancel,
    sanitizeFilename
};
