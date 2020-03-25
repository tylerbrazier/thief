const api = require('../tools/api.js')

module.exports = function route (req, res, next) {
  const { search, videos, playlists } = req.body
  if (!search) return fail(res, 'Search term is required')
  if (!videos && !playlists) return fail(res, 'Search for videos and/or playlists')

  api('search', {
    part: 'id,snippet',
    q: encodeURIComponent(search),
    type: [videos ? 'video' : '', playlists ? 'playlist' : ''].join(',')
  }, (err, list) => err ? next(err) : res.render('search', { list }))
}

function fail (res, message) {
  return res.status(400).render('error', { error: message })
}
