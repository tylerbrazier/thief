const conf = require('../conf.js')
const pool = require('../tools/jobPool.js')
const { validQuery, validFormat } = require('../tools/validator.js')

module.exports = function route (req, res, next) {
  if (!validQuery(req.query)) return badRequest(res, 'Invalid query')
  const { addMeta, audioOnly, ignoreErrors } = req.query
  const format = req.query.format || 'best'

  try {
    var url = new URL(req.query.url)
  } catch (err) {
    return badRequest(res, err.message)
  }

  if (!validFormat(format)) return badRequest(res, 'Invalid format')

  const id = pool.create({ url, addMeta, audioOnly, ignoreErrors, format })
  res.render('download', { eventSourceUrl: '/progress/' + id, destRoute: conf.DEST_ROUTE })
}

function badRequest (res, message) {
  res.status(400).render('error', { error: message })
}
