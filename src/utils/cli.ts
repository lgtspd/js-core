#!/usr/bin/env node

import Core from "../core.js";
import Log from "./log.js";

const args = process.argv.slice(2, process.argv.length);

//log.get(args[1]||'info')

Log.init(args[1]||"info")

Core.load(args[0], 0)