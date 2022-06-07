import { Panel, Container, Button, TreeView, TreeViewItem, TextInput } from '@playcanvas/pcui';

class FileNode {
    constructor(name, source) {
        this.name = name;
        this.source = source;
        this.hidden = false;
        this.texture = null;
    }

    get type() {
        return 'file';
    }

    async getUrl() {
        const source = this.source;
        if (source.handle) {
            const file = await source.handle.getFile();
            return URL.createObjectURL(file);
        } else if (source.entry) {
            return new Promise((resolve, reject) => {
                source.entry.file((file) => {
                    resolve(URL.createObjectURL(file));
                }, (err) => {
                    reject(err);
                });
            });
        } else if (source.file) {
            return URL.createObjectURL(source.file);
        } else {
            return source.url;
        }
    }
}

class DirectoryNode {
    constructor(name, source) {
        this.name = name;
        this.source = source;
        this.children = [];
        this.hidden = false;
    }

    add(node) {
        this.children.push(node);
    }

    get type() {
        return 'directory';
    }

    async mountHandle(handle) {
        if (handle.kind === 'file') {
            this.add(new FileNode(handle.name, {
                handle: handle
            }));
        } else if (handle.kind === 'directory') {
            const directory = new DirectoryNode(handle.name, {
                handle: handle
            });
            for await (const childHandle of handle.values()) {
                await directory.mountHandle(childHandle);
            }
            this.add(directory);
        }
    }

    async mountEntry(entry) {
        console.log(`processing ${entry.fullPath}...`);

        if (entry.isFile) {
            this.add(new FileNode(entry.fullPath.substring(1), {
                entry: entry
            }));
        } else if (entry.isDirectory) {
            const directory = new DirectoryNode(entry.fullPath.substring(1), {
                entry: entry
            });

            const reader = entry.createReader();
            await new Promise((resolve, reject) => {
                const recurse = () => {
                    reader.readEntries(async (entries) => {
                        if (entries.length) {
                            for (let i = 0; i < entries.length; ++i) {
                                await directory.mountEntry(entries[i]);
                            }
                            recurse();
                        } else {
                            resolve();
                        }
                    });
                };
                recurse();
            });

            this.add(directory);
        }
    }

    mountFile(filename, file) {
        this.add(new FileNode(filename, {
            file: file
        }));
    }

    mountUrl(filename, url) {
        this.add(new FileNode(filename, {
            url: url
        }));
    }

    sort() {
        this.children.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            } else {
                return a.name.localeCompare(b.name);
            }
        });

        this.children.forEach((c) => {
            if (c.type === 'directory') {
                c.sort();
            }
        })
    }
}

