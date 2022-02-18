


export default class p2p {
    private _bootstrap : string[]
    public constructor(bootstrap : string[]);
    public init(emitSelf:boolean=false);
    public subscribe(channel: string, func: Function);
    public unsubscribe(channel: string);
    public push(channel: string, message: Buffer);
    public close() : void;
}