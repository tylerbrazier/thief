const express = require('express')
const ejs = require('ejs')
const serveIndex = require('serve-index')
const mkdirSync = require('fs').mkdirSync
const exec = require('child_process').exec
const conf = require('./conf.js')
const authMiddleware = require('./middleware/auth.js')
const searchRoute = require('./routes/search.js')
const readyRoute = require('./routes/ready.js')
const downloadRoute = require('./routes/download.js')
const cancelRoute = require('./routes/cancel.js')
const progressRoute = require('./routes/progress.js')
const updateRoute = require('./routes/update.js')
const gcRoute = require('./routes/gc.js')
const optionsRoute = require('./routes/options.js')
const version = require('./package.json').version

console.debug('NODE_ENV', process.env.NODE_ENV)
console.debug('NODE_DEBUG', process.env.NODE_DEBUG)

if (!conf.YOUTUBE_API_KEY) console.warn('WARNING: NO YOUTUBE_API_KEY')

const app = express()

app.set('views', './views')
app.set('view engine', 'ejs')

app.get('/', (req, res) => res.render('index', { destRoute: conf.DEST_ROUTE, version }))
app.get('/ready', readyRoute)
app.get('/search', searchRoute)
app.get('/download', downloadRoute)
app.get('/cancel/:id', cancelRoute)
app.get('/progress/:id', progressRoute)

app.get('/maintenance', (req, res) => res.render('maintenance', { conf }))
app.get('/update', updateRoute)
app.use('/gc', authMiddleware)
app.get('/gc', gcRoute)
app.get('/options', authMiddleware)
app.get('/options', optionsRoute)

app.use('/assets', express.static('assets'))
app.use(conf.DEST_ROUTE, express.static(conf.DEST_DIR))
app.use(conf.DEST_ROUTE, serveIndex(conf.DEST_DIR, {
  template: (locals, callback) => {
    ejs.renderFile('./views/files.ejs', locals, { views: './views' }, callback)
  }
}))

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
