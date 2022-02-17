import cors from "cors";
import express, { Application } from "express"
import * as http from 'http';
import * as SocketIO from 'socket.io'
import Dict from "ts-dict";
import fs from 'fs'

import { P2P, Log, log, LDP, RPC } from './index.js'

export default class Core {
    // System
    private log    : log
    private _mods  : Dict<Module> = {}
    // Socket
    private app    : Application = express();
    private server : http.Server
    private port   : number
    // LDP
    private socket : SocketIO.Server
    private ldp?   : LDP
    // p2p
    private p2p    : P2P
    // RCP
    private rpc    : RPC
    

    constructor(bootstrap: string[], port: number=45100, proto:string='ldp.proto') {
        // System
        this.log = Log.link(this)
        // Socket
        this.port = port
        this.app.use(cors())
        this.server = http.createServer(this.app)
        // LDP
        this.socket = new SocketIO.Server(this.server, {cors:{origin:"*"}})
        this.server.listen(this.port, () => this.log.debug(`Socket open on port ${this.port}`))
        LDP.init(proto, this.socket).then(ldp => this.ldp = ldp)
        // p2p
        this.p2p = new P2P(bootstrap)
        // rpc
        this.rpc = new RPC(this.app, this.mods)
    }

    private async init() {
        await this.p2p.init();
    }

    // public

    public mods() {
        return Object.keys(this._mods)
    }

    // Static Functions

    public static async load(path:string, inst:number=0) {
        const log = Log.link(this)
        const cfg = JSON.parse(fs.readFileSync(path).toString())
        if (inst === 0) log.eoa(`Loading network ${cfg.name}`)
        Log.drop(this, true)
        const core = new Core(cfg.bootstrap, cfg.port + inst)
        await core.init()
        return core
    }
}


interface Module {
    route: string
    
}