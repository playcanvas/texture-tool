import { Panel, Container, Button, TreeView, TreeViewItem, TextInput } from 'pcui';
import { path } from 'playcanvas';
import type { TextureManager } from './texture-manager';
import type { TextureDoc } from './texture-doc';
import type { DropHandler } from './drop-handler';

interface FileSource {
    handle?: FileSystemFileHandle;
    entry?: FileSystemEntry;
    file?: File;
    url?: string;
}

interface DirectorySource {
    handle?: FileSystemDirectoryHandle;
    entry?: FileSystemDirectoryEntry;
}

type NodeType = 'file' | 'directory';

interface TreeViewItemWithNode extends TreeViewItem {
    node: FileNode | DirectoryNode;
}

class FileNode {
    name: string;
    source: FileSource;
    hidden: boolean;
    texture: TextureDoc | null;

    constructor(name: string, source: FileSource) {
        this.name = name;
        this.source = source;
        this.hidden = false;
        this.texture = null;
    }

    get type(): NodeType {
        return 'file';
    }

    async getUrl(): Promise<string> {
        const source = this.source;
        if (source.handle) {
            const file = await source.handle.getFile();
            return URL.createObjectURL(file);
        } else if (source.entry) {
            return new Promise((resolve, reject) => {
                (source.entry as FileSystemFileEntry).file((file: File) => {
                    resolve(URL.createObjectURL(file));
                }, (err: Error) => {
                    reject(err);
                });
            });
        } else if (source.file) {
            return URL.createObjectURL(source.file);
        }
        return source.url!;
    }
}

class DirectoryNode {
    name: string;
    source: DirectorySource | null;
    children: (FileNode | DirectoryNode)[];
    hidden: boolean;

    constructor(name: string, source: DirectorySource | null = null) {
        this.name = name;
        this.source = source;
        this.children = [];
        this.hidden = false;
    }

    add(node: FileNode | DirectoryNode): void {
        this.children.push(node);
    }

    get type(): NodeType {
        return 'directory';
    }

    async mountHandle(handle: FileSystemHandle): Promise<FileNode | DirectoryNode> {
        let result: FileNode | DirectoryNode;
        if (handle.kind === 'file') {
            result = new FileNode(handle.name, {
                handle: handle as FileSystemFileHandle
            });
        } else {
            result = new DirectoryNode(handle.name, {
                handle: handle as FileSystemDirectoryHandle
            });
            for await (const childHandle of (handle as FileSystemDirectoryHandle).values()) {
                await result.mountHandle(childHandle);
            }
        }
        this.add(result);
        return result;
    }

    async mountEntry(entry: FileSystemEntry): Promise<FileNode | DirectoryNode> {
        let result: FileNode | DirectoryNode;
        if (entry.isFile) {
            result = new FileNode(entry.fullPath.substring(1), {
                entry: entry
            });
        } else {
            result = new DirectoryNode(entry.fullPath.substring(1), {
                entry: entry as FileSystemDirectoryEntry
            });

            const reader = (entry as FileSystemDirectoryEntry).createReader();
            const dirResult = result as DirectoryNode;
            await new Promise<void>((resolve) => {
                const recurse = () => {
                    reader.readEntries(async (entries: FileSystemEntry[]) => {
                        if (entries.length) {
                            for (let i = 0; i < entries.length; ++i) {
                                // eslint-disable-next-line no-await-in-loop
                                await dirResult.mountEntry(entries[i]);
                            }
                            recurse();
                        } else {
                            resolve();
                        }
                    });
                };
                recurse();
            });
        }
        this.add(result);
        return result;
    }

    mountFile(filename: string, file: File): void {
        this.add(new FileNode(filename, {
            file: file
        }));
    }

    mountUrl(filename: string, url: string): void {
        this.add(new FileNode(filename, {
            url: url
        }));
    }

    sort(): void {
        this.children.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });

        this.children.forEach((c) => {
            if (c.type === 'directory') {
                (c as DirectoryNode).sort();
            }
        });
    }
}

class FilesBrowserPanel extends Panel {
    textureManager: TextureManager;
    root: DirectoryNode;
    treeView: TreeView;
    textureToElement: Map<TextureDoc, TreeViewItemWithNode> | null;
    nodeToElement: Map<FileNode | DirectoryNode, TreeViewItemWithNode> | null;

