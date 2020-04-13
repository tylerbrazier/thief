const api = require('../tools/api.js')
const validQuery = require('../tools/validator.js').validQuery
const addPagination = require('../tools/pagination.js')

module.exports = function route (req, res, next) {
  if (!validQuery(req.query)) return fail(res, 'Invalid query')

  const { q, videos, playlists, pageToken } = req.query
  if (!q) return fail(res, 'Search term is required')
  if (!videos && !playlists) return fail(res, 'Search for videos and/or playlists')

  api('search', {
    part: 'id,snippet',
    q: encodeURIComponent(q),
    pageToken: pageToken || '',
    type: [videos ? 'video' : '', playlists ? 'playlist' : ''].join(',')
  }, (err, list) => {
    if (err) return next(err)
    res.render('search', { list: addPagination(req, list) })
  })
}

function fail (res, message) {
  return res.status(400).render('error', { error: message })
}
