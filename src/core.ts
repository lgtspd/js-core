import cors from "cors";
import express, { Application } from "express"
import * as http from 'http';
import * as SocketIO from 'socket.io'
import Dict from "ts-dict";
import fs from 'fs'
import {v4 as uuidv4} from 'uuid';

const DEBUG = true;

import { P2P, Log, log, LDNP, RPC } from './index.js'

export default class Core {
    // System
    private log    : log
    private mods   : string[] = []
    // Socket
    private app    : Application
    private server : http.Server
    private port   : number
    // LDNP
    public socket  : SocketIO.Server
    public ldnp   : LDNP
    // p2p
    public p2p     : P2P
    // RCP
    public rpc     : RPC
    

    constructor(app:Application, port: number=45100, p2p:P2P, ldnp:LDNP, rpc:RPC) {
        // System
        this.app = app
        this.log = Log.link(this)
        this.p2p = p2p
        this.rpc = rpc
        // Socket
        this.port = port
        this.app.use(cors())
        this.server = http.createServer(this.app)
        // LDNP
        this.socket = new SocketIO.Server(this.server, {cors:{origin:"*"}})
        this.server.listen(this.port, () => this.log.debug(`Socket open on port ${this.port}`))  
        
        this.ldnp = ldnp
        this.ldnp.host(this)
    }

    // public

    public list() {
        return this.mods
    }

    // Static Functions

    public static async load(path:string, inst:number=0) {
        // Load config file
        const log = Log.link(this)
        const cfg = JSON.parse(fs.readFileSync(path).toString())
        if (inst === 0) log.eoa(`Loading network ${cfg.name}`)
        Log.drop(this, true)
        // system
        const app = express();
        // ldnp
        const ldnp = await LDNP.init(cfg.ldnp)
        // rpc
        const rpc = new RPC(app, ldnp)
        // p2p
        const p2p = new P2P(cfg.bootstrap)
        await p2p.init(DEBUG);
        // core init
        const core = new Core(app, cfg.port + inst, p2p, ldnp, rpc)
        return core
    }
}