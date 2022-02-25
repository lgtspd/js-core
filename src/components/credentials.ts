import e from 'cors';
import * as crypto from 'crypto';
import fs from 'fs';


export default class Credential {
    private _publicKey  : Buffer
    private _privateKey : Buffer

    constructor(pk?:Buffer) {
        if (!pk) {
            const keypair = crypto.generateKeyPairSync("ec", {
                namedCurve: "secp256k1",
                publicKeyEncoding: { type: 'spki', format: 'der' },
                privateKeyEncoding: { type: 'pkcs8', format: 'der' },
              });
              [this._publicKey, this._privateKey] = [keypair.publicKey, keypair.privateKey]
        }
        else {
            this._privateKey = pk
            const privKeyObject = crypto.createPrivateKey({
                key: pk,
                format: 'der',
                type: 'pkcs8'
            })
            const pubKeyObject = crypto.createPublicKey(privKeyObject)
            this._publicKey = pubKeyObject.export({
                format: 'der',
                type: 'spki'
            })
        }
    }

    public sign(_msg:string) : string {
        const msg = crypto.createSign('SHA256');
        msg.update(_msg).end();
        const privKeyObject = crypto.createPrivateKey({
            key: this._privateKey,
            format: 'der',
            type: 'pkcs8'
        })
        return msg.sign(privKeyObject).toString('hex')
    }

    public static verify(_msg:Message|any) : boolean {
        const msg = crypto.createVerify('SHA256')
        msg.update(_msg.dat)
        const pubKeyObject = crypto.createPublicKey({
            key: Buffer.from(_msg.key, 'hex'),
            format: 'der',
            type: 'spki'
        })
        return msg.verify(pubKeyObject, _msg.sig, 'hex')
    }
    public static getAddress(key:string|Buffer) {
        const hash = crypto.createHash('SHA3-256')
        hash.write(key);
        hash.end();
        return 'ls_' + hash.end().read().toString('hex')
    }

    // Importing / Exporting
    public save() {fs.writeFileSync(`./store/keys/${this.address}.lsa`, this._privateKey)}
    public static load(name:string) {return new Credential(fs.readFileSync(`./store/keys/${name}.lsa`))}

    // EOA getters/setters
    get address() { return Credential.getAddress(this.publicKey) }
    get publicKey() { return this._publicKey.toString('hex') }
}

export interface Message {
    dat: string
    sig: string
    key : Buffer
}