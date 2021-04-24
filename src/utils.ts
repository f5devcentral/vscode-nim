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
    window,
    SecretStorage
} from 'vscode';
import keytar from "keytar";
// import { logger } from './logger';



// todo: use new vscode integrated secretes api (it's baked in keytar...)
// https://stackoverflow.com/questions/66568692/how-to-use-the-vscode-secretstorage
// https://code.visualstudio.com/api/references/vscode-api#SecretStorage
// src/tree/registries/registryPasswords.ts
// https://github.com/microsoft/vscode-docker/commit/fbd25d4bedad5c2360df274c278908d093e6d3cb#diff-79b031eb3ade4f96eb1cfecec2b4f71a2ab8f19a966c3f531e1dcca57bee4341
// const password = context.secrets.get(host.device)

export async function savePassword (device: string, password: string) {
    // logger
    return await keytar.setPassword('nginxHosts', device, password);
}

/**
 * Get password from keytar or prompt
 * @param device nginx/Host/Device in <user>&#64;<host/ip> format
 */
 export async function getPassword(device: string): Promise<string> {

    // logger.debug(`getPassword Device: ${device}`);
    
    let password = await keytar.getPassword('nginxHosts', device);
    
    // logger.debug(`IS PASSWORD IN KEYTAR?: ${password}`);
    if (!password) {
        // logger.debug(`NO PASSWORD IN KEYTAR! - PROMPTING!!! - ${password}`);
        password = await window.showInputBox({
            placeHolder: 'Basic Auth Password',
            prompt: 'Input password: ',
            password: true,
            ignoreFocusOut: true
        })
        .then( password => {
            if (!password) {
                throw new Error('User cancelled password input');
            }
            // logger.debug(`USER INPUT PASSWORD!!! - ${password}`);
            return password;
            });
    }
    // logger.debug(`PASSWORD BOUT TO BE RETURNED!!! - ${password}`);
    return password;
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
        // logger.warn('getText was called, but no active editor... this should not happen');
        throw new Error('getText was called, but no active editor... this should not happen'); // No open/active text editor
    }
    
}