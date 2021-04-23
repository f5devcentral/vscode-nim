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
    window
} from 'vscode';
import keytar from "keytar";
// import { logger } from './logger';




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