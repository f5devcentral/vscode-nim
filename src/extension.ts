/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import {
    ExtensionContext,
    commands,
    window,
    workspace,
} from 'vscode';

import * as os from 'os';

import Logger from 'f5-conx-core/dist/logger';
import { NginxHostTreeProvider } from './hostsTreeProvider';
import Settings from './Settings';
import { InventoryTreeProvider } from './inventoryTreeProvider';
import { scanTreeProvider } from './scanTreeProvider';

const logger = new Logger();

export function activate(context: ExtensionContext) {

    const settings = new Settings(context);
    
    workspace.onDidChangeConfiguration(() => {
        // logger.debug('EXTENSION CONFIGURATION CHANGED!!!');
        settings.load();
        nginxHostsTree.refresh();
    });
    
    logger.info(`NIM Host details: `, {
        hostOS: os.type(),
        platform: os.platform(),
        release: os.release(),
        userInfo: `${JSON.stringify(os.userInfo())}`
    });




    const nginxHostsTree = new NginxHostTreeProvider(context, settings, logger);
    const hostsTreeView = window.createTreeView('hostsView', {
        treeDataProvider: nginxHostsTree,
        showCollapseAll: true
    });

    context.subscriptions.push(commands.registerCommand('nginx.refreshHostsTree', () => {
        nginxHostsTree.refresh();
    }));

    context.subscriptions.push(commands.registerCommand('nginx.addHost', async (newHost) => {
        return await nginxHostsTree.addDevice(newHost);
    }));

    context.subscriptions.push(commands.registerCommand('nginx.removeHost', async (hostID) => {
        return await nginxHostsTree.removeDevice(hostID);
    }));

    context.subscriptions.push(commands.registerCommand('nginx.editHost', async (hostID) => {
        return await nginxHostsTree.editDevice(hostID);
    }));

    context.subscriptions.push(commands.registerCommand('nginx.connect', async () => {

    }));



    const inventoryTree = new InventoryTreeProvider(context);
    const inventoryTreeView = window.createTreeView('inventoryView', {
        treeDataProvider: inventoryTree,
        showCollapseAll: true
    });
    inventoryTreeView.message = 'static for now, but should only show when connected to a NIM';

    const scanTree = new scanTreeProvider(context);
    const scanTreeView = window.createTreeView('scanView', {
        treeDataProvider: scanTree,
        showCollapseAll: true
    });
    scanTreeView.message = 'same as inventory tree view';

}