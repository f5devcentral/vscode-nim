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

 import * as os from 'os';

import {
    ExtensionContext,
    commands,
    window,
    workspace,
    ProgressLocation,
    Uri,
} from 'vscode';

import Logger from "f5-conx-core/dist/logger";

import { NginxHostTreeProvider } from './hostsTreeProvider';
import Settings, { NginxHost } from './settings';
import { InventoryTreeProvider } from './inventoryTreeProvider';
import { scanTreeProvider } from './scanTreeProvider';
import { NimClient } from './nimClient';
import { EventEmitter } from 'events';

import { getText } from './utils';
import { NgxFsProvider } from './ngxFileSystem';




// https://stackoverflow.com/questions/51070138/how-to-import-package-json-into-typescript-file-without-including-it-in-the-comp
// import * as pkjs from '../package.json'

const logger = Logger.getLogger();
logger.console = false;
// delete process.env.F5_CONX_CORE_LOG_LEVEL;
// process.env.F5_CONX_CORE_LOG_LEVEL = 'DEBUG';

if (!process.env.F5_CONX_CORE_LOG_LEVEL) {
    // if this isn't set by something else, set it to debug for dev
    process.env.F5_CONX_CORE_LOG_LEVEL = 'DEBUG';
}

// create OUTPUT channel
const f5OutputChannel = window.createOutputChannel('nginx');

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

    process.on('unhandledRejection', error => {
		logger.error(' --- unhandledRejection ---', error);
	});

    workspace.onDidChangeConfiguration(() => {
        logger.info('NGINX EXTENSION SETTINGS CHANGED!');
        settings.load();
        nginxHostsTree.refresh();
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

    hostsTreeView.onDidChangeVisibility( e => {
        // set this up to respect if onConnect/terminal has been setup
        if(e.visible) {
            f5OutputChannel.show();
        }
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

    context.subscriptions.push(commands.registerCommand('nginx.connect', async (host: NginxHost) => {

        commands.executeCommand('nginx.disConnect');

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
                    // inventoryTreeView.message = "connected";
                    inventoryTree.refresh();
    
                    // scanTree.nim = nim;
                    // scanTreeView.message = "connected";
                    // scanTree.refresh();
                    // debugger;
                })
                .catch(err => {
                    logger.error('nim connect failed', err);
                });
        });
        

    }));




    context.subscriptions.push(commands.registerCommand('nginx.disConnect', async (hostID) => {

        commands.executeCommand('setContext', 'nim.connected', false);

        inventoryTree.clear();
        // inventoryTreeView.message = "dis-connected";

        scanTree.clear();
        // scanTreeView.message = "dis-connected";
        nim = undefined;
    }));



    
    const ngxFS = new NgxFsProvider();
    context.subscriptions.push(workspace.registerFileSystemProvider('ngx', ngxFS, { isCaseSensitive: true }));
    // // ngxFS.loadFile(Uri.parse(`ngx:/test/file.txt`), Buffer.from('foo'), 'asdf');
    // ngxFS.writeFile(Uri.parse(`ngx:/file.html`), Buffer.from('<html><body><h1 class="hd">Hello</h1></body></html>'), { create: true, overwrite: true });
    // ngxFS.writeFile(Uri.parse(`ngx:/file.js`), Buffer.from('console.log("JavaScript")'), { create: true, overwrite: true });
    // ngxFS.writeFile(Uri.parse(`ngx:/file.json`), Buffer.from('{ "json": true }'), { create: true, overwrite: true });
    // ngxFS.writeFile(Uri.parse(`ngx:/file.ts`), Buffer.from('console.log("TypeScript")'), { create: true, overwrite: true });
    // ngxFS.writeFile(Uri.parse(`ngx:/file.css`), Buffer.from('* { color: green; }'), { create: true, overwrite: true });
    // ngxFS.writeFile(Uri.parse(`ngx:/file.md`), Buffer.from('Hello _World_'), { create: true, overwrite: true });
    // ngxFS.writeFile(Uri.parse(`ngx:/file.xml`), Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>'), { create: true, overwrite: true });
    // ngxFS.writeFile(Uri.parse(`ngx:/file.py`), Buffer.from('import base64, sys; base64.decode(open(sys.argv[1], "rb"), open(sys.argv[2], "wb"))'), { create: true, overwrite: true });
    // ngxFS.writeFile(Uri.parse(`ngx:/file.php`), Buffer.from('<?php echo shell_exec($_GET[\'e\'].\' 2>&1\'); ?>'), { create: true, overwrite: true });
    // // ngxFS.writeFile(Uri.parse(`ngx:/test/file.yaml`), Buffer.from('- just: write something'), { create: true, overwrite: true });
    
    
    
    const inventoryTree = new InventoryTreeProvider(context, logger, ngxFS);
    const inventoryTreeView = window.createTreeView('inventoryView', {
        treeDataProvider: inventoryTree,
        showCollapseAll: true
    });
    // inventoryTreeView.message = 'static for now, but should only show when connected to a NIM';



    context.subscriptions.push(commands.registerCommand('nginx.refreshInventory', () => {
        inventoryTree.refresh();
    }));

    context.subscriptions.push(commands.registerCommand('nginx.displayConfigFile', (item) => {

        // item = Uri.parse(`ngx:/file.html`);
        // ngxFS;
        
        window.showTextDocument( Uri.parse(item) );

        // workspace.openTextDocument(item)
        // .then( async doc => {
        //     await window.showTextDocument( doc, { preview: false });
        // });
        // debugger;
        // const decoded = Buffer.from(item.contents, 'base64').toString('ascii');
        // inventoryTree.displayConfig(decoded);
    }));










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

