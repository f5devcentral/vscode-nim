/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';

import { 
    AxiosResponseWithTimings,
    simplifyHttpResponse,
    uuidAxiosRequestConfig
} from "f5-conx-core";
import Logger from "f5-conx-core/dist/logger";
// import { OutputChannel, window } from "vscode";


export class extensionLogger extends Logger {

    constructor() {
        super();
    }

    /**
     * 
     * log http request information depending on env logging level (info/debug)
     * 
     * ex. process.env.F5_CONX_CORE_LOG_LEVEL === 'INFO/DEBUG'
     * 
     * @param config 
     */
    async httpRequest(config: uuidAxiosRequestConfig) {
        // use logging level env to log "info" or "debug" request information

        if (process.env.F5_CONX_CORE_LOG_LEVEL === 'DEBUG') {

            this.debug('debug-http-request', config);
        } else {

            this.info(`HTTPS-REQU [${config.uuid}]: ${config.method} -> ${config.baseURL}${config.url}`);
        }
    }

    /**
     * 
     * log http response information depending on env logging level (info/debug)
     * 
     * ex. process.env.F5_CONX_CORE_LOG_LEVEL === 'INFO/DEBUG'
     * 
     * @param resp 
     */
    async httpResponse(resp: AxiosResponseWithTimings) {

        if (process.env.F5_CONX_CORE_LOG_LEVEL === 'DEBUG') {

            // *** delete method modified the original object causing other errors... ***
            // delete resp.config.httpAgent;
            // delete resp.config.httpsAgent;
            // delete resp.config.transformRequest;
            // delete resp.config.transformResponse;
            // delete resp.config.adapter;
            // delete resp.request.socket;
            // delete resp.request.res;
            // delete resp.request.connection;
            // delete resp.request.agent;

            // re-assign the information we want/need for user debugging
            const thinResp = {
                status: resp.status,
                statusText: resp.statusText,
                headers: resp.headers,
                request: {
                    baseURL: resp.config.baseURL,
                    url: resp.config.url,
                    method: resp.request.method,
                    headers: resp.config.headers,
                    timings: resp.request.timings
                },
                data: resp.data
            };

            this.debug('debug-http-response', thinResp);
        } else {

            this.info(`HTTPS-RESP [${resp.config.uuid}]: ${resp.status} - ${resp.statusText}`);
        }
    }
}