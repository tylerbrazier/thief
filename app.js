const conf = require('./conf.js')
const express = require('express')
const bodyParser = require('body-parser')
const probeRoute = require('./routes/probe.js')

const app = express()

app.set('views', './views')
app.set('view engine', 'ejs')

app.get('/', (req, res) => res.render('index'))

app.use('/probe', bodyParser.urlencoded({ extended: true }))
app.post('/probe', probeRoute)

app.listen(conf.PORT, () => console.log(`Listening on port ${conf.PORT}`))
