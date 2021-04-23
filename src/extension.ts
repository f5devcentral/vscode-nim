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
    ExtensionContext,
    commands,
    window,
    workspace,
    ProgressLocation,
} from 'vscode';

import * as os from 'os';

import { NginxHostTreeProvider } from './hostsTreeProvider';
import Settings from './settings';
import { InventoryTreeProvider } from './inventoryTreeProvider';
import { scanTreeProvider } from './scanTreeProvider';
import { extensionLogger } from './logger';
import { NimClient } from './nimClient';
import { EventEmitter } from 'events';

import { getPassword } from './utils'


// https://stackoverflow.com/questions/51070138/how-to-import-package-json-into-typescript-file-without-including-it-in-the-comp
// import * as pkjs from '../package.json'

const logger = new extensionLogger();
logger.console = false;
// delete process.env.F5_CONX_CORE_LOG_LEVEL;
// process.env.F5_CONX_CORE_LOG_LEVEL = 'DEBUG';

// create OUTPUT channel
const f5OutputChannel = window.createOutputChannel('nginx');
// make visible
// f5OutputChannel.show();
// inject vscode output into logger
logger.output = function (log: string) {
    f5OutputChannel.appendLine(log);
};

export function activate(context: ExtensionContext) {

    const eventer = new EventEmitter()
        .on('log-http-request', msg => logger.httpRequest(msg))
        .on('log-http-response', msg => logger.httpResponse(msg))
        .on('log-debug', msg => logger.debug(msg))
        .on('log-info', msg => logger.info(msg))
        .on('log-warn', msg => logger.warning(msg))
        .on('log-error', msg => logger.error(msg));

    const settings = new Settings(context);

    workspace.onDidChangeConfiguration(() => {
        logger.info('NGINX EXTENSION SETTINGS CHANGED!');
        settings.load();
        // nginxHostsTree.refresh();
    });

    // todo: add extra package details!
    logger.info(`nginx Extension Host details: `, {
        hostOS: os.type(),
        platform: os.platform(),
        release: os.release(),
        userInfo: `${JSON.stringify(os.userInfo())}`
    });

    let nim: NimClient | undefined;


    const nginxHostsTree = new NginxHostTreeProvider(context, settings, logger);
    const hostsTreeView = window.createTreeView('hostsView', {
        treeDataProvider: nginxHostsTree,
        showCollapseAll: true
    });

    context.subscriptions.push(commands.registerCommand('nginx.refreshHostsTree', () => {
        nginxHostsTree.refresh();
    }));

    context.subscriptions.push(commands.registerCommand('nginx.addHost', async (newHost) => {

        commands.executeCommand('workbench.action.openSettingsJson', 'nginx');
        // return await nginxHostsTree.addDevice(newHost);
    }));

    context.subscriptions.push(commands.registerCommand('nginx.removeHost', async (hostID) => {
        return await nginxHostsTree.removeDevice(hostID);
    }));

    context.subscriptions.push(commands.registerCommand('nginx.editHost', async (hostID) => {
        return await nginxHostsTree.editDevice(hostID);
    }));

    context.subscriptions.push(commands.registerCommand('nginx.connect', async (host) => {

        commands.executeCommand('nginx.disConnect');

        // if (host.auth.basic) {
        //     getPassword(host.device)
        // }

        // curl -sku ted:benrocks https://dc0bec8a-1378-477d-b1a1-af6f87fbd190.access.udf.f5.com/api/v0/about/license

        await window.withProgress({
            location: ProgressLocation.Notification,
            title: `Connecting to NIM`,
            cancellable: true
        }, async () => {

            nim = new NimClient(host, eventer);
    
            await nim.connect()
                .then(() => {
                    commands.executeCommand('setContext', 'nim.connected', true);
                    inventoryTree.nim = nim;
                    inventoryTreeView.message = "connected";
                    inventoryTree.refresh();
    
                    scanTree.nim = nim;
                    scanTreeView.message = "connected";
                    scanTree.refresh();
                    // debugger;
                })
                .catch(err => {
                    logger.error('nim connect failed', err);
                });
        });
        

    }));




    context.subscriptions.push(commands.registerCommand('nginx.disConnect', async (hostID) => {

        commands.executeCommand('setContext', 'nim.connected', true);

        inventoryTree.clear();
        inventoryTreeView.message = "dis-connected";

        scanTree.clear();
        scanTreeView.message = "dis-connected";
        nim = undefined;
    }));



    const inventoryTree = new InventoryTreeProvider(context, logger);
    const inventoryTreeView = window.createTreeView('inventoryView', {
        treeDataProvider: inventoryTree,
        showCollapseAll: true
    });
    inventoryTreeView.message = 'static for now, but should only show when connected to a NIM';



    const scanTree = new scanTreeProvider(context, logger);
    const scanTreeView = window.createTreeView('scanView', {
        treeDataProvider: scanTree,
        showCollapseAll: true
    });
    scanTreeView.message = 'same as inventory tree view';

    context.subscriptions.push(commands.registerCommand('nim.scanStart', async () => {

        await getText()
            .then(async text => {
                await scanTree.scanStart(text);
            })
            .catch(err => {
                logger.error('nim.scanStart failed', err);
            });

    }));
}

/**
 * capture entire active editor text or selected text
 */
export async function getText(): Promise<string> {

    // get editor window
    var editor = window.activeTextEditor;
    if (editor) {
        // capture selected text or all text in editor
        if (editor.selection.isEmpty) {
            return editor.document.getText();	// entire editor/doc window
        } else {
            return editor.document.getText(editor.selection);	// highlighted text
        }
    } else {
        logger.warning('getText was called, but no active editor... this should not happen');
        throw new Error('getText was called, but no active editor... this should not happen'); // No open/active text editor
    }

}
