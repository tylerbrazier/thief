const express = require('express')
const bodyParser = require('body-parser')
const conf = require('./conf.js')
const probeRoute = require('./routes/probe.js')
const downloadRoute = require('./routes/download.js')

const app = express()

app.set('views', './views')
app.set('view engine', 'ejs')

app.get('/', (req, res) => res.render('index'))

app.use('/probe', bodyParser.urlencoded({ extended: true }))
app.post('/probe', probeRoute)

app.use('/download', bodyParser.urlencoded({ extended: true }))
app.post('/download', downloadRoute)

app.listen(conf.PORT, () => console.log(`Listening on port ${conf.PORT}`))
