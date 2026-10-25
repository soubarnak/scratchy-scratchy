import {getFileAccept, isScratchProjectFile, setWidenFileAccept} from '../../../src/lib/file-accept';

describe('file-accept', () => {
    afterEach(() => setWidenFileAccept(false));

    test('widens Android file inputs but validates project extensions afterward', () => {
        setWidenFileAccept(true);

        expect(getFileAccept('.sb,.sb2,.sb3')).toBe('*/*');
        expect(isScratchProjectFile('my-project.sb')).toBe(true);
        expect(isScratchProjectFile('my-project.SB2')).toBe(true);
        expect(isScratchProjectFile('my-project.sb3')).toBe(true);
        expect(isScratchProjectFile('project.sb3.exe')).toBe(false);
        expect(isScratchProjectFile('image.png')).toBe(false);
    });
});
