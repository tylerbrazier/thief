const conf = require('../conf.js')
const api = require('../tools/api.js')

// https://developers.google.com/youtube/v3/docs/search/list

module.exports = function route (req, res, next) {
  if (!req.body) return next(Error('No body on request'))
  if (!req.body.search) return next(Error('Search term is required'))

  const url = 'https://www.googleapis.com/youtube/v3/search?' + [
    'key=' + conf.YOUTUBE_API_KEY,
    'part=id,snippet',
    'maxResults=' + conf.MAX_SEARCH_RESULTS,
    'q=' + encodeURIComponent(req.body.search),
    'type=video,playlist'
  ].join('&')

  api(url, (err, json) => err ? next(err) : res.render('search', { json }))
}
