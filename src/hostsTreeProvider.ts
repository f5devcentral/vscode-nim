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

import Logger from 'f5-conx-core/dist/logger';
import jsYaml from 'js-yaml';
import path = require('path');
import {
	Command,
	ConfigurationTarget,
	Event,
	EventEmitter,
	ExtensionContext,
	MarkdownString,
	ThemeIcon,
	TreeDataProvider,
	TreeItem,
	TreeItemCollapsibleState,
    window,
	workspace
} from 'vscode';
import { NimClient } from './nimClient';
import Settings, { NginxHost } from './settings';

// icon listing for addin icons to key elements
// https://code.visualstudio.com/api/references/icons-in-labels#icon-listing


export class NginxHostTreeProvider implements TreeDataProvider<NginxHostTreeItem> {

	private _onDidChangeTreeData: EventEmitter<NginxHostTreeItem | undefined> = new EventEmitter<NginxHostTreeItem | undefined>();
	readonly onDidChangeTreeData: Event<NginxHostTreeItem | undefined> = this._onDidChangeTreeData.event;

	/**
	 * regex for confirming host entry <user>@<host/ip>:<port>
	 */
	readonly deviceRex = /^[\w-.]+$/;

    // private green = path.join(__dirname, "..", "images", "NGINX-Instance-Manager-logo_horizontal.svg");
    private green = path.join(__dirname, "..", "images", "NGINX-Instance-Manager-icon_cutout.svg");
    
	private context: ExtensionContext;
    nginxHosts: NginxHost[] = [];
    settings: Settings;
    logger: Logger;
    
	constructor(context: ExtensionContext, settings: Settings, logger: Logger) {
        this.context = context;
        this.logger = logger;
        this.settings = settings;
		this.loadHosts();
	}
    
    /**
	 * load hosts from vscode workspace config
	 * 
	 */
	async loadHosts(): Promise<void> {
		this.nginxHosts = workspace.getConfiguration().get('f5.nginx.hosts') || [];
	}

	/**
	 * save hosts config 
	 */
	async saveHosts(): Promise<void> {
		await workspace.getConfiguration()
			.update('f5.nginx.hosts', this.nginxHosts, ConfigurationTarget.Global);
	}

	/**
	 * save systema and license details about host
	 */
	async saveHostDetails(nim: NimClient): Promise<void> {

		// get index of host in the saved devices list
		const hostIndex = this.nginxHosts.findIndex( el => el.device === nim.host.device);

		// add the license and system details
		this.nginxHosts[hostIndex].license = nim.license;
		this.nginxHosts[hostIndex].system = nim.system;
		
		this.saveHosts();
		this.refresh();
	}

	/**
	 * load hosts from config and refresh tree view
	 */
	async refresh(): Promise<void> {
		this.loadHosts();
		this._onDidChangeTreeData.fire(undefined);
	}


	getTreeItem(element: NginxHostTreeItem): TreeItem {
		return element;
	}


	async getChildren(element?: NginxHostTreeItem): Promise<NginxHostTreeItem[]> {

        const treeItems: NginxHostTreeItem[] = [];

		if (element) {

			// do return children of the selected element

			// return treeItems;
		} else {

			this.nginxHosts.forEach((item: NginxHost) => {

                const tooltip = new MarkdownString(`## ${item.device}\n---\n`)
                .appendCodeblock(jsYaml.dump(item), 'yaml');

				const treeItem = new NginxHostTreeItem(
					(item.label || item.device),
					'description...',
					tooltip,
					this.green,
					'host',
					TreeItemCollapsibleState.None,
					{
						command: 'nginx.connect',
						title: 'hostTitle',
						arguments: [item]
					}
				);

				treeItems.push(treeItem);
			});

		}
        return Promise.resolve(treeItems);
	}


	async addDevice(newHost: string) {
        
		if (!newHost) {
			// attempt to get user to input new device
			newHost = await window.showInputBox({
				prompt: 'Device/NGINX/Host',
				placeHolder: '<host/ip>',
				ignoreFocusOut: true
			})
				.then(el => {
					if (el) {
						return el;
					} else {
						throw new Error('user escapted new device input');
					}
				});
		}

		// quick-n-dirty way, stringify the entire hosts config and search it for the host we are adding
		const devicesString = JSON.stringify(this.nginxHosts);

		if (!devicesString.includes(`\"${newHost}\"`) && this.deviceRex.test(newHost)) {
			this.nginxHosts.push({ device: newHost });
			this.saveHosts();
			// wait(500, this.refresh());
			return `${newHost} added to device configuration`;
		} else {
			this.logger.error(`${newHost} exists or invalid format: <user>@<host/ip>:<port>`);
			return 'FAILED - Already exists or invalid format: <user>@<host/ip>';
		}
	}

	async editDevice(hostID: NginxHostTreeItem) {
        this.logger.debug(`Edit Host command:`, hostID);

        await window.showInputBox({
            prompt: 'Update Device/BIG-IP/Host',
            value: hostID.label,
            ignoreFocusOut: true
        })
            .then(input => {

                this.logger.info('user input', input);

                if (input === undefined || this.nginxHosts === undefined) {
                    // throw new Error('Update device inputBox cancelled');
                    this.logger.warning('Update device inputBox cancelled');
                    return;
                }

                // const deviceRex = /^[\w-.]+@[\w-.]+(:[0-9]+)?$/;
                const devicesString = JSON.stringify(this.nginxHosts);

                if (!devicesString.includes(`\"${input}\"`) && this.deviceRex.test(input) && this.nginxHosts && hostID.label) {

					// get the array index of the modified device
					const modifiedDeviceIndex = this.nginxHosts.findIndex((x: NginxHost) => x.device === hostID.label);

					// update device using index
					this.nginxHosts[modifiedDeviceIndex].device = input;

					this.saveHosts();
					// wait(500, this.refresh());

				} else {

                    this.logger.error(`${input} exists or invalid format: <host/ip>`);
                }
            });
	}


    async removeDevice(hostID: NginxHostTreeItem) {
		this.logger.debug(`Remove Host command:`, hostID);
		
		const newNginxHosts = this.nginxHosts.filter((item: NginxHost) => (item.device || item.label) !== hostID.label);
		
		if (this.nginxHosts.length === (newNginxHosts.length + 1)) {
			this.logger.debug('device removed');
			// this.clearPassword(hostID.label);	// clear cached password for device
			this.nginxHosts = newNginxHosts;
			this.saveHosts();
			// wait(500, this.refresh());
			return `successfully removed (${hostID.label} from devices configuration`;
		} else {
			this.logger.debug('something with remove device FAILED!!!');
			throw new Error('something with remove device FAILED!!!');
		}
	}
}




export class NginxHostTreeItem extends TreeItem {
	constructor(
		public readonly label: string,
		public description: string,
		public tooltip: string | MarkdownString,
		public iconPath: string | ThemeIcon,
		public contextValue: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly command?: Command,
	) {
		super(label, collapsibleState);
	}
}
