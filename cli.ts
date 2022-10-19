import Figlet from 'figlet'
import GradientString from 'gradient-string'
import FS from 'fs'
import ArgsParser from 'args-parser'
const task = process.argv[2]
const args = ArgsParser(process.argv)

import OS from 'os'
switch(OS.platform()) {
    case "win32": args['platform'] = 'windows'; break
    case "linux": args['platform'] = 'linux'; break
    case "darwin": args['platform'] = 'osx'; break
    default: args['platform'] = 'unknown'
}

import * as PackageJsonTypes from 'package-json-types'
import * as Commands from './Commands.js'

import { Command } from 'commander'
import * as Parser from "./Parser.js";
const program = new Command('JSMake')

const Package: PackageJsonTypes.Body = JSON.parse(FS.readFileSync('./package.json', { encoding: 'utf-8' }))

console.log(GradientString.pastel.multiline(Figlet.textSync(Package.name, { font: 'Doom' })), `v${Package.version}`)

Parser.runTask(task.toLowerCase(), args)
