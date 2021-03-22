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

const logger = new Logger();

export function activate(context: ExtensionContext) {

    const settings = new Settings(context);
    
    workspace.onDidChangeConfiguration(() => {
        // logger.debug('EXTENSION CONFIGURATION CHANGED!!!');
        settings.load();
        nginxHostsTree.refresh();
    });
    
    logger.info(`Host details: `, {
        hostOS: os.type(),
        platform: os.platform(),
        release: os.release(),
        userInfo: `${JSON.stringify(os.userInfo())}`
    });




    const nginxHostsTree = new NginxHostTreeProvider(context, settings, logger);
    const hostsTreeView = window.createTreeView('Hosts', {
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

}