const api = require('../tools/api.js')
const validQuery = require('../tools/validator.js').validQuery

module.exports = function route (req, res, next) {
  if (!validQuery(req.query)) return fail(res, 'Invalid query')

  const { q, videos, playlists } = req.query
  if (!q) return fail(res, 'Search term is required')
  if (!videos && !playlists) return fail(res, 'Search for videos and/or playlists')

  api('search', {
    part: 'id,snippet',
    q: encodeURIComponent(q),
    type: [videos ? 'video' : '', playlists ? 'playlist' : ''].join(',')
  }, (err, list) => err ? next(err) : res.render('search', { list }))
}

function fail (res, message) {
  return res.status(400).render('error', { error: message })
}
