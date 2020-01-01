const https = require('https')
const conf = require('../conf.js')

// https://developers.google.com/youtube/v3/docs/search/list

module.exports = function route (req, res, next) {
  if (!req.body) return next(Error('No body on request'))
  if (!req.body.q) return next(Error('Search query is required'))

  const url = 'https://www.googleapis.com/youtube/v3/search?' + [
    'key=' + conf.YOUTUBE_API_KEY,
    'part=id,snippet',
    'maxResults=' + conf.MAX_SEARCH_RESULTS,
    'q=' + encodeURIComponent(req.body.q),
    'type=video,playlist'
  ].join('&')

  https.get(url, apiRes => {
    let payload = ''
    apiRes.setEncoding('utf8')
    apiRes.on('data', chunk => { payload += chunk })
    apiRes.on('end', () => {
      try {
        var json = JSON.parse(payload)
        if (apiRes.statusCode === 200) res.render('search', { json })
        else res.render('message', { text: payload, isError: true })
      } catch (err) {
        next(Error('Unable to parse json from Youtube API response: ' + err.message))
      }
    })
  }).on('error', next)
}
