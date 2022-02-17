import { NodeHttpTransport } from '@improbable-eng/grpc-web-node-http-transport';
import { ModuleRpcServer } from 'rpc_ts/lib/server/index.js';
import { ModuleRpcProtocolServer } from 'rpc_ts/lib/protocol/server/index.js';
import { ModuleRpcProtocolClient } from 'rpc_ts/lib/protocol/client/index.js';

import { Log, log } from '../index.js'
import { Application } from 'express';

const service = {
    exec: {
        request: {} as { module: string, func:string, params?:Object },
        response: {} as { response: any }
    },
    load: {
        request: {} as { module: string },
        response: {} as { status: number }
    },
    drop: {
        request: {} as { module: string },
        response: {} as { status: number }
    },
    list: {
        request: {} as {},
        response: {} as { mods: string[] }
    }
}

type handler = ModuleRpcServer.ServiceHandlerFor<typeof service>

export default class RPC {
    
    private mods: Function
    private log: log = Log.link(this)

    private handler: handler

    constructor(app:Application, mods:Function) {
        this.mods = mods
        this.log = Log.link(this)
        this.handler = RPC.getHandler(this)
        app.use(ModuleRpcProtocolServer.registerRpcRoutes(
            service,
            RPC.getHandler(this)
        ))
        this.log.info(`Routing service initialized.`)
    }

    public static getHandler(rpc:RPC): handler  {
        return {
            async exec({ module, func, params }) {
                rpc.log.verbose(`Received exec '${func}' for module ${module}`)
                return {response:""}
            },
            async load({ module }) {

                return { status: 200 }
            },
            async drop({ module }) {
                return { status: 200 }
            },
            async list() {
                return { mods: ['s'] }
            }
        }
    }
}