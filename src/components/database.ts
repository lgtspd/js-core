import sqlite from 'sqlite3'
import { Log, log } from '../utils/imports.js'

export default class Store {

    private db : sqlite.Database
    private log: log

    constructor(path : string | null) {
        this.log = Log.link(this)
        if (path === null) this.db = new sqlite.Database(':memory:', () => this.log.debug('Loaded memory database.'));
        else {
            this.db = new sqlite.Database("./store/db/" + path + ".db", () => this.log.debug(`Loaded database ${path}`))
        }
    }

    public close() {
        this.db.close();
    }

}