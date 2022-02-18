import { Server } from 'socket.io';
import protobuf, { Type } from 'protobufjs'
import Dict from 'ts-dict';

import { Log, log, RPC, P2P, Core } from "../index.js"

export default class LDNP {
    private msgs: Dict<Type>
    private log: log

    private srv?: Server
    private proto:string

    public static async init(proto:string) {
        const root = await protobuf.load(proto)
        const msgs = {
            dst_msg : root.lookupType('dst_msg'),
            link_dst: root.lookupType('link_dst'),
            drop_dst: root.lookupType('drop_dst'),
            push_dst: root.lookupType('push_dst'),

            lo_msg  : root.lookupType('lo_msg'),
            link_lo : root.lookupType('link_lo'),
            drop_lo : root.lookupType('drop_lo'),
            push_lo : root.lookupType('push_lo'),

            register: root.lookupType('register'),
        }
        return new LDNP(proto, msgs)
    }

    private constructor(proto:string, msgs:Dict<Type>) {
        this.log = Log.link(this)
        this.msgs = msgs
        this.proto = proto
        
    }

    public host(core:Core) {
        this.srv = core.socket
        this.srv.on("connection", (socket:any) => {
            socket.on("register", (msg:string) => this.register(msg))
            socket.on(`link_dst`, (msg:any, p2p:P2P) => this.link_dst(this.decode(msg, 'link_dst'), core.p2p))
            socket.on(`drop_dst`, (msg:any, p2p:P2P) => this.drop_dst(this.decode(msg, 'drop_dst'), core.p2p))
            socket.on(`push_dst`, (msg:any, p2p:P2P) => this.push_dst(this.decode(msg, 'push_dst'), core.p2p))
            socket.on(`link_lo`,  (msg:any, rpc:RPC) => this.link_lo (this.decode(msg, 'link_lo'),  core.rpc))
            socket.on(`drop_lo`,  (msg:any, rpc:RPC) => this.drop_lo (this.decode(msg, 'drop_lo'),  core.rpc))
            socket.on(`push_lo`,  (msg:any, rpc:RPC) => this.push_lo (this.decode(msg, 'push_lo'),  core.rpc))
        })
    }

    // protobuf methods

    public verify(msg:Object|Buffer, typ:string) {
        return this.msgs[typ].verify(msg)
    }

    public encode(msg:Object, typ:string) {
        return this.msgs[typ].encode(msg).finish()
    }

    public decode(msg:Buffer|string, typ:string) {
        if (typeof msg === "string") msg = Buffer.from(msg)
        return this.msgs[typ].decode(msg)
    }

    // Request methods

    private async link_dst(_msg:any, p2p:P2P) {
        const msg:{id:string, route:string} = await _msg
        p2p.subscribe(`${msg.id}/${msg.route}`, (p2p_msg:p2pMessage) => 
        this.dst_msg(msg.id, p2p_msg.topicIDs[0].split('/')[1], p2p_msg.data.toString(), p2p_msg.from)) // todo: fix callback
    }

    private async drop_dst(_msg:any, p2p:P2P) {
        const msg:{id:string, route:string} = await _msg
        p2p.unsubscribe(`${msg.id}/${msg.route}`)
    }

    private async push_dst(_msg:any, p2p:P2P) { 
        const msg:{route:string, data:string} = await _msg
        p2p.push(msg.route, Buffer.from(msg.data))
    }

    private link_lo (msg:Object, rpc:RPC) { this.log.sys(msg) }

    private drop_lo (msg:Object, rpc:RPC) { this.log.sys(msg) }
    private push_lo (msg:Object, rpc:RPC) { this.log.sys(msg) }

    // Response methods

    private dst_msg (id: string, route:string, data:string, from:string) {
        const msg = this.encode({ route:route, data:data, from:from }, 'dst_msg')
        this.srv?.emit(`${id}/dst_msg`, msg)
        this.log.verbose(`relay @ ${route}/dst_msg`)
    }
    
    
    private lo_msg(func:string, data:string) {
        const msg = this.encode({func:func, data:data}, 'lo_msg')
        
    }

    // System methods

    private async register(_msg:any) {
        var msg = this.decode(_msg, 'register')
        var id = (await msg).toJSON().id;
        this.log.info(`Registered route ${id}`)
    }
}


interface p2pMessage {
    receivedFrom: string
    data: Buffer
    topicIDs: string[]
    from: string
    seqno: Buffer
    signature: Buffer
    key: Buffer
}