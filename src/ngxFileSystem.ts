/**
 * Copyright 2021 F5 Networks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

import {
    Uri,
    Disposable,
    Event,
    EventEmitter,
    FileChangeEvent,
    FileChangeType,
    FileStat,
    FileSystemError,
    FileSystemProvider,
    FileType,
    commands,
} from 'vscode';

import path from 'path';

export class File implements FileStat {

    type: FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    id?: string | undefined;
    data?: Uint8Array;

    constructor(name: string) {
        this.type = FileType.File;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
    }
}

export class Directory implements FileStat {

    type: FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    entries: Map<string, File | Directory>;

    constructor(name: string) {
        this.type = FileType.Directory;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
        this.entries = new Map();
    }
}


export type Entry = File | Directory;

export class FsProvider implements FileSystemProvider {
    root = new Directory('');

    // --- manage file metadata

    stat(uri: Uri): FileStat {
        return this.lookup(uri, false);
    }

    readDirectory(uri: Uri): [string, FileType][] {
        const entry = this._lookupAsDirectory(uri, false);
        const result: [string, FileType][] = [];
        for (const [name, child] of entry.entries) {
            result.push([name, child.type]);
        }
        return result;
    }

    // --- manage file contents

    readFile(uri: Uri): Uint8Array {
        const data = this._lookupAsFile(uri, false).data;
        if (data) {
            return data;
        }
        throw FileSystemError.FileNotFound();
    }

    writeFile(uri: Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }): void {
        const basename = path.posix.basename(uri.path);
        const parent = this.lookupParentDirectory(uri);

        // function to post updated doc back to nim
        const stat = this.stat(uri);
        commands.executeCommand('nginx.postConfigFile', uri, content, stat);
        
        let entry = parent.entries.get(basename);
        if (entry instanceof Directory) {
            throw FileSystemError.FileIsADirectory(uri);
        }
        if (!entry && !options.create) {
            throw FileSystemError.FileNotFound(uri);
        }
        if (entry && options.create && !options.overwrite) {
            throw FileSystemError.FileExists(uri);
        }
        if (!entry) {
            entry = new File(basename);
            parent.entries.set(basename, entry);
            this.fireSoon({ type: FileChangeType.Created, uri });
        }
        entry.mtime = Date.now();
        entry.size = content.byteLength;
        entry.data = content;

        this.fireSoon({ type: FileChangeType.Changed, uri });
    }

    // --- manage files/folders

    rename(oldUri: Uri, newUri: Uri, options: { overwrite: boolean }): void {

        if (!options.overwrite && this.lookup(newUri, true)) {
            throw FileSystemError.FileExists(newUri);
        }

        const entry = this.lookup(oldUri, false);
        const oldParent = this.lookupParentDirectory(oldUri);

        const newParent = this.lookupParentDirectory(newUri);
        const newName = path.posix.basename(newUri.path);

        oldParent.entries.delete(entry.name);
        entry.name = newName;
        newParent.entries.set(newName, entry);

        this.fireSoon(
            { type: FileChangeType.Deleted, uri: oldUri },
            { type: FileChangeType.Created, uri: newUri }
        );
    }

    delete(uri: Uri): void {
        const dirname = uri.with({ path: path.posix.dirname(uri.path) });
        const basename = path.posix.basename(uri.path);
        const parent = this._lookupAsDirectory(dirname, false);
        if (!parent.entries.has(basename)) {
            throw FileSystemError.FileNotFound(uri);
        }
        parent.entries.delete(basename);
        parent.mtime = Date.now();
        parent.size -= 1;
        this.fireSoon({ type: FileChangeType.Changed, uri: dirname }, { uri, type: FileChangeType.Deleted });
    }

    createDirectory(uri: Uri): void {
        const basename = path.posix.basename(uri.path);
        const dirname = uri.with({ path: path.posix.dirname(uri.path) });
        const parent = this._lookupAsDirectory(dirname, false);

        const entry = new Directory(basename);
        parent.entries.set(entry.name, entry);
        parent.mtime = Date.now();
        parent.size += 1;
        this.fireSoon({ type: FileChangeType.Changed, uri: dirname }, { type: FileChangeType.Created, uri });
    }

    // --- lookup

    lookup(uri: Uri, silent: false): Entry;
    lookup(uri: Uri, silent: boolean): Entry | undefined;
    lookup(uri: Uri, silent: boolean): Entry | undefined {
        const parts = uri.path.split('/');
        let entry: Entry = this.root;
        for (const part of parts) {
            if (!part) {
                continue;
            }
            let child: Entry | undefined;
            if (entry instanceof Directory) {
                child = entry.entries.get(part);
            }
            if (!child) {
                if (!silent) {
                    throw FileSystemError.FileNotFound(uri);
                } else {
                    return undefined;
                }
            }
            entry = child;
        }
        return entry;
    }

    private _lookupAsDirectory(uri: Uri, silent: boolean): Directory {
        const entry = this.lookup(uri, silent);
        if (entry instanceof Directory) {
            return entry;
        }
        throw FileSystemError.FileNotADirectory(uri);
    }

    private _lookupAsFile(uri: Uri, silent: boolean): File {
        const entry = this.lookup(uri, silent);
        if (entry instanceof File) {
            return entry;
        }
        throw FileSystemError.FileIsADirectory(uri);
    }

    lookupParentDirectory(uri: Uri): Directory {
        const dirname = uri.with({ path: path.posix.dirname(uri.path) });
        return this._lookupAsDirectory(dirname, false);
    }

    // --- manage file events

    private _emitter = new EventEmitter<FileChangeEvent[]>();
    private _bufferedEvents: FileChangeEvent[] = [];
    private _fireSoonHandle?: NodeJS.Timer;

    readonly onDidChangeFile: Event<FileChangeEvent[]> = this._emitter.event;

    watch(_resource: Uri): Disposable {
        // ignore, fires for all changes...
        return new Disposable(() => { });
    }

    fireSoon(...events: FileChangeEvent[]): void {
        this._bufferedEvents.push(...events);

        if (this._fireSoonHandle) {
            clearTimeout(this._fireSoonHandle);
        }

        this._fireSoonHandle = setTimeout(() => {
            this._emitter.fire(this._bufferedEvents);
            this._bufferedEvents.length = 0;
        }, 5);
    }
}

export class NgxFsProvider extends FsProvider {
    
    loadFile(uri: Uri, content: Uint8Array, id: string): void {
        const basename = path.posix.basename(uri.path);

        // set options defaults
        const options = {
            create: true,
            overwrite: true
        };
        
        // create dir path if not there
        this._makePath(uri);

        const parent = this.lookupParentDirectory(uri);
        let entry = parent.entries.get(basename);
        if (entry instanceof Directory) {
            throw FileSystemError.FileIsADirectory(uri);
        }
        if (!entry && !options.create) {
            throw FileSystemError.FileNotFound(uri);
        }
        if (entry && options.create && !options.overwrite) {
            throw FileSystemError.FileExists(uri);
        }
        if (!entry) {
            entry = new File(basename);
            parent.entries.set(basename, entry);
            this.fireSoon({ type: FileChangeType.Created, uri });
        }
        entry.mtime = Date.now();
        entry.size = content.byteLength;
        entry.id = id;
        entry.data = content;

        this.fireSoon({ type: FileChangeType.Changed, uri });
    }
    
    /**
     * make parent directires if not present
     */
     private _makePath(uri: Uri) {
         
         // get the base directory
         const dirname = uri.with({ path: path.posix.dirname(uri.path) });
         
        //  console.log('makePath', dirname.path);
        
        // split the base directory to the folder parts
        const parts = dirname.path.split('/');

        // array to hold the parent folders as we create them
        const fullPath: string[] = [];

        // loop through folders
        for ( const part of parts) {
            if (!part) {
                continue;   // empty part, continue with loop
            }

            // track the folder path as we check/create them
            fullPath.push(part);

            // see if current folder exists
            const here = this.lookup(Uri.parse(path.join(...fullPath)), true);
            if (!here) {
                // current folder not found, so create it
                // console.log('creating dir', fullPath);
                this.createDirectory(Uri.parse(path.join(...fullPath)));
            } else {
                // console.log('directory exists already: ', fullPath);
            }
        }
    }
}