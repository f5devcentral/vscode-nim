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

import { ExtensionContext, workspace } from "vscode";
import { NimLicense, NimSystem } from "./nimModels";



export type NginxHost = {
    device: string;
    label?: string;
    port?: number;
    auth: {
        /**
         * basic auth user string
         * -- will prompt for password
         */
        basic?: string,
        /**
         * private cert pointer (ex. "~./.ssh/rsa_id")
         * or could pick up from ssh file?
         * or direct private key text?
         */
        cert?: string,
        /**
         * username for token auth
         * -- will prompt for password
         */
        token?: string,
    },
    license?: NimLicense,
    system?: NimSystem
};

/**
 * started setting up the class to manage any settings interaction with the extension.
 * 
 * **not actually used yet, the hosts tree is pulling hosts config directly...**
 */
export default class Settings {
    protected logLevel;

    hosts: NginxHost[] = [];

    constructor(context: ExtensionContext) {
        // boogers
        this.logLevel = process.env.F5_CONX_CORE_LOG_LEVEL || 'INFO';
        this.init();
    }


    /**
     * load settings from extension settings file
     */
    async load() {

        this.hosts = workspace.getConfiguration().get('f5.nim.hosts') || [];
        process.env.F5_CONX_CORE_LOG_LEVEL = workspace.getConfiguration().get('f5.nim.logLevel', 'INFO');
        this.logLevel = process.env.F5_CONX_CORE_LOG_LEVEL;
    }

    /**
     * initialize settings at launch
     */
    async init() {
        this.load();
    }
}