class FilesBrowserPanel extends Panel {
    constructor(textureManager, dropHandler, args = {}) {
        Object.assign(args, {
            id: 'files-browser',
            headerText: 'Local Files',
            flex: true,
            flexGrow: 1
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
            flexGrow: 0,
            flexShrink: 0
        });

        // files input element
        const filesInputElement = document.createElement('input');
        filesInputElement.type = 'file';
        filesInputElement.multiple = true;
        filesInputElement.onchange = (e) => {
            const files = Array.from(filesInputElement.files);
            files.forEach((f) => {
                this.root.mountFile(f.name, f);
            });
            this.rebuildTreeUI();
        };

        const filesButton = new Button({
            class: 'files-browser-button',
            text: 'Add Files...',
            flexGrow: 1,
            flexShrink: 1,
            width: 50
        });

        filesButton.on('click', async () => {
            if (window.showOpenFilePicker) {
                // open file picker
                const fileHandles = await window.showOpenFilePicker({
                    multiple: true
                });

                for (let i = 0; i < fileHandles.length; ++i) {
                    await this.root.mountHandle(fileHandles[i]);
                }
                this.rebuildTreeUI();
            } else {
                filesInputElement.click();
            }
        });

        // directory input element
        const directoryInputElement = document.createElement('input');
        directoryInputElement.type = 'file';
        directoryInputElement.multiple = true;
        directoryInputElement.webkitdirectory = true;
        directoryInputElement.onchange = (e) => {
            const files = Array.from(directoryInputElement.files);
            files.forEach((f) => {
                // split the full path into parts and add to the directory tree
                const path = f.webkitRelativePath.split('/');
                let node = this.root;
                for (let i = 0; i < path.length - 1; ++i) {
                    const p = path[i];
                    let child = node.children.find((v) => v.name === p);
                    if (!child || child.type !== 'directory') {
                        child = new DirectoryNode(p, null);
                        node.add(child);
                    }
                    node = child;
                }
                node.mountFile(f.name, f);
            });
            this.rebuildTreeUI();
        };

        const directoryButton = new Button({
            class: 'files-browser-button',
            text: 'Mount Folder...',
            flexGrow: 1,
            flexShrink: 1,
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
            flexGrow: 1,
            flexShrink: 1
        });

        const treeView = new TreeView({
            id: 'files-browser-tree-view',
            allowDrag: false,
            allowReordering: false,
            allowRenaming: false
        });

        treeView.on('select', (item) => this.onItemSelected(item));

        treeViewContainer.append(treeView);

        // add url entry
        const urlGroup = new Container({
            flex: true,
            flexDirection: 'row',
            flexGrow: 0,
            flexShrink: 0
        });

        const urlInput = new TextInput({
            placeholder: 'url',
            flexGrow: 1
        });

        const urlAddButton = new Button({
            id: 'browser-panel-entry-button',
            text: '',
            icon: '\E120',
            flexGrow: 0,
            flexShrink: 0,
            width: 30,
            height: 24
        });

        urlAddButton.on('click', () => {
            const url = urlInput.value;
            if (url.length) {
                this.root.mountUrl(url, url);
                this.rebuildTreeUI();
                urlInput.value = '';
            }
        });

        urlGroup.append(urlInput);
        urlGroup.append(urlAddButton);

        this.append(mountGroup);
        this.append(treeViewContainer);
        this.append(urlGroup);

        // hook up drop handler
        dropHandler.on('filesDropped', async (fileItems) => {
            for (let i = 0; i < fileItems.length; ++i) {
                const item = fileItems[i];

                if (item.getAsFileSystemHandle) {
                    await this.root.mountHandle(await item.getAsFileSystemHandle());
                } else if (item.webkitGetAsEntry) {
                    await this.root.mountEntry(await item.webkitGetAsEntry());
                }
            }
            this.rebuildTreeUI();
        });

        this.textureToElement = null;
        textureManager.on('textureSelected', (texture) => {
            if (this.textureToElement) {
                const element = this.textureToElement.get(texture);
                if (element) {
                    this.treeView.deselect();
                    element.selected = true;
                    element.dom.scrollIntoView();
                }
            }
        });

        textureManager.on('textureRemoved', (texture) => {
            if (this.textureToElement) {
                const element = this.textureToElement.get(texture);
                if (element) {
                    element.node.texture = null;
                    this.textureToElement.delete(texture);
                }
            }
        });

        this.root = new DirectoryNode('');
        this.treeView = treeView;
    }

    // called when an item is selected
    async onItemSelected(item) {
        const node = item.node;
        if (node.type === 'file') {
            if (!node.texture) {
                const url = await node.getUrl();
                this.textureManager.addTexture(url, node.name, (err, texture) => {
                    URL.revokeObjectURL(url);
                    if (!err) {
                        node.texture = texture;
                        this.textureManager.selectTexture(texture);
                        this.textureToElement.set(texture, item);
                    }
                });
            } else {
                this.textureManager.selectTexture(node.texture);
            }
        }
    }

    isImageFilename(filename) {
        const extensions = ['.dds', '.png', '.jpg', '.basis', '.ktx', '.ktx2', '.hdr'];
        for (let i = 0; i < extensions.length; ++i) {
            if (filename.endsWith(extensions[i])) {
                return true;
            }
        }
        return false;
    }

    updateHiddenFlags() {
        const recurse = (node) => {
            let hidden;
            if (node.type === 'file') {
                hidden = !this.isImageFilename(node.name);
            } else {
                hidden = true;
                for (let i = 0; i < node.children.length; ++i) {
                    hidden = recurse(node.children[i]) && hidden;   // NOTE: don't short-circuit
                }
            }
            node.hidden = hidden;
            return hidden;
        }

        recurse(this.root);
    }

    rebuildTreeUI() {
        this.textureToElement = new Map();

        const recurse = (ui, children) => {
                children.forEach(c => {
                if (!c.hidden) {
                    const treeViewItem = new TreeViewItem({
                        text: c.name,
                        class: c.type === 'file' ? 'files-browser-tree-view-file-item' : 'files-browser-tree-view-directory-item',
                        open: false
                    });
                    if (c.texture) {
                        this.textureToElement.set(c.texture, treeViewItem);
                    }
                    treeViewItem.node = c;
                    ui.append(treeViewItem);
                    if (c.type === 'directory') {
                        recurse(treeViewItem, c.children);
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
