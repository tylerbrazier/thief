const express = require('express')
const serveIndex = require('serve-index')
const mkdirSync = require('fs').mkdirSync
const exec = require('child_process').exec
const conf = require('./conf.js')
const searchRoute = require('./routes/search.js')
const readyRoute = require('./routes/ready.js')
const downloadRoute = require('./routes/download.js')
const progressRoute = require('./routes/progress.js')
const updateRoute = require('./routes/update.js')

console.debug('NODE_ENV=' + process.env.NODE_ENV)

if (!conf.YOUTUBE_API_KEY) console.warn('WARNING: NO YOUTUBE_API_KEY')

const app = express()

app.set('views', './views')
app.set('view engine', 'ejs')

app.get('/', (req, res) => res.render('index', { destRoute: conf.DEST_ROUTE }))

app.get('/ready', readyRoute)

app.get('/search', searchRoute)

app.get('/download', downloadRoute)

app.get('/progress/:id', progressRoute)

app.post('/update', updateRoute)

app.use('/assets', express.static('assets'))

app.use(conf.DEST_ROUTE, serveIndex(conf.DEST_DIR))
app.use(conf.DEST_ROUTE, express.static(conf.DEST_DIR))

// not found route
app.use((req, res, next) => {
  res.status(404).render('error', { error: '404 not found' })
})

// error route
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).render('error', { error: err })
})

mkdirSync(conf.DEST_DIR, { recursive: true })

if (process.env.NODE_ENV === 'production') {
  console.log('Updating youtube-dl...')
  exec(conf.YOUTUBE_DL_EXE + ' --update', (err, stdout, stderr) => {
    if (err) console.error(err)
    if (stderr) process.stderr.write(stderr)
    if (stdout) process.stdout.write(stdout)
  })
}

app.listen(conf.PORT, () => console.log(`Listening on port ${conf.PORT}`))
