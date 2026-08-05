// File System Access API types
type FileSystemHandle = {
    kind: 'file' | 'directory';
    name: string;
};

type FileSystemFileHandle = {
    kind: 'file';
    getFile(): Promise<File>;
} & FileSystemHandle;

type FileSystemDirectoryHandle = {
    kind: 'directory';
    values(): AsyncIterable<FileSystemHandle>;
} & FileSystemHandle;

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface Window {
    showOpenFilePicker?: (options?: {
        multiple?: boolean;
        types?: {
            description?: string;
            accept?: Record<string, string[]>;
        }[];
    }) => Promise<FileSystemFileHandle[]>;
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
}

// DataTransferItem extensions
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface DataTransferItem {
    getAsFileSystemHandle?: () => Promise<FileSystemHandle>;
}

// Style imports handled by the bundler
declare module '*.scss';
