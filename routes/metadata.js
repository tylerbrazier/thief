const api = require('../tools/api.js')
const conf = require('../conf.js')

// https://developers.google.com/youtube/v3/docs/videos/list
// https://developers.google.com/youtube/v3/docs/playlists/list

module.exports = function get (req, res, next) {
  const { id, type } = req.query
  if (!id || typeof id !== 'string') return badReq(res, 'id is required')
  if (!['video', 'playlist'].includes(type)) return badReq(res, 'invalid type')

  const url = `https://www.googleapis.com/youtube/v3/${type}s?` + [
    'key=' + conf.YOUTUBE_API_KEY,
    'id=' + id,
    'part=snippet'
  ].join('&')

  api(url, (err, json) => err ? badReq(res, err.message) : res.json(json))
}

function badReq (res, error) {
  res.status(400).json({ error })
}
