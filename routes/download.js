const conf = require('../conf.js')
const pool = require('../tools/jobPool.js')

module.exports = function route (req, res, next) {
  if (!req.body) return next(Error('No body on request'))

  try {
    var url = new URL(req.body.url)
  } catch (err) {
    return badRequest(res, err.message)
  }

  const format = req.body.format || 'best'
  if (!/^[a-z0-9]+$/.test(format)) return badRequest(res, 'Invalid format')

  const { addMeta, audioOnly } = req.body

  const id = pool.create(url, addMeta, audioOnly, format)
  res.render('download', { eventSourceUrl: '/progress/' + id, destRoute: conf.DEST_ROUTE })
}

function badRequest (res, message) {
  res.status(400).render('error', { error: message })
}
