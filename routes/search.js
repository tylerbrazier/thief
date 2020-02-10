const conf = require('../conf.js')
const api = require('../tools/api.js')

// https://developers.google.com/youtube/v3/docs/search/list

module.exports = function route (req, res, next) {
  if (!req.body) return next(Error('No body on request'))

  const { search, videos, playlists } = req.body
  if (!search) return fail(res, 'Search term is required')
  if (!videos && !playlists) return fail(res, 'Search for videos and/or playlists')

  const url = 'https://www.googleapis.com/youtube/v3/search?' + [
    'key=' + conf.YOUTUBE_API_KEY,
    'part=id,snippet',
    'maxResults=' + conf.MAX_SEARCH_RESULTS,
    'q=' + encodeURIComponent(search),
    'type=' + [ videos ? 'video' : '', playlists ? 'playlist' : ''].join(',')
  ].join('&')

  api(url, (err, json) => err ? next(err) : res.render('search', { json }))
}

function fail (res, message) {
  return res.status(400).render('message', { text: message, isError: true })
}
