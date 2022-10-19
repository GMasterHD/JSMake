import FS from 'fs'
import Chalk from 'chalk'

function include(file: string) {
    if (!file.includes('.')) file += '.js'
    if (FS.existsSync(file)) {
        Parser.run(file)
    } else {
        console.error(Chalk.red(`Could not find file "${file}"`))
    }
}
function print(str: string) {
    console.log(Parser.parseString(str))
}

function workspace(name: string) {
    Parser.data.workspace = name
}

function location(dir: string) {
    if(Parser.inProjectScope()) {
        Parser.data.projects[Parser.data.projects.length - 1].location = Parser.parseString(dir)
        Parser.macros['prj.location'] = Parser.data.projects[Parser.data.projects.length - 1].location
    } else {
        Parser.data.location = Parser.parseString(dir)
        Parser.macros['wks.location'] = Parser.data.location
    }
}

function filter(filters: string|string[], fn: () => void) {
    if(typeof filters !== 'object') filters = [filters]

    const filter: Filter = {
        predicates: [],
        fn: fn
    }

    filters.forEach(f => {
        f = f.trim()
        const ors = f.split('|')

        const predicate: Predicate[] = []
        ors.forEach(o => {
            let macro = ''
            let operator = ''
            let value = ''

            if(o.includes('==')) {
                operator = '=='
            } else if(o.includes('!=')) {
                operator = '!='
            } else {
                console.error(Chalk.red(`Cannot parse filter predicated ${o}`))
            }

            macro = o.substring(0, o.indexOf(operator))
            value = o.substring(o.indexOf(operator) + operator.length)

            predicate.push({
                macro: macro,
                value: value,
                negate: operator == '!='
            })
        })

        filter.predicates.push(predicate)
    })

    if(Parser.inProjectScope()) {
        Parser.data.projects[Parser.data.projects.length - 1].filters.push(filter)
    } else {
        Parser.data.filters.push(filter)
    }

    let ergs: boolean[] = []
    filter.predicates.forEach(ps => {
        let erg = undefined

        ps.forEach(p => {
            if(erg) return

            console.log(`${Parser.macros[p.macro]} == ${p.value}`)
            if(p.negate) {
                erg = Parser.macros[p.macro] != p.value;
            } else {
                erg = Parser.macros[p.macro] == p.value;
            }
        })

        ergs.push(erg)
    })

    console.log({ergs})

    if(!ergs.includes(false)) {
        fn()
    }
}

function project(name: string) {
    Parser.data.projects.push({
        name: name,
        projectDependencies: [],
        gitDependencies: [],
        includeDirs: [],
        srcFiles: [],
        filters: []
    })

    Parser.macros['prj.name'] = name
}
function kind(kind: 'staticLib' | 'dynamicLib' | 'consoleApp') {
    if (PROJECT_KINDS[kind] == undefined) {
        console.error(Chalk.red(`${kind} is not a valid project kind! Has to be one of: "${Object.keys(PROJECT_KINDS).join('", "')}"`))
        return
    }

    Parser.data.projects[Parser.data.projects.length - 1].kind = PROJECT_KINDS[kind]
}

function language(lang: 'C' | 'C++' | 'C#') {
    if (PROJECT_LANGUAGES[lang] == undefined) {
        console.error(Chalk.red(`${lang} is not a valid project kind! Has to be one of: "${Object.keys(PROJECT_LANGUAGES).join('", "')}"`))
        return
    }

    Parser.data.projects[Parser.data.projects.length - 1].lang = PROJECT_LANGUAGES[lang]
    Parser.macros['lang'] = lang
}

function projectDependency(name: string) {
    Parser.data.projects[Parser.data.projects.length - 1].projectDependencies.push(name)
}

function gitDependency(url: string) {
    Parser.data.projects[Parser.data.projects.length - 1].gitDependencies.push(Parser.parseString(url))
}

function includeDir(dir: string | string[]) {
    if (typeof dir !== 'object') dir = [dir]
    dir.forEach(d => Parser.data.projects[Parser.data.projects.length - 1].includeDirs.push(Parser.parseString(d)))
}

