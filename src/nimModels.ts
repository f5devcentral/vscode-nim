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
        type: unknown,
        version: string
    },
    added: string
};

export type nimSystem = {
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

export type nimLicense = {
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
}