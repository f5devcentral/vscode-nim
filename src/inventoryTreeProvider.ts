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
    Position,
    Range,
    TextDocument,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    Uri,
    ViewColumn,
    window,
    workspace
} from 'vscode';

// import jsyaml from "js-yaml";


export class InventoryTreeProvider implements TreeDataProvider<InvTreeItem> {

    private _onDidChangeTreeData: EventEmitter<InvTreeItem | undefined> = new EventEmitter<InvTreeItem | undefined>();
    readonly onDidChangeTreeData: Event<InvTreeItem | undefined> = this._onDidChangeTreeData.event;
    context: ExtensionContext;
    inventory: any;

    constructor(context: ExtensionContext) {
        this.context = context;
    }


    /**
     * refresh tree view
     */
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: InvTreeItem): TreeItem {
        return element;
    }

    async getChildren(element?: InvTreeItem) {
        let treeItems: InvTreeItem[] = [];


        if (element) {

            // get children of selected item

        } else {

            // // this.refreshData();
            // await Promise.all([
            //     this.getGlobalApps(),
            //     this.getTemplates(),
            //     this.getDevices(),
            //     this.getScripts(),
            //     this.getExecutedScripts()
            // ]);

            // todo: build count and hover details
            treeItems.push(
                new InvTreeItem('inst1', '', '', '', TreeItemCollapsibleState.Collapsed),
                new InvTreeItem('inst2', '', '', '', TreeItemCollapsibleState.Collapsed),
                new InvTreeItem('inst3', '', '', '', TreeItemCollapsibleState.Collapsed),
            );
        }
        return treeItems;
    }

    /**
     * fetch bigiq managed device information
     */
    private async getInventory() {
        this.inventory.length = 0;
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
        public contextValue: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly command?: Command
    ) {
        super(label, collapsibleState);
    }
}

