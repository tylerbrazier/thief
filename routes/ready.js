exports.get = (req, res) => res.render('ready', { url: '' })

exports.post = function post (req, res, next) {
  if (!req.body) return next(Error('No body on request'))
  if (!req.body.url) return next(Error('URL is required for POST'))
  res.render('ready', { url: req.body.url })
}
