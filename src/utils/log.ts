// Lightspeed Logging Service

import type Dict from 'ts-dict'

// Singleton instance handler
export default class Log {
    private static inst: _log
    private static module: Dict<logInstance> = {}

    public static init(level:string): void {
        Log.inst = new _log(level)
        if (!/off/i.test(level)) {
            console.clear()
            console.log(`\x1b[0;36m${new Date().toLocaleDateString()} @ ${new Date().toTimeString()}`)
            console.log(`\x1b[1;35mLightspeed Log ${Date.now().toString()}\x1b[0m`)
        }
    }

    public static link(mod:any) {
        const name = mod.name? mod.name: mod.constructor.name
        if (!Log.module[name]) 
            Log.module[name] = new logInstance(name, Log.inst)
        return Log.module[name]
    }

    public static drop(mod:any, silent:boolean=false) {
        if (Log.module[mod.name]) {
            if (!silent)Log.module[mod.name].sys(`Closing logging instance.`)
            delete Log.module[mod.name]
        }
    }
}

// Main singleton instance
export type log = logInstance
class _log {
    private level: number

    constructor(level:string) {
        // convert logging level from string to int
        switch(true) {
            case /off/i.test(level):
                this.level = Infinity
                break;
            case /critical/i.test(level):
                this.level = 5;
                break;
            case /error/i.test(level):
                 this.level = 4;
                 break;
            case /warning/i.test(level):
                this.level = 3;
                break;
            case /info/i.test(level):
                this.level = 2;
                break;
            case /debug/i.test(level):
                this.level = 1;
                break;
            case /verbose/i.test(level):
                this.level = 0;
                break;
            default: throw new Error("Invalid logging level.")
        }
    }

    public log(message:any[], level:number, inst:string) {
        if (this.level > level) return;
        switch (level)
        {
            case 7: // system
                console.log("\x1b[1;32m[  **  ]:", message.join(' ') + "\x1b[0m")
                break;
            case 6: // other
                console.log("\x1b[1;32m[  **  ]:", inst.padEnd(4, ' ') + ":", message.join(' ') + "\x1b[0m")
                break;
            case 5: // critical (bright + fgRed + reset)
                console.log("\x1b[1;31m" + "[ CRIT ]:", inst.padEnd(4, ' ') + ":", message.join(' ') + "\x1b[0m")
                break;
            case 4: // error (fgRed + reset)
                console.log("\x1b[31m" + "[ERROR ]:", inst.padEnd(4, ' ') + ":", message.join(' ') + "\x1b[0m")
                break;
            case 3: // warning (fgYellow + reset)
                console.log("\x1b[33m" + "[WARN  ]:", inst.padEnd(4, ' ') + ":", message.join(' ') + "\x1b[0m")
                break;
            case 2: // info
                console.log("[INFO  ]:", inst.padEnd(4, ' ') + ":", message.join(' ') + "\x1b[0m")
                break;
            case 1: // debug (dim + reset)
                console.log("\x1b[2m" + "[DEBUG ]:", inst.padEnd(4, ' ') + ":", message.join(' ') + "\x1b[0m")
                break;
            case 0: // verbose (bright black + reset)
                console.log("\x1b[90m" + "[VRBOSE]:", inst.padEnd(4, ' ') + ":", message.join(' ') + "\x1b[0m")
                break;
            default: throw new Error("logger: Logging level not set!")
        }
    }

}


// module-specific logging channel instance
class logInstance {
    private name:string
    private _log:_log
    constructor(name:string, _log:_log) {
        this.name = name
        this._log = _log
    }

    public sys      (...message : any) { this._log.log(message, 7, this.name) };
    public eoa      (...message : any) { this._log.log(message, 6, this.name) };
    public critical (...message : any) { this._log.log(message, 5, this.name) };
    public error    (...message : any) { this._log.log(message, 4, this.name) };
    public warning  (...message : any) { this._log.log(message, 3, this.name) };
    public info     (...message : any) { this._log.log(message, 2, this.name) };
    public debug    (...message : any) { this._log.log(message, 1, this.name) };
    public verbose  (...message : any) { this._log.log(message, 0, this.name) };

}









