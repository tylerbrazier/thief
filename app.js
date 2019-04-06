const conf = require('./conf.js')
const express = require('express')
const app = express()

app.set('views', './views')
app.set('view engine', 'ejs')

app.get('/', (req, res) => res.render('index'))

app.listen(conf.PORT, () => console.log(`Listening on port ${conf.PORT}`))
