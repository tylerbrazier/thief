const exec = require('child_process').exec

module.exports = function route (req, res, next) {
  exec('youtube-dl --update', (err, stdout, stderr) => {
    if (err) {
      console.error(stderr)
      return next(err)
    }
    res.render('message', { message: stdout })
  })
}
