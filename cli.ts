import Figlet from 'figlet'
import GradientString from 'gradient-string'
import FS from 'fs'

import * as PackageJsonTypes from 'package-json-types'
import * as Commands from './Commands.js'

import { Command } from 'commander'
const program = new Command('JSMake')

const Package: PackageJsonTypes.Body = JSON.parse(FS.readFileSync('./package.json', { encoding: 'utf-8' }))

console.log(GradientString.pastel.multiline(Figlet.textSync(Package.name, { font: 'Doom' })), `v${Package.version}`)

program.version(Package.version)
    .description(Package.description)
    .name(Package.name)

program.command('generate')
    .description('Generate makefiles using a generator')
    .action((args) => {
        Commands.generate()
    })

program.parse(process.argv)
