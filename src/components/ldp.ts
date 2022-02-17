import { Server } from 'socket.io';
import protobuf, { Type } from 'protobufjs'
import Dict from 'ts-dict';

import { Log, log } from "../index.js"

export default class LDP {
    private msgs: Dict<Type>
    private log: log

    private constructor(msgs: Dict<Type>, srv:Server) {
        this.log = Log.link(this)
        this.msgs = msgs
        srv.on("connection", (socket:any) => {
            socket.on("link_dst", (msg:string) => this.link_dst(this.decode(msg, "link_dst")))
            socket.on("drop_dst", (msg:string) => this.drop_dst(this.decode(msg, "drop_dst")))
            socket.on("push_dst", (msg:string) => this.push_dst(this.decode(msg, "push_dst")))
            socket.on("link_lo",  (msg:string) => this.link_lo (this.decode(msg, "link_lo")))
            socket.on("drop_lo",  (msg:string) => this.drop_lo (this.decode(msg, "drop_lo")))
            socket.on("push_lo",  (msg:string) => this.push_lo (this.decode(msg, "push_lo")))
        })
    }

    // async constructor workaround
    public static async init(proto:string, srv:Server) {
        const root = await protobuf.load(proto)
        const msgs: Dict<protobuf.Type> = {
            link_dst: root.lookupType('link_dst'),
            drop_dst: root.lookupType('drop_dst'),
            push_dst: root.lookupType('push_dst'),

            link_lo : root.lookupType('link_lo'),
            drop_lo : root.lookupType('drop_lo'),
            push_lo : root.lookupType('push_lo'),
        }
        return new LDP(msgs, srv)
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

    // Routing methods

    private link_dst(msg:Object) { this.log.sys(msg) }
    private drop_dst(msg:Object) { this.log.sys(msg) }
    private push_dst(msg:Object) { this.log.sys(msg) }
    private link_lo (msg:Object) { this.log.sys(msg) }
    private drop_lo (msg:Object) { this.log.sys(msg) }
    private push_lo (msg:Object) { this.log.sys(msg) }
}