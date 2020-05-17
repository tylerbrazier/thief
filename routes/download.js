const conf = require('../conf.js')
const pool = require('../tools/jobPool.js')
const { validQuery, validFormat, validPlaylistItems } = require('../tools/validator.js')

module.exports = function route (req, res, next) {
  if (!validQuery(req.query)) return badRequest(res, 'Invalid query')

  try {
    var url = new URL(req.query.url)
  } catch (err) {
    return badRequest(res, err.message)
  }

  if (!validFormat(req.query.format)) return badRequest(res, 'Invalid format')

  if (!validPlaylistItems(req.query.playlistItems)) return badRequest(res, 'Invalid playlist selection')

  const id = pool.create(Object.assign({}, req.query, { url }))
  res.render('download', { eventSourceUrl: '/progress/' + id, destRoute: conf.DEST_ROUTE })
}

function badRequest (res, message) {
  res.status(400).render('error', { error: message })
}
