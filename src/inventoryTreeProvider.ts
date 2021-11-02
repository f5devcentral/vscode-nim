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
    Command,
    Event,
    EventEmitter,
    ExtensionContext,
    MarkdownString,
    TextDocument,
    ThemeIcon,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    Uri,
    window,
    workspace,
} from 'vscode';
import { NimClient } from './nimClient';
import { Instance, InstanceConfig, Instances } from './nimModels';
import jsYaml from 'js-yaml';
import { NgxFsProvider } from './ngxFileSystem';

import Logger from "f5-conx-core/dist/logger";
import path from 'path';

export type InvFileSet = {
    hostname: string;
    files: string[];
};

export type IstFiles = {
    [key: string]: string[]
};


export class InventoryTreeProvider implements TreeDataProvider<InvTreeItem> {

    private _onDidChangeTreeData: EventEmitter<InvTreeItem | undefined> = new EventEmitter<InvTreeItem | undefined>();
    readonly onDidChangeTreeData: Event<InvTreeItem | undefined> = this._onDidChangeTreeData.event;
    context: ExtensionContext;
    nim: NimClient | undefined;
    inventory: Instances | undefined;
    logger: Logger;
    documents: TextDocument[] = [];
    ngxFs: NgxFsProvider;
    instFiles: IstFiles = {};

    /**
     * reset the instance ID configs to for nim to get the latest from instance
     */
    resetInstanceConfigs: string | undefined;

    private ngxIcon = path.join(__dirname, "..", "images", "NGINX-product-icon.svg");
    private ngxPlusIcon = path.join(__dirname, "..", "images", "NGINX-Plus-product-icon-RGB.svg");

    constructor(context: ExtensionContext, logger: Logger, ngxFS: NgxFsProvider) {
        this.context = context;
        this.logger = logger;
        this.ngxFs = ngxFS;
    }


    /**
     * refresh tree view
     */
    async refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }

    async clear() {
        this.nim = undefined;
        this.inventory = undefined;
    }

    getTreeItem(element: InvTreeItem): InvTreeItem {
        return element;
    }

    async getChildren(element?: InvTreeItem): Promise<InvTreeItem[]> {
        let treeItems: InvTreeItem[] = [];

        if (!this.nim) {
            // not connected, so don't try to populate anything
            return treeItems;
        }

        if (element) {

            // update url for config reset or nim
            const url = (this.resetInstanceConfigs === element.label) ?
                `${this.nim.api.instances}/${element.deviceId}/config?current=true` : `${this.nim.api.instances}/${element.deviceId}/config`;

            // clear reset flag if set
            if (this.resetInstanceConfigs === element.label) {
                this.resetInstanceConfigs = undefined;
            }

            // get children of selected item
            await this.nim.makeRequest(url)
                .then(resp => {

                    // start building file list for host
                    // const fileTracker: InvFileSet = { hostname: element.label, files: []};
                    const files: string[] = [];

                    resp.data.files.forEach((el: InstanceConfig) => {

                        // add files to file tracker
                        // this.instFiles?[element.label].push(el.name, 'asdf'): 
                        files.push(el.name);

                        const uri = Uri.parse(path.join(element.label, el.name));

                        if (!el.contents) {
                            debugger;
                        }

                        this.ngxFs.loadFile(uri, Buffer.from(el.contents, 'base64'), element.deviceId);

                        const txt = jsYaml.dump({
                            name: el.name,
                            created: el.created,
                            modified: el.modified
                        }, { indent: 4 });

                        const decoded = Buffer.from(el.contents, 'base64').toString('ascii');

                        const tooltip = new MarkdownString()
                            .appendCodeblock(txt, 'yaml');
                            // .appendMarkdown('\n---\n')
                            // .appendText(decoded);

                        const tiPath = path.join(element.label, el.name);
                        // const description = 

                        treeItems.push(
                            new InvTreeItem(
                                el.name,
                                el.modified,
                                tooltip,
                                new ThemeIcon('file'),
                                'config',
                                TreeItemCollapsibleState.None,
                                element.deviceId,
                                {
                                    command: 'nginx.displayConfigFile',
                                    title: '',
                                    arguments: [`ngx:/${tiPath}`]
                                }
                            )
                        );
                    });

                    // inject host file list back into main class
                    this.instFiles = { [element.label]: files };

                });



        } else {

            if (this.inventory && this.inventory.list.length > 0) {
                this.inventory.list.map((el: Instance) => {

                    const txt = jsYaml.dump(el, { indent: 4 });
                    const tooltip = new MarkdownString()
                        .appendCodeblock(txt, 'yaml');

                    const icon = el.nginx.type === 'plus'
                        ? this.ngxPlusIcon : this.ngxIcon;

                    treeItems.push(new InvTreeItem(
                        el.hostname,
                        (el.nginx.type || ''),
                        tooltip,
                        icon,
                        'instance',
                        TreeItemCollapsibleState.Collapsed,
                        el.instance_id,
                        undefined,
                    ));
                });
            }

        }
        return treeItems;
    }


    /**
     * fetch nginx instance information
     */
    async getInventory() {
        this.inventory = undefined;
        await this.nim?.makeRequest(this.nim.api.instances)
            .then(resp => {
                this.inventory = resp.data;
                this.refresh();
            });
    }

}



/**
 * sort tree items by label
 */
export function sortTreeItems(treeItems: InvTreeItem[]) {
    return treeItems.sort((a, b) => {
        const x = a.label.toLowerCase();
        const y = b.label.toLowerCase();
        if (x < y) {
            return -1;
        } else {
            return 1;
        }
    });
}

// class NginxContDoc implements TextDocument {

// }

/**
 * bigiq class tree item
 */
class InvTreeItem extends TreeItem {
    constructor(
        public readonly label: string,
        public description: string,
        public tooltip: string | MarkdownString,
        public iconPath: string | ThemeIcon,
        public contextValue: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public deviceId: string,
        public readonly command?: Command,
    ) {
        super(label, collapsibleState);
    }
}

