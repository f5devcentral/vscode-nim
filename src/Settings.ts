/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';

import { ExtensionContext, workspace } from "vscode";



export type NginxHost = {
    device: string;
};

/**
 * started setting up the class to manage any settings interaction with the extension.
 * 
 * **not actually used yet, the hosts tree is pulling hosts config directly...**
 */
export default class Settings {

    hosts: NginxHost[] = [];

    constructor(context: ExtensionContext) {
        // boogers
        this.init();
    }


    /**
     * load settings from extension settings file
     */
    async load() {
        this.hosts = workspace.getConfiguration().get('f5.nginx.hosts') || [];
    }

    /**
     * initialize settings at launch
     */
    async init() {

    }
}