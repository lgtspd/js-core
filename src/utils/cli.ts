#!/usr/bin/env node

import Core from '../core.js'

import { Log } from './imports.js'

const args = process.argv.slice(2, process.argv.length);

Log.init(args[1]||"info")

Core.init(args[0])
