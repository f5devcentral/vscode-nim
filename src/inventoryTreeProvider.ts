/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';

import {
    Command,
    Event,
    EventEmitter,
    ExtensionContext,
    MarkdownString,
    ThemeIcon,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    window,
    workspace,
} from 'vscode';
import { NimClient } from './nimClient';
import { Instance, InstanceConfig, Instances } from './nimModels';
import jsYaml from 'js-yaml';
import { extensionLogger } from './logger';
import { AxiosResponseWithTimings } from 'f5-conx-core';

// import jsyaml from "js-yaml";


export class InventoryTreeProvider implements TreeDataProvider<InvTreeItem> {

    private _onDidChangeTreeData: EventEmitter<InvTreeItem | undefined> = new EventEmitter<InvTreeItem | undefined>();
    readonly onDidChangeTreeData: Event<InvTreeItem | undefined> = this._onDidChangeTreeData.event;
    context: ExtensionContext;
    nim: NimClient | undefined;
    inventory: Instances | undefined;
    logger: extensionLogger;

    constructor(context: ExtensionContext, logger: extensionLogger) {
        this.context = context;
        this.logger = logger;
    }


    /**
     * refresh tree view
     */
    async refresh() {
        this.inventory = undefined;

        if (this.nim) {
            await this.getInventory()
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

            // get children of selected item

            await this.nim.makeRequest(`${this.nim.api.instances}/${element.id}/config`)
                .then(resp => {

                    resp.data.files.forEach((el: InstanceConfig) => {

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
                                    title: 'asdf',
                                    arguments: [el]
                                }
                            )
                        );
                    });

                })



        } else {

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
		
		// open editor and feed it the content
		const doc = await workspace.openTextDocument({ content: item, language: 'NGINX' });
		// make the editor appear
		await window.showTextDocument( doc, { preview: false });
		return doc;	// return something for automated testing
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

