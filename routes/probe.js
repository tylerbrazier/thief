const exec = require('child_process').exec

module.exports = function route (req, res, next) {
  if (!req.body) return next('No body on request')

  const url = req.body.url

  if (!url) return res.status(400).send('url is required')

  const cmd = 'youtube-dl -J ' + url

  console.log(`Getting metadata for ${url}...`)
  exec(cmd, (err, stdout, stderr) => {
    if (err) return next(err)

    try {
      const json = JSON.parse(stdout)

      if (!json) return next('JSON parse returned empty: ' + json)

      res.send(json)
    } catch (err) {
      return next(err)
    }
  })
}
