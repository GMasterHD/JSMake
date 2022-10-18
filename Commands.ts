import Chalk from 'chalk'
import  FS from 'fs'
import * as Parser from './Parser.js'

function include(file: string) {
    console.log(`Including ${file}...`)
}

export function generate(file?: string) {
    if(file == undefined) file = 'jsmake.js'
    Parser.Parser.parseFile(file)
}
