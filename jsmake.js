workspace('Test-Project')
location('./')

include('test/Engine')

task('clean', (args) => {
    console.log('Running clean...')
}, ['game:test'])
