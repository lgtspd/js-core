import { ModuleRpcServer } from 'rpc_ts/lib/server/index.js';
import { ModuleRpcProtocolServer } from 'rpc_ts/lib/protocol/server/index.js';

import { Core, LDNP, Log, log } from '../index.js'
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
    
    private log: log = Log.link(this)

    private handler: handler

    constructor(app:Application, ldnp:LDNP) {
        this.log = Log.link(this)
        this.handler = RPC.getHandler(this)
        app.use(ModuleRpcProtocolServer.registerRpcRoutes(service, this.handler))
        this.log.info(`Routing service initialized.`)
    }

    private static getHandler(rpc:RPC): handler  {
        return {
            async exec({ module, func, params }) {
                rpc.log.verbose(`Received exec '${func}' for module ${module}`)
                return {response:""}
            },
            async load({ module }) {
                rpc.log.info(`Loading module ${module}`)
                //todo:fix thiscore.load(module)
                return { status: 200 }
            },
            async drop({ module }) {
                //core.drop(module)
                return { status: 200 }
            },
            async list() {
                //rpc.log.sys(core.list())
                return { mods: ['s'] }
            }
        }
    }
}