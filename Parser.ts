import FS from 'fs'
import Chalk from 'chalk'

function include(file: string) {
    if(!file.includes('.')) file += '.js'
    if(FS.existsSync(file)) {
        Parser.run(file)
    } else {
        console.error(Chalk.red(`Could not find file "${file}"`))
    }
}
function workspace(name: string) {
    Parser.data.workspace = name
}

function project(name: string) {
    Parser.data.projects.push({
        name: name,
        projectDependencies: [],
        gitDependencies: [],
        includeDirs: []
    })
}
function kind(kind: 'staticLib'|'dynamicLib'|'consoleApp') {
    if(PROJECT_KINDS[kind] == undefined) {
        console.error(Chalk.red(`${kind} is not a valid project kind! Has to be one of: "${Object.keys(PROJECT_KINDS).join('", "')}"`))
        return
    }

    Parser.data.projects[Parser.data.projects.length - 1].kind = PROJECT_KINDS[kind]
}
function language(lang: 'C'|'C++'|'C#') {
    if(PROJECT_LANGUAGES[lang] == undefined) {
        console.error(Chalk.red(`${lang} is not a valid project kind! Has to be one of: "${Object.keys(PROJECT_LANGUAGES).join('", "')}"`))
        return
    }

    Parser.data.projects[Parser.data.projects.length - 1].lang = PROJECT_LANGUAGES[lang]
}
function projectDependency(name: string) {
    Parser.data.projects[Parser.data.projects.length - 1].projectDependencies.push(name)
}
function gitDependency(url: string) {
    Parser.data.projects[Parser.data.projects.length - 1].gitDependencies.push(url)
}
function includeDir(dir: string|string[]) {
    if(typeof dir !== 'object') dir = [dir]
    dir.forEach(d => Parser.data.projects[Parser.data.projects.length - 1].includeDirs.push(d))
}

export class Parser {
    static parseFile(file: string) {
        Parser.run(file)

        console.log(`Workspace Name: ${JSON.stringify(Parser.data, null, 4)}`)
    }

    static run(file: string) {
        console.log(Chalk.gray(`${file}...`))
        eval(`${FS.readFileSync(file, { encoding: 'utf-8' })}`)
    }

    static data: Data = {
        projects: []
    }
}

const PROJECT_KIND_STATIC_LIB = 0x01
const PROJECT_KIND_DYANKIC_LIB = 0x02
const PROJECT_KIND_CONSOLE_APP = 0x03
const PROJECT_KINDS = {
    staticLib: PROJECT_KIND_STATIC_LIB,
    dynamicLib: PROJECT_KIND_DYANKIC_LIB,
    consoleApp: PROJECT_KIND_CONSOLE_APP
}
const PROJECT_LANGUAGE_C = 0x11
const PROJECT_LANGUAGE_CPP = 0x12
const PROJECT_LANGUAGE_CS = 0x13
const PROJECT_LANGUAGES = {
    'C': PROJECT_LANGUAGE_C,
    'C++': PROJECT_LANGUAGE_CPP,
    'C#': PROJECT_LANGUAGE_CS
}

type Project = {
    name?: string
    kind?: number
    lang?: number
    gitDependencies: string[]
    projectDependencies: string[]
    includeDirs: string[]
}
export class Data {
    workspace?: string
    projects?: Project[]
}
