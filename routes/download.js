module.exports = function route (req, res, next) {
  const body = req.body

  if (!body) return next('No body on request')
  if (!body.url) return res.status(400).send('url is required')
  if (!body.filename) return res.status(400).send('filename is required')

  res.send('working on it')
}
