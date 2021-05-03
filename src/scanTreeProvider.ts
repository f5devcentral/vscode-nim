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
    window,
} from 'vscode';
import { NimClient } from './nimClient';

import jsYaml from "js-yaml";
import Logger from "f5-conx-core/dist/logger";
import { NimScan, NimScanServer } from './nimModels';


export class scanTreeProvider implements TreeDataProvider<ScanTreeItem> {

    private _onDidChangeTreeData: EventEmitter<ScanTreeItem | undefined> = new EventEmitter<ScanTreeItem | undefined>();
    readonly onDidChangeTreeData: Event<ScanTreeItem | undefined> = this._onDidChangeTreeData.event;
    context: ExtensionContext;
    nim: NimClient | undefined;
    scanStatus: NimScan | undefined;
    scanServers: NimScanServer[] = [];
    logger: Logger;
    scanNetwork = '10.0.0.0/24';
    scanPorts: string[] = ['0'];

    constructor(context: ExtensionContext, logger: Logger) {
        this.context = context;
        this.logger = logger;
    }


    /**
     * refresh tree view
     */
    refresh() {
        // this.scan();
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

        if (!this.nim) {
            // not connected, so don't try to populate anything
            return treeItems;
        }

        if (element) {

            // get children of selected item

            if (element.label === 'Servers') {

                this.scanServers.forEach(el => {

                    const tooltip = new MarkdownString()
                        .appendCodeblock(jsYaml.dump(el), 'yaml');

                    treeItems.push(
                        new ScanTreeItem(
                            el.ip,
                            '',
                            tooltip,
                            'scanServer',
                            TreeItemCollapsibleState.None
                        )
                    );

                });

            }


            if (element.label === 'Scan') {

                treeItems.push(
                    new ScanTreeItem(
                        'Network CIDR',
                        this.scanNetwork,
                        'Click to update',
                        'scanCidr',
                        TreeItemCollapsibleState.None,
                        {
                            command: 'nginx.scanUpdateCidr',
                            title: '',
                        }
                    ),
                    new ScanTreeItem(
                        'Ports',
                        this.scanPorts.join('/'),
                        'Click to update',
                        'scanPorts',
                        TreeItemCollapsibleState.None,
                        {
                            command: 'nginx.scanUpdatePorts',
                            title: '',
                        }
                    )
                );

            }

        } else {


            const scanStatus = new MarkdownString()
                .appendCodeblock(jsYaml.dump(this.scanStatus), 'yaml');

            // todo: build count and hover details
            treeItems.push(
                new ScanTreeItem(
                    'Scan',
                    this.scanStatus?.status || '',
                    scanStatus,
                    'scanStatus',
                    TreeItemCollapsibleState.Collapsed
                ),
                new ScanTreeItem(
                    'Servers',
                    this.scanServers.length.toString() || '',
                    '',
                    'scanServer',
                    TreeItemCollapsibleState.Collapsed
                )
            );
        }
        return treeItems;
    }

    /**
     * get scan status
     */
    async getScanStatus() {
        this.scanStatus = undefined;

        this.nim?.makeRequest(this.nim.api.scan)
            .then(resp => {
                this.scanStatus = resp.data;
                this.refresh();
            });
    }

    /**
     * get scan status
     */
    async getScanServers() {
        this.scanServers.length = 0;
        this.nim?.makeRequest(this.nim.api.scanServers)
            .then(resp => {
                // this.scanServers = resp.data.list;
                resp.data.list.forEach((server: {
                    instance_id: string;
                    ip: string;
                    port: string;
                    app: string;
                    version: string;
                    fingerprinted: boolean;
                    cves: number;
                    managed_id: string;
                    lastseen: string;
                    added: string;
                }) => {

                    // try to find an existing server IP
                    const serverIndex = this.scanServers.findIndex(el => el.ip === server.ip);

                    if (serverIndex > 0) {
                        // existing server item, add port
                        this.scanServers[serverIndex].ports.push(server.port);
                    } else {

                        this.scanServers.push({
                            instance_id: server.instance_id,
                            ip: server.ip,
                            ports: [server.port],
                            app: server.app,
                            version: server.version,
                            fingerprinted: server.fingerprinted,
                            cves: server.cves,
                            managed_id: server.managed_id,
                            lastseen: server.lastseen,
                            added: server.added
                        });
                    }

                });
                this.refresh();
            });
    }

    /**
     * get scan status
     */
    async scanUpdatecidr() {
        await window.showInputBox({
            value: this.scanNetwork,
            prompt: 'Update network CIDR to scan'
        }).then( x => {
            if (x) {
                this.scanNetwork = x;
                this.refresh();
            }
        });
    }

    /**
     * get scan status
     */
    async scanUpdatePorts() {
        await window.showInputBox({
            value: this.scanPorts.join(','),
            prompt: 'Update ports to scan',
            placeHolder: 'comma seperated numbers "80,443"'
        }).then( x => {
            if (x) {
                // todo: validate input, only numbers with commas
                this.scanPorts = x.split(',');
                this.refresh();
            }
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
            .then(resp => {
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

