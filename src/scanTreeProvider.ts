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


export class scanTreeProvider implements TreeDataProvider<ScanTreeItem> {

    private _onDidChangeTreeData: EventEmitter<ScanTreeItem | undefined> = new EventEmitter<ScanTreeItem | undefined>();
    readonly onDidChangeTreeData: Event<ScanTreeItem | undefined> = this._onDidChangeTreeData.event;
    context: ExtensionContext;
    scanItems: any;

    constructor(context: ExtensionContext) {
        this.context = context;
    }


    /**
     * refresh tree view
     */
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: ScanTreeItem): TreeItem {
        return element;
    }

    async getChildren(element?: ScanTreeItem) {
        let treeItems: ScanTreeItem[] = [];


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
                new ScanTreeItem('found1', '', '', '', TreeItemCollapsibleState.Collapsed),
                new ScanTreeItem('found2', '', '', '', TreeItemCollapsibleState.Collapsed),
                new ScanTreeItem('found3', '', '', '', TreeItemCollapsibleState.Collapsed),
            );
        }
        return treeItems;
    }

    /**
     * fetch bigiq managed device information
     */
    private async getInventory() {
        this.scanItems.length = 0;
    }



}


/**
 * sort tree items by label
 */
export function sortTreeItems(treeItems: ScanTreeItem[]) {
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
class ScanTreeItem extends TreeItem {
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

