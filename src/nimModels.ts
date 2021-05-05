/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';


export type Instances = {
    listinfo: {
        limit: number,
        offset: number,
        total: number
    },
    list: Instance[]
};

export type Instance = {
    instance_id: string,
    hostname: string,
    host_ips: [
        string
    ],
    uname: string,
    containerized: true,
    container_id: string,
    boot_time: string,
    lastseen: string,
    nginx: {
        bin: string,
        conf: string,
        type: string,
        version: string
    },
    added: string
};

export type InstanceConfig = {
    name: string;
    created: string;
    modified: string;
    contents: string;
};

export type InstanceFiles = {
    name: string;
    contents: string;
    created: string;
    modified?: string;
};

export type NimSystem = {
    grpc_port: string;
    gw_port: string;
    bind_address: string;
    cert_file: string;
    key_file: string;
    log_path: string;
    log_level: string;
    audit_log: string;
    host_info: {
        hostname: string;
        uname: string;
        os_release: string;
        containerized: boolean;
        container_id: string;
        host_ips: string[];
        boot_time: string;
    };
    metrics: {
        storage_path: string;
    };
};

export const nimSystemResponse = {
    grpc_port: "10000",
    gw_port: "11000",
    bind_address: "",
    cert_file: "",
    key_file: "",
    log_path: "/var/log/nginx-manager/",
    log_level: "info",
    audit_log: "",
    host_info: {
        hostname: "1deaa8e5b1db",
        uname: "Linux 1deaa8e5b1db 5.8.0-48-generic #54~20.04.1-Ubuntu SMP Sat Mar 20 13:40:25 UTC 2021 x86_64 x86_64 x86_64 GNU/Linux",
        os_release: "Ubuntu 20.04.2 LTS",
        containerized: true,
        container_id: "1deaa8e5b1dbc8fcc46cdec497d198d80a4e78aa723dc9b041ae64b50a874e11\n",
        host_ips: [
            "172.17.0.2",
        ],
        boot_time: "2021-04-10T14:07:54.035421496Z",
    },
    metrics: {
        storage_path: "/var/nginx-manager/",
    },
};

export type NimLicense = {
    attributes: {
        expiry: string;
        subscription: string;
        limits: string;
        type: string;
    };
    licenses: {
        feature_flag: string;
        product_code: string;
        unlimited: boolean;
        serial: string;
        version: string;
    };
};

export const nimLicenseResponse = {
    attributes: {
        expiry: "2021-04-21T14:54:00.159Z",
        subscription: "NGX-Subscription-1-TRL-057117",
        limits: "0",
        type: "eval",
    },
    licenses: [
        {
            feature_flag: "im_instances",
            product_code: "INSTANCE_MANAGER",
            unlimited: true,
            serial: "2462532587506994",
            version: "2",
        },
    ],
};


export type NimScan = {
    status: string;
    err: null;
    cancelled: boolean;
    request_args: null;
    duration: null;
    scan_percentage_complete: string;
    ips_scanned: number;
    fingerprint_percentage_complete: string;
    servers_found: number;
    nginx_found: number;
};

const nimScan = {
    status: "not yet run",
    err: null,
    cancelled: false,
    request_args: null,
    duration: null,
    scan_percentage_complete: "",
    ips_scanned: 0,
    fingerprint_percentage_complete: "",
    servers_found: 0,
    nginx_found: 0,
};


export type NimScanServers = {
    listinfo: {
        limit: number;
        offset: number;
        total: number;
    };
    list: NimScanServer[];
};

export type NimScanServer = {
    instance_id?: string;
    ip: string;
    ports: string[];
    app?: string;
    version?: string;
    fingerprinted?: boolean;
    cves?: number;
    managed_id?: string;
    lastseen?: string;
    added?: string;
};

const nimScanServers = {
    listinfo: {
        limit: 0,
        offset: 0,
        total: 10,
    },
    list: [
        {
            instance_id: "",
            ip: "10.1.1.5",
            port: "80",
            app: "nginx",
            version: "1.16.1",
            fingerprinted: false,
            cves: 0,
            managed_id: "ad8e7eb8-1343-45ba-bf6a-011bdd7e8f00",
            lastseen: "2021-04-16T22:17:00.904446578Z",
            added: "2021-04-16T22:17:00.904448714Z",
        },
        {
            instance_id: "",
            ip: "10.1.1.6",
            port: "80",
            app: "nginx",
            version: "1.19.8",
            fingerprinted: false,
            cves: 0,
            managed_id: "e5355f65-ac41-4602-bb79-c23f2edfab4e",
            lastseen: "2021-04-16T22:17:00.908996145Z",
            added: "2021-04-16T22:17:00.908998064Z",
        },
        {
            instance_id: "",
            ip: "10.1.1.7",
            port: "80",
            app: "nginx",
            version: "1.19.5",
            fingerprinted: false,
            cves: 0,
            managed_id: "dc6f97e6-d9c5-45db-858d-7c27ef9df302",
            lastseen: "2021-04-16T22:17:00.912907451Z",
            added: "2021-04-16T22:17:00.912909348Z",
        },
        {
            instance_id: "",
            ip: "10.1.1.8",
            port: "80",
            app: "nginx",
            version: "1.19.5",
            fingerprinted: false,
            cves: 0,
            managed_id: "fd909663-5d3b-4706-8189-c49acf86c4a5",
            lastseen: "2021-04-16T22:17:01.012661372Z",
            added: "2021-04-16T22:17:01.012663470Z",
        },
        {
            instance_id: "",
            ip: "10.1.1.9",
            port: "80",
            app: "nginx",
            version: "1.7.1",
            fingerprinted: false,
            cves: 7,
            managed_id: "",
            lastseen: "2021-04-16T22:17:01.023130113Z",
            added: "2021-04-16T22:17:01.023132073Z",
        },
        {
            instance_id: "",
            ip: "10.1.1.10",
            port: "80",
            app: "nginx",
            version: "1.19.5",
            fingerprinted: false,
            cves: 0,
            managed_id: "",
            lastseen: "2021-04-16T22:17:01.097946666Z",
            added: "2021-04-16T22:17:01.097951935Z",
        },
        {
            instance_id: "",
            ip: "10.1.1.4",
            port: "443",
            app: "nginx",
            version: "1.19.5",
            fingerprinted: false,
            cves: 0,
            managed_id: "",
            lastseen: "2021-04-16T22:17:01.192257048Z",
            added: "2021-04-16T22:17:01.192258841Z",
        },
        {
            instance_id: "",
            ip: "10.1.1.8",
            port: "443",
            app: "nginx",
            version: "1.19.5",
            fingerprinted: false,
            cves: 0,
            managed_id: "fd909663-5d3b-4706-8189-c49acf86c4a5",
            lastseen: "2021-04-16T22:17:01.018293176Z",
            added: "2021-04-16T22:17:01.018295102Z",
        },
        {
            instance_id: "",
            ip: "10.1.1.10",
            port: "443",
            app: "nginx",
            version: "1.19.5",
            fingerprinted: false,
            cves: 0,
            managed_id: "",
            lastseen: "2021-04-16T22:17:01.101335809Z",
            added: "2021-04-16T22:17:01.101337508Z",
        },
        {
            instance_id: "",
            ip: "10.1.1.254",
            port: "80",
            app: "Node.js",
            version: "",
            fingerprinted: true,
            cves: -1,
            managed_id: "",
            lastseen: "2021-04-16T22:17:07.468583752Z",
            added: "2021-04-16T22:17:07.468586406Z",
        },
    ],
};