function task(name: string, fn: (args: string[]) => void, depndencies: string[]) {
    if(Parser.data.projects.length > 0) {
        name = `${Parser.data.projects[Parser.data.projects.length - 1].name.toLowerCase()}:${name.toLowerCase()}`
    } else {
        name = `:${name.toLowerCase()}`
    }

    Parser.data.tasks[name] = {
        fn: fn,
        dependencies: depndencies
    }
}

function src(files: string|string[]) {
    if(typeof files !== 'object') files = [files]
    if(!Parser.inProjectScope()) {
        console.error(Chalk.red('Cannot execute this command outside of project scope!'))
        return
    }
    files.forEach(f => {
        Parser.data.projects[Parser.data.projects.length - 1].srcFiles.push(f)
    })
}

function outDir(dir: string) {
    if(!Parser.inProjectScope()) {
        console.error(Chalk.red('Cannot execute this command outside of project scope!'))
        return
    }
    Parser.data.projects[Parser.data.projects.length - 1].outDir = Parser.parseString(dir)
}
function objDir(dir: string) {
    if(!Parser.inProjectScope()) {
        console.error(Chalk.red('Cannot execute this command outside of project scope!'))
        return
    }
    Parser.data.projects[Parser.data.projects.length - 1].objDir = Parser.parseString(dir)
}
function runDir(dir: string) {
    if(!Parser.inProjectScope()) {
        console.error(Chalk.red('Cannot execute this command outside of project scope!'))
        return
    }
    Parser.data.projects[Parser.data.projects.length - 1].runDir = Parser.parseString(dir)
}

export class Parser {
    static parseFile(file: string) {
        Parser.run(file)

        console.log(`Workspace Name: ${JSON.stringify(Parser.data, null, 4)}`)
    }

    static runTask(file: string, task: string, args: string[]) {
        console.log(args)

        if(args['arch'] == undefined) args['arch'] = 'x86'
        if(args['cfg'] == undefined) args['cfg'] = 'Debug'
        if(args['platform'] == undefined) args['platform'] = 'unknown'

        Parser.macros['arch'] = args['arch']
        Parser.macros['cfg'] = args['cfg']
        Parser.macros['platform'] = args['platform']

        Parser.run(file)
        console.log(JSON.stringify(Parser.data, null, 4))
        if (Parser.data.tasks[task] == undefined) {
            console.error(Chalk.red(`Cannot find task ${task}`))
            return
        }
        Parser.#_runTask(file, task, args)
    }

    static parseString(str: string): string {
        console.log(Parser.macros)

        Object.keys(Parser.macros).forEach(k => {
            str = str.replace(`$\{${k}}`, Parser.macros[k])
        })
        return str
    }

    static #_runTask(file: string, task: string, args: string[]) {
        const dependencies = Parser.data.tasks[task].dependencies
        if (dependencies != undefined) {
            for (let i = 0; i < dependencies.length; ++i) {
                let d = dependencies[i]
                if (Parser.data.tasks[d] == undefined) {
                    console.error(Chalk.red(`Could not find task ${d} which is a dependent of ${task}!`))
                    return
                }
                Parser.#_runTask(file, d, args)
            }
        }
        console.log(task)
        Parser.data.tasks[task].fn(args)
    }

    static inProjectScope(): boolean {
        return Parser.data.projects.length > 0
    }

    static run(file: string) {
        console.log(Chalk.gray(`${file}...`))
        eval(`${FS.readFileSync(file, {encoding: 'utf-8'})}`)
    }

    static data: Data = {
        projects: [],
        tasks: {},
        filters: []
    }
    static macros = {}
}

export function runTask(name: string, args: string[]) {
    Parser.runTask('./jsmake.js', name, args)
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

type Predicate = {
    macro: string,
    value: any
    negate: boolean
}
type Filter = {
    predicates: [Predicate[]?]
    fn: () => void
}
type Project = {
    name?: string
    kind?: number
    lang?: number
    gitDependencies: string[]
    projectDependencies: string[]
    includeDirs: string[]
    srcFiles: string[]
    outDir?: string
    objDir?: string
    runDir?: string
    location?: string,
    filters: Filter[]
}
type Task = {
    fn: (args: string[]) => void
    dependencies: string[]
}

export class Data {
    workspace?: string
    projects: Project[]
    tasks: { [key: string]: Task }
    location?: string
    filters: Filter[]
}
