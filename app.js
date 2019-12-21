const express = require('express')
const bodyParser = require('body-parser')
const serveIndex = require('serve-index')
const mkdirSync = require('fs').mkdirSync
const exec = require('child_process').exec
const conf = require('./conf.js')
const prepareRoute = require('./routes/prepare.js')
const downloadRoute = require('./routes/download.js')
const progressRoute = require('./routes/progress.js')
const updateRoute = require('./routes/update.js')

console.debug('NODE_ENV=' + process.env.NODE_ENV)

const app = express()

app.set('views', './views')
app.set('view engine', 'ejs')

app.get('/', (req, res) => res.render('index'))

app.use('/prepare', bodyParser.urlencoded({ extended: true }))
app.post('/prepare', prepareRoute)

app.use('/download', bodyParser.urlencoded({ extended: true }))
app.post('/download', downloadRoute)

app.get('/progress/:downloadId', progressRoute)

app.post('/update', updateRoute)

app.use('/assets', express.static('assets'))

app.use('/files', serveIndex(conf.DEST))
app.use('/files', express.static(conf.DEST))

// not found route
app.use((req, res, next) => {
  res.status(404).render('message', { text: '404 not found', isError: true })
})

// error route
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).render('message', { text: err.message, isError: true })
})

mkdirSync(conf.DEST, { recursive: true })

if (process.env.NODE_ENV === 'production') {
  console.log('Updating youtube-dl...')
  exec('youtube-dl --update', (err, stdout, stderr) => {
    if (err) console.error(err)
    if (stderr) process.stderr.write(stderr)
    if (stdout) process.stdout.write(stdout)
  })
}

app.listen(conf.PORT, () => console.log(`Listening on port ${conf.PORT}`))