    constructor(textureManager: TextureManager, dropHandler: DropHandler, args: Record<string, any> = {}) {
        Object.assign(args, {
            id: 'files-browser',
            headerText: 'TEXTURE TOOL',
            flex: true,
            flexGrow: '1'
        });

        super(args);

        // add logo top left
        const logo = document.createElement('img');
        logo.src = 'playcanvas-logo.png';
        logo.style.height = '32px';
        logo.style.padding = '0px 8px 0px 0px';
        this.header.dom.prepend(logo);

        this.textureManager = textureManager;

        const mountGroup = new Container({
            class: 'files-browser-group',
            flex: true,
            flexDirection: 'row',
            flexGrow: '0',
            flexShrink: '0'
        });

        // files input element
        const filesInputElement = document.createElement('input');
        filesInputElement.type = 'file';
        filesInputElement.multiple = true;
        filesInputElement.onchange = () => {
            const files = Array.from(filesInputElement.files || []);
            files.forEach((f) => {
                this.root.mountFile(f.name, f);
            });
            this.rebuildTreeUI();
        };

        const filesButton = new Button({
            class: 'files-browser-button',
            text: 'Add Files...',
            flexGrow: '1',
            flexShrink: '1',
            width: 50
        });

        // open file picker
        filesButton.on('click', async () => {
            if (window.showOpenFilePicker) {
                const fileHandles = await window.showOpenFilePicker({
                    multiple: true
                });

                const mountPromises = fileHandles.map(handle => this.root.mountHandle(handle));

                Promise.all(mountPromises).then((nodes) => {
                    this.rebuildTreeUI();

                    nodes.forEach((node) => {
                        const ui = this.nodeToElement?.get(node);
                        if (ui) {
                            this.treeView.deselect();
                            ui.selected = true;
                            ui.dom.scrollIntoView();
                        }
                    });
                });
            } else {
                filesInputElement.click();
            }
        });

        // directory input element
        const directoryInputElement = document.createElement('input') as HTMLInputElement & { webkitdirectory: boolean };
        directoryInputElement.type = 'file';
        directoryInputElement.multiple = true;
        directoryInputElement.webkitdirectory = true;
        directoryInputElement.onchange = () => {
            const files = Array.from(directoryInputElement.files || []);
            files.forEach((f) => {
                // split the full path into parts and add to the directory tree
                const pathParts = f.webkitRelativePath.split('/');
                let node: DirectoryNode = this.root;
                for (let i = 0; i < pathParts.length - 1; ++i) {
                    const p = pathParts[i];
                    let child = node.children.find(v => v.name === p);
                    if (!child || child.type !== 'directory') {
                        child = new DirectoryNode(p, null);
                        node.add(child);
                    }
                    node = child as DirectoryNode;
                }
                node.mountFile(f.name, f);
            });
            this.rebuildTreeUI();
        };

        const directoryButton = new Button({
            class: 'files-browser-button',
            text: 'Mount Folder...',
            flexGrow: '1',
            flexShrink: '1',
            width: 50
        });

        directoryButton.on('click', async () => {
            if (window.showDirectoryPicker) {
                await this.root.mountHandle(await window.showDirectoryPicker());
                this.rebuildTreeUI();
            } else {
                directoryInputElement.click();
            }
        });

        mountGroup.append(directoryButton);
        mountGroup.append(filesButton);

        const treeViewContainer = new Container({
            id: 'files-browser-tree-view-container',
            flexGrow: '1',
            flexShrink: '1'
        });

        const treeView = new TreeView({
            id: 'files-browser-tree-view',
            allowDrag: false,
            allowReordering: false,
            allowRenaming: false
        });

        treeView.on('select', (item: TreeViewItemWithNode) => this.onItemSelected(item));

        treeViewContainer.append(treeView);

        // add url entry
        const urlGroup = new Container({
            flex: true,
            flexDirection: 'row',
            flexGrow: '0',
            flexShrink: '0'
        });

        const urlInput = new TextInput({
            placeholder: 'url',
            flexGrow: '1'
        });

        const urlAddButton = new Button({
            id: 'browser-panel-entry-button',
            text: '',
            icon: '\E120',
            flexGrow: '0',
            flexShrink: '0',
            width: 30,
            height: 24
        });

        urlAddButton.on('click', () => {
            const url = urlInput.value;
            if (url.length) {
                this.root.mountUrl(path.getBasename(url).split('?')[0], url);
                this.rebuildTreeUI();
                urlInput.value = '';
            }
        });

        urlGroup.append(urlInput);
        urlGroup.append(urlAddButton);

        this.append(mountGroup);
        this.append(urlGroup);
        this.append(treeViewContainer);

        // handle drag and drop
        dropHandler.on('filesDropped', (fileItems: DataTransferItemList) => {
            const itemPromises: Promise<FileSystemHandle | FileSystemEntry | null>[] = [];
            for (let i = 0; i < fileItems.length; ++i) {
                const item = fileItems[i];
                if (item.getAsFileSystemHandle) {
                    itemPromises.push(item.getAsFileSystemHandle());
                } else if (item.webkitGetAsEntry) {
                    itemPromises.push(Promise.resolve(item.webkitGetAsEntry()));
                }
            }

            Promise.all(itemPromises).then((items) => {
                const nodePromises = items.map((item) => {
                    if (!item) return Promise.resolve(null);
                    return (item as any).kind ? this.root.mountHandle(item as FileSystemHandle) : this.root.mountEntry(item as FileSystemEntry);
                });

                Promise.all(nodePromises).then((nodes) => {
                    this.rebuildTreeUI();

                    // if user dragged in images, select each in turn
                    nodes.forEach((node) => {
                        if (node && node.type === 'file') {
                            const ui = this.nodeToElement?.get(node);
                            if (ui) {
                                this.treeView.deselect();
                                ui.selected = true;
                                ui.dom.scrollIntoView();
                            }
                        }
                    });
                });
            });
        });

        this.textureToElement = null;
        this.nodeToElement = null;
        textureManager.on('textureDocSelected', (texture: TextureDoc) => {
            if (this.textureToElement) {
                const element = this.textureToElement.get(texture);
                if (element) {
                    this.treeView.deselect();
                    element.selected = true;
                    element.dom.scrollIntoView();
                }
            }
        });

        textureManager.on('textureDocRemoved', (texture: TextureDoc) => {
            if (this.textureToElement) {
                const element = this.textureToElement.get(texture);
                if (element && element.node.type === 'file') {
                    (element.node as FileNode).texture = null;
                    this.textureToElement.delete(texture);
                }
            }
        });

        this.root = new DirectoryNode('');
        this.treeView = treeView;
    }

