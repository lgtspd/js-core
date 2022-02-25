export default class Network {
    private _bootstrap : string[]
    public static init(bootstrap : string[], emitSelf:boolean=false);
    public subscribe(channel: string, func: Function);
    public unsubscribe(channel: string);
    public push(channel: string, message: Buffer);
    public close() : void;
}