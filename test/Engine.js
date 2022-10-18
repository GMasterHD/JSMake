project('Engine')
    kind('staticLib')
    language('C++')

    includeDir('../include/')

    gitDependency('https://github.com/GMasterHD/GLFW')

project('Game')
    kind('consoleApp')
    language('C++')

    includeDir([
        '../include/',
        '../test/'
    ])

    projectDependency('Engine')
