import protobuf, { Type } from "protobufjs"
import Dict from "ts-dict"
import { Credential } from '../utils/imports.js'

export default class ProtoBuf {
    private msgs   : Dict<Type>
    private constructor(msgs:Dict<Type>) {
        this.msgs = msgs
    }

    public static async init(path:string) {
        const root = await protobuf.load(path)
        
        const msgs = {
            _reg    : root.lookupType('_reg'),
            _pck    : root.lookupType('_pck'),
            _ack    : root.lookupType('_ack'),

            fwd    : root.lookupType('fwd'),
            psh    : root.lookupType('psh'),
            cfg    : root.lookupType('cfg'),
            set    : root.lookupType('set'), 
            get    : root.lookupType('get'),
            dnl    : root.lookupType('dnl'),
            upl    : root.lookupType('upl'),
        }

        return new ProtoBuf(msgs)
    }

    public _encode(_msg:Object, typ:string) { return this.msgs[typ].encode(_msg).finish() }
    public  encode(_msg:Object, typ:string, key:Credential) {
        const msg = Buffer.from(this._encode(_msg, typ)).toString('hex')
        return this.msgs._pck.encode({
            key: key.publicKey,
            dat: msg,
            sig: key.sign(msg),
        }).finish()
    }

    public decode(msg:Buffer, typ:string) { return this.msgs[typ].decode(msg) }
    
}