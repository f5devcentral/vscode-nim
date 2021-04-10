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
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
} from 'vscode';
import { NimClient } from './nimClient';

import jsYaml from "js-yaml";
import { extensionLogger } from './logger';


export class scanTreeProvider implements TreeDataProvider<ScanTreeItem> {

    private _onDidChangeTreeData: EventEmitter<ScanTreeItem | undefined> = new EventEmitter<ScanTreeItem | undefined>();
    readonly onDidChangeTreeData: Event<ScanTreeItem | undefined> = this._onDidChangeTreeData.event;
    context: ExtensionContext;
    nim: NimClient | undefined;
    scanServers: any[] = [];
    logger: extensionLogger;

    constructor(context: ExtensionContext, logger: extensionLogger) {
        this.context = context;
        this.logger = logger;
    }


    /**
     * refresh tree view
     */
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }

    async clear() {
        this.nim = undefined;
        this.scanServers.length = 0;
    }

    getTreeItem(element: ScanTreeItem): TreeItem {
        return element;
    }

    async getChildren(element?: ScanTreeItem) {
        let treeItems: ScanTreeItem[] = [];

        if(!this.nim) {
            // not connected, so don't try to populate anything
            return treeItems;
        }

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
                new ScanTreeItem('Start', '', '', '', TreeItemCollapsibleState.None),
                new ScanTreeItem('found2', '', '', '', TreeItemCollapsibleState.Collapsed),
                new ScanTreeItem('found3', '', '', '', TreeItemCollapsibleState.Collapsed),
            );
        }
        return treeItems;
    }

    /**
     * get scan status
     */
    private async scanResults() {
        this.scanServers.length = 0;

        this.nim?.makeRequest(this.nim.api.scan)
        .then( resp => {
            // this.scanDetails = resp.data;

        });
    }

    /**
     * get scan status
     */
    async scanStart(data: string) {

        // let data;
        try {
            data = JSON.parse(data);
        } catch (e) {
            throw e;
        }

        // this.scanServers.length = 0;

        this.nim?.makeRequest(this.nim.api.scan, {
            method: 'POST',
            data
        })
        .then( resp => {
            // just log that the scan is running?
            this.logger.debug('nim scan job start', resp);
        });

    }



}

export type ScanType = "START" | "STATUS" | 'CANCEL';


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

