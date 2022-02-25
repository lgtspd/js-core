import {Core, Log, Credential, Template} from '../build/index.js'
import io from 'socket.io-client'

Log.init('verbose')
const core = await Core.init('./config/testnet.json')

class Temp extends Template {
    constructor() {
        super('ldnp.proto')
    }

    main() {
        this.emit('hello, world!')
    }

    on(msg) {
        console.log(msg)
    }
}


const tmp = new Temp();