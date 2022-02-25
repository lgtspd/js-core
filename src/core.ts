import cors from "cors";
import express, { Application } from "express"
import * as http from 'http';
import * as SocketIO from 'socket.io'
import { log, Log, Network, Credential, Store, ProtoBuf } from "./utils/imports.js";
import fs from 'fs'
import protobuf, { Type } from 'protobufjs'
import Dict from "ts-dict";

const DEBUG = true

export default class Core {

    private log    : log
    private app    : Application
    private server : http.Server
    private port   : number
    private net    : Network
    private sock   : SocketIO.Server
    private apps   : Dict<string> = {}
    private dbs    : Dict<Store>  = {}
    private admin  : string
    private pbuf   : ProtoBuf

    /*  Initialization                  */

    private constructor(net:Network, port:number, admin:string, pbuf:ProtoBuf) {
        this.net = net
        this.port = port
        this.admin = admin
        this.pbuf = pbuf

        this.log = Log.link(this)
        this.app = express().use(cors())
        this.server = http.createServer(this.app)
        this.sock = new SocketIO.Server(this.server, {cors:{origin:"*"}})

        this.sock.on('connection', (sock:any) => {
            sock.on('_reg', (msg:any) => this._reg(this.pbuf.decode(msg, '_reg')))
            sock.on('psh',  (msg:any) => this._decode(msg, 'psh',  (msg:any, from:string) => this.psh(msg, from)))
            sock.on('cfg',  (msg:any) => this._decode(msg, 'cfg',  (msg:any, from:string) => this.cfg(msg, from)))
            sock.on('set',  (msg:any) => this._decode(msg, 'set',  (msg:any, from:string) => this.set(msg, from)))
            sock.on('get',  (msg:any) => this._decode(msg, 'get',  (msg:any, from:string) => this.get(msg, from)))
            sock.on('dnl',  (msg:any) => this._decode(msg, 'dnl',  (msg:any, from:string) => this.dnl(msg, from)))
            sock.on('upl',  (msg:any) => this._decode(msg, 'upl',  (msg:any, from:string) => this.upl(msg, from)))
        })
        this.server.listen(this.port, () => this.log.info(`LDNP @ \x1b[4;34mhttp://localhost:${this.port}`))
    }

    public static async init(path:string) {
        const cfg = JSON.parse(fs.readFileSync(path).toString())
        
        const log = Log.link(this)
        log.eoa(`Load - ${cfg.name}`)
        Log.drop(this, true)

        const net = await Network.init(cfg.bootstrap, DEBUG)

        const pbuf = await ProtoBuf.init(cfg.ldnp)
        
        return new Core(net, cfg.port, cfg.admin, pbuf)
    }

    /*  System Methods                 */

    private async _reg(_msg:any) {
        const msg:{id:string, addr:string} = await _msg
        this.log.info(`Registered module \x1b[35m${msg.id}`)
        this.apps[msg.addr] = msg.id
        this.net.subscribe(msg.id, (p2pmsg:p2pmsg) => this.fwd(msg.id, p2pmsg))
        this.sock.emit(_msg.addr, this.pbuf._encode({stat: 'REG'}, '_ack'))
    }

    /*  Network Methods                */

    private async psh( _msg:any, route:string) {
        const msg:{id:string, data:string} = await _msg
        this.log.debug(`push ${msg.id}`)
        this.net.push(msg.id, Buffer.from(msg.data))
    }

    private async fwd(id:string, p2pmsg:p2pmsg) {
        this.log.debug(`fwd  ${id}`)
        this.sock.emit(id, this.pbuf._encode({data:p2pmsg.data.toString()}, 'fwd'))
    }

    /*  Database Methods                */
    private async cfg(_msg:any, route:string) {
        const msg:{data:string} = await _msg
        this.log.error(`Not yet implemented: cfg`)
        this.dbs[route] = new Store(route)
    }

    private async set(_msg:any, route:string) {
        const msg:{data:string} = await _msg
        this.log.error(`Not yet implemented: set`)
    }

    private async get(_msg:any, route:string) {
        const msg:{data:string} = await _msg
        this.log.error(`Not yet implemented: get`)
    }

    /*  Filestore Methods                */
    private async dnl(_msg:any, route:string) {
        const msg:{id:string, data:string} = await _msg
        this.log.error(`Not yet implemented: dnl`)
    }

    private async upl(_msg:any, route:string) {
        const msg:{id:string, data:string} = await _msg
        this.log.error(`Not yet implemented: upl`)
    }

    /*  Internal Methods                */

    private async _decode(msg:Buffer, typ:string, callback:Function) {
        var _msg:any = this.pbuf.decode(msg, '_pck')
        // check signed
        const s_addr = Credential.getAddress(_msg.key)
        if (Credential.verify(_msg))
        {
            if (s_addr === this.admin || 
            Object.keys(this.apps).includes(Credential.getAddress(_msg.key))) {
                callback(this.pbuf.decode(Buffer.from(_msg.dat, 'hex'), typ), this.apps[s_addr])
                // this.sock.emit(this.apps[s_addr], this.pbuf._encode({stat: 'OK'}, '_ack'))
            } else this.log.warning(`Received untrusted message.`) 
        }
        else this.log.warning(`Received invalid message.`)
    }    
}

interface p2pmsg {
    receivedFrom: string
    data: Buffer
    topicIDs: string[]
    from: string
    seqno: Buffer
    signature: Buffer
    key: Buffer
}