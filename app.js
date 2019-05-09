const express = require('express')
const bodyParser = require('body-parser')
const serveIndex = require('serve-index')
const fs = require('fs')
const conf = require('./conf.js')
const prepareRoute = require('./routes/prepare.js')
const downloadRoute = require('./routes/download.js')
const progressRoute = require('./routes/progress.js')
const updateRoute = require('./routes/update.js')

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

fs.mkdirSync(conf.DEST, { recursive: true })
app.use('/files', serveIndex(conf.DEST))
app.use('/files', express.static(conf.DEST))

app.listen(conf.PORT, () => console.log(`Listening on port ${conf.PORT}`))