    // called when an item is selected
    async onItemSelected(item: TreeViewItemWithNode): Promise<void> {
        const node = item.node;
        if (node.type === 'file') {
            const fileNode = node as FileNode;
            if (!fileNode.texture) {
                const url = await fileNode.getUrl();
                this.textureManager.addTextureDocByUrl(url, fileNode.name, (err, texture) => {
                    URL.revokeObjectURL(url);
                    if (!err && texture) {
                        fileNode.texture = texture;
                        this.textureManager.selectTextureDoc(texture);
                        this.textureToElement?.set(texture, item);
                    }
                });
            } else {
                this.textureManager.selectTextureDoc(fileNode.texture);
            }
        }
    }

    isImageFilename(filename: string): boolean {
        const extensions = ['.dds', '.png', '.jpg', '.jpeg', '.basis', '.ktx', '.ktx2', '.hdr', '.pvr'];
        for (let i = 0; i < extensions.length; ++i) {
            if (filename.endsWith(extensions[i])) {
                return true;
            }
        }
        return false;
    }

    updateHiddenFlags(): void {
        const recurse = (node: FileNode | DirectoryNode): boolean => {
            let hidden: boolean;
            if (node.type === 'file') {
                hidden = !this.isImageFilename(node.name);
            } else {
                hidden = true;
                const dirNode = node as DirectoryNode;
                for (let i = 0; i < dirNode.children.length; ++i) {
                    hidden = recurse(dirNode.children[i]) && hidden;   // NOTE: don't short-circuit
                }
            }
            node.hidden = hidden;
            return hidden;
        };

        recurse(this.root);
    }

    rebuildTreeUI(): void {
        this.textureToElement = new Map();
        this.nodeToElement = new Map();

        const recurse = (ui: TreeView | TreeViewItem, children: (FileNode | DirectoryNode)[]) => {
            children.forEach((node) => {
                if (!node.hidden) {
                    const treeViewItem = new TreeViewItem({
                        text: node.name,
                        class: node.type === 'file' ? 'files-browser-tree-view-file-item' : 'files-browser-tree-view-directory-item',
                        open: false
                    }) as TreeViewItemWithNode;
                    if ((node as FileNode).texture) {
                        this.textureToElement!.set((node as FileNode).texture!, treeViewItem);
                    }
                    this.nodeToElement!.set(node, treeViewItem);
                    treeViewItem.node = node;
                    ui.append(treeViewItem);
                    if (node.type === 'directory') {
                        recurse(treeViewItem, (node as DirectoryNode).children);
                    }
                }
            });
        };

        // clear previous tree
        this.treeView.clearTreeItems();

        // update hidden flags
        this.updateHiddenFlags();

        // sort nodes
        this.root.sort();

        // build UI tree
        recurse(this.treeView, this.root.children);
    }
}

export {
    FilesBrowserPanel
};
