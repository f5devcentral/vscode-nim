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



export class InventoryTreeProvider implements TreeDataProvider<InvTreeItem> {

    private _onDidChangeTreeData: EventEmitter<InvTreeItem | undefined> = new EventEmitter<InvTreeItem | undefined>();
    readonly onDidChangeTreeData: Event<InvTreeItem | undefined> = this._onDidChangeTreeData.event;
    context: ExtensionContext;
    nim: NimClient | undefined;
    inventory: Instances | undefined;
    logger: Logger;
    documents: TextDocument[] = [];
    ngxFs: NgxFsProvider;

    constructor(context: ExtensionContext, logger: Logger, ngxFS: NgxFsProvider) {
        this.context = context;
        this.logger = logger;
        this.ngxFs = ngxFS;
    }


    /**
     * refresh tree view
     */
    async refresh() {
        this.inventory = undefined;

        if (this.nim) {
            await this.getInventory();
        }
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

            // if (element.label === 'test') {
            //     const list = this.ngxFs.readDirectory(Uri.parse('ngx:/'));
            //     for (const item in list) {
            //         treeItems.push(new InvTreeItem(
            //             list[item][0],
            //             'desc...',
            //             'tool',
            //             '',
            //             'instance',
            //             TreeItemCollapsibleState.Collapsed,
            //             'id1234',
            //             {
            //                 command: 'nginx.displayConfigFile',
            //                 title: '',
            //                 arguments: [`ngx:/${list[item][0]}`]
            //             },
            //         ));
            //     }
            // }


            // get children of selected item
            await this.nim.makeRequest(`${this.nim.api.instances}/${element.id}/config`)
                .then(resp => {

                    resp.data.files.forEach((el: InstanceConfig) => {

                        // this.ngxFs.writeFile(Uri.parse(`ngx:${el.name}`), Buffer.from(el.contents, 'base64'), { create: true, overwrite: true });

                        this.ngxFs.loadFile(Uri.parse(el.name), Buffer.from(el.contents, 'base64'), el.instance_id);

                        const txt = jsYaml.dump({
                            name: el.name,
                            created: el.created,
                            modified: el.modified
                        }, { indent: 4 });

                        const decoded = Buffer.from(el.contents, 'base64').toString('ascii');

                        const tooltip = new MarkdownString()
                        .appendCodeblock(txt, 'yaml')
                        .appendMarkdown('\n---\n')
                        .appendText(decoded);

                        treeItems.push(
                            new InvTreeItem(
                                el.name,
                                '',
                                tooltip,
                                new ThemeIcon('file'),
                                'instance',
                                TreeItemCollapsibleState.None,
                                el.instance_id,
                                { 
                                    command: 'nginx.displayConfigFile',
                                    title: '',
                                    arguments: [`ngx:${el.name}`]
                                }
                            )
                        );
                    });

                });



        } else {

            // treeItems.push(new InvTreeItem(
            //     'test',
            //     'desc...',
            //     'tool',
            //     '',
            //     'instance',
            //     TreeItemCollapsibleState.Collapsed,
            //     'id1234',
            //     undefined,
            // ));

            if (this.inventory && this.inventory.list.length > 0) {
                this.inventory.list.map((el: Instance) => {

                    const txt = jsYaml.dump(el, { indent: 4 });
                    const tooltip = new MarkdownString()
                        .appendCodeblock(txt, 'yaml');

                    treeItems.push(new InvTreeItem(
                        el.hostname,
                        (el.nginx.type || ''),
                        tooltip,
                        '',
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

    // /**
    //  * fetch inventory information
    //  */
    // async getInventory(id: string = ''): Promise<AxiosResponseWithTimings> {
    //     // this.inventory = undefined;
    //     const way = await this.nim?.makeRequest(`${this.nim.api.instances}`)
    //         .then(resp => resp)
    //         .catch( err => {
    //             this.logger.error(err)
    //             return Promise.reject(err)
    //         });

    //     return way;
    // }

    /**
     * fetch bigiq managed device information
     */
    private async getInventory() {
        this.inventory = undefined;
        await this.nim?.makeRequest(this.nim.api.instances)
            .then(resp => {
                this.inventory = resp.data;
            });
    }

    /**
     * nginx config in editor
     * @param item from tree view click
     */
    async displayConfig(item: any) {

        // workspace.t

        // open editor and feed it the content
        const doc = await workspace.openTextDocument({ content: item, language: 'NGINX' })
            .then(async (doc) => {
                await window.showTextDocument(doc, { preview: false });
                this.documents.push(doc);
            });
        // make the editor appear
        return doc;	// return something for automated testing
    }




}




// class bDoc implements TextDocument {

// }

// class NimInvDocument extends Disposable implements CustomDocument {

// }


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
        public readonly id?: string,
        public readonly command?: Command,
    ) {
        super(label, collapsibleState);
    }
}

