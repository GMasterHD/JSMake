project('Game')
    kind('consoleApp')
    language('C++')

    location('./')

    outDir('bin/${cfg}-${arch}/${prj.name}/')

    includeDir([
        '../include/',
        '../test/'
    ])

    src('Main.cpp')

    filter(['cfg==Debug|arch!=x64', 'platform==windows'], () => {
        outDir('test')
        console.log('Running filter!')
    })

task('test', (args) => {
    print("Architecture: ${arch}")
})
