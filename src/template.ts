import { io, Socket } from 'socket.io-client';
import { Credential, ProtoBuf } from './utils/imports.js'


export default abstract class Template {
    private cred: Credential
    private link: Socket
    private pbuf?: ProtoBuf
    private id: string
    private _pbuf: string

    public constructor(pbuf:string, url:string="http://localhost:45100") {
        this._pbuf = pbuf
        this.id = this.constructor.name.toLowerCase()
        this.cred = new Credential();
        this.link = io(url)
        this.init(pbuf, this.id)
    }

    public async init(_pbuf:string, id:string) {
        // handle inbound
        const pbuf = await ProtoBuf.init(_pbuf)
        this.link.on(id, async (msg) => {
            const pbuf = await ProtoBuf.init(_pbuf)
            msg = await pbuf.decode(msg, 'fwd')
            this.on(msg.data)
        })
        // await registration
        this.link.on(this.cred.address, async (msg) => {
            const pbuf = await ProtoBuf.init(_pbuf)
            await pbuf.decode(msg, '_ack')
            this.main()
        })
        // register
        this.link.emit('_reg', pbuf._encode({ id:this.id, addr: this.cred.address }, '_reg'))
    }

    protected async emit(data:string) {
        const pbuf = await ProtoBuf.init(this._pbuf)
        this.link.emit('psh', pbuf.encode({id:this.id, data:data}, "psh", this.cred))
    }

    abstract main(): void
    abstract on(msg:{}): void
}
