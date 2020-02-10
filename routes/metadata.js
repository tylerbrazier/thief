const conf = require('../conf.js')
const proxy = require('http-proxy-middleware')

// https://developers.google.com/youtube/v3/docs/videos/list
// https://developers.google.com/youtube/v3/docs/playlistItems/list

exports.video = makeProxy('videos')
exports.playlist = makeProxy('playlists') // TODO use playlistItems

function makeProxy (type) {
  return proxy({
    logLevel: 'silent',
    changeOrigin: true,
    target: 'https://www.googleapis.com',
    pathRewrite: function (path, req) {
      return `/youtube/v3/${type}` +
        '?key=' + conf.YOUTUBE_API_KEY +
        '&part=snippet' +
        '&id=' + req.params.id
    }
  })
}
