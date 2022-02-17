import assert from 'assert';
import * as ls from '../build/index.js'

let logInstance;

ls.Log.init('verbose')

it('should initialize a logger', async function() {
    logInstance = ls.Log.link(ls.Log)
})

describe('LogInstance', async function() {
    it('should be named "Log"', function() {
        assert.equal('Log', logInstance.name)
    })

    it('should log messages', function() {
        logInstance.debug("test")
        logInstance.verbose("test")
        logInstance.info("test")
        logInstance.warning("test")
        logInstance.error("test")
        logInstance.critical("test")
        logInstance.eoa("test")
        logInstance.sys("test")
    })

    it('should close the logging instance', function() {
        ls.Log.drop(logInstance)
    })

})


let core
it('should load a core instance', async function() {
    core = await ls.Core.load('./config/testnet.json')
})