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

// import http, { IncomingMessage, RequestOptions } from 'http';
import https, { RequestOptions } from 'https';
import { IncomingMessage } from 'http';
import timer from '@szmarczak/http-timer/dist/source';

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AxiosResponseWithTimings, getRandomUUID, HttpResponse } from 'f5-conx-core';
import { EventEmitter } from 'events';
import { uuidAxiosRequestConfig } from 'f5-conx-core';
import { URL } from 'url';
import { NimLicense, NimSystem } from './nimModels';
import { NginxHost } from './settings';
import { getPassword, savePassword } from './utils';

type nodeReq = [url: string | URL, options: RequestOptions, callback?: ((res: IncomingMessage) => void) | undefined];

/**
 * Used to inject http call timers
 * transport:request: httpsWithTimer
 * @szmarczak/http-timer
 */
 const transport = {
    request: function httpsWithTimer(...args: nodeReq): uuidAxiosRequestConfig {
        const request = https.request.apply(null, args);
        timer(request);
        return request as uuidAxiosRequestConfig;
    }
};

/**
 * F5 connectivity mgmt client
 * 
 * @param host
 * @param user
 * @param password
 * @param options.port (default = 443)
 * 
 */
export class NimClient {
    /**
     * hostname or IP address of F5 device
     */
    host: NginxHost;
    password: string | undefined;
    /**
     * tcp port for mgmt connectivity (default=443)
     */
    port: number;

    /**
     * event emitter instance for all events related to this class
     * 
     * typically passed in from parent F5Client class
     */
    events: EventEmitter;
    /**
     * custom axsios instance for making calls to the connect F5 device
     * 
     * managed authentication/token
     */
    axios: AxiosInstance;

    /**
     * license details from nim instance
     */
    license: NimLicense | undefined;

    /**
     * system details from nim instance
     */
    system: NimSystem | undefined;


    readonly api = {
        license: '/api/v0/about/license',
        system: '/api/v0/about/system',
        analyze: '/api/v0/system/analyze',
        instances: '/api/v0/instances',
        scan: '/api/v0/scan',
        scanServers: '/api/v0/scan/servers'
    };



    /**
     * @param options function options
     */
    constructor(
        host: NginxHost,
        eventEmitter: EventEmitter,
    ) {
        this.host = host;
        this.port = host.port || 443;
        this.events = eventEmitter;
        this.axios = this.createAxiosInstance();
    }




    /**
     * creates the axios instance that will be used for all f5 calls
     * 
     * includes auth/token management
     */
    private createAxiosInstance(): AxiosInstance {

        const baseInstanceParams: uuidAxiosRequestConfig = {
            baseURL: `https://${this.host.device}`,
            transport
        };
        
        // create axsios instance
        const axInstance = axios.create(baseInstanceParams);

        // re-assign parent this objects needed within the parent instance objects...
        const events = this.events;

        // ---- https://github.com/axios/axios#interceptors
        // Add a request interceptor
        axInstance.interceptors.request.use(function (config: uuidAxiosRequestConfig) {

            // adjust tcp timeout, default=0, which relys on host system
            config.timeout = Number(process.env.F5_CONX_CORE_TCP_TIMEOUT);

            config.uuid = config?.uuid ? config.uuid : getRandomUUID(4, { simple: true });

            events.emit('log-http-request', config);

            return config;
        }, function (err) {
            // Do something with request error
            // not sure how to test this, but it is probably handled up the chain
            return Promise.reject(err);
        });

        //  response interceptor
        axInstance.interceptors.response.use(function (resp: AxiosResponseWithTimings) {
            // Any status code that lie within the range of 2xx cause this function to trigger
            // Do something with response data

            events.emit('log-http-response', resp);

            return resp;
        }, function (err) {
            // Any status codes that falls outside the range of 2xx cause this function to trigger

            // if we got a failed password response
            if (
                err.response?.status === 401 &&
                err.response?.data.message === 'Authentication failed.'
            ) {
                // fire failed password event so upper logic can clear details
                events.emit('failedAuth', err.response.data);
            }

            // Do something with response error
            return Promise.reject(err);
        });
        return axInstance;
    }





    /**
     * Make HTTP request
     * 
     * @param uri     request URI
     * @param options axios options
     * 
     * @returns request response
     */
    async makeRequest(url: string, options: AxiosRequestConfig = {}): Promise<AxiosResponseWithTimings> {

        // // merge incoming options into requestDefaults object
        // options = Object.assign(requestDefaults, options);

        // options.url = `http://${this.host}:${this.port}${url}`;
        options.url = url;

        if(this.host?.auth?.basic && this.password) {
            options.auth = {
                username: this.host.auth.basic,
                password: this.password
            };
        }

        // options.httpsAgent = new https.Agent({ keepAlive: true });

        return await this.axios(options);
    }


    /**
     * try to connect and gather nim system information
     */
    async connect() {

        this.password = await getPassword(this.host.device);

        await this.makeRequest(this.api.license)
        .then(resp => {
            this.license = resp.data;
        });

        await this.makeRequest(this.api.system)
        .then( resp => {
            this.system = resp.data;
        });

        savePassword(this.host.device, this.password);
        
    }



}

