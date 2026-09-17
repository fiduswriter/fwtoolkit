import type JSZip from "jszip";
export interface ZipTextFile {
    filename: string;
    contents: string;
}
export interface ZipBinaryFile {
    url: string;
    filename: string;
    blob?: Blob;
}
export interface ZipIncludeFile {
    url: string;
    directory: string;
    blob?: Blob;
}
/** Creates a zip file.
 * @function zipFileCreator
 * @param textFiles A list of files in plain text format.
 * @param binaryFiles A list fo files that have to be downloaded from the internet before being included.
 * @param includeZips A list of zip files to be merged into the output zip file.
 * @param mimeType The mimetype of the file that is to be created.
 */
export declare class ZipFileCreator {
    textFiles: ZipTextFile[];
    binaryFiles: ZipBinaryFile[];
    zipFiles: ZipIncludeFile[];
    mimeType: string;
    date: Date;
    zipFs: JSZip;
    constructor(textFiles?: ZipTextFile[], binaryFiles?: ZipBinaryFile[], zipFiles?: ZipIncludeFile[], mimeType?: string, date?: Date);
    init(): Promise<Blob>;
    includeZips(): Promise<Blob>;
    createZip(): Promise<Blob>;
    convertDataURIToBlob(dataURI: string): Blob;
}
//# sourceMappingURL=zip.d.ts.map