const exec = require('child_process').exec
const conf = require('../conf.js')

module.exports = function route (req, res, next) {
  exec(conf.YOUTUBE_DL_EXE + ' --update', (err, stdout, stderr) => {
    if (err) {
      console.error(stderr)
      return next(err)
    }
    res.render('message', { message: stdout })
  })
}
