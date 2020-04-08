const exec = require('child_process').exec
const api = require('./api.js')
const conf = require('../conf.js')

// callback in the form (err, details)
// the details object will be different depending on type
module.exports = function details (id, type, callback) {
  if (type === 'video') return videoDetails(id, callback)
  else if (type === 'playlist') return playlistDetails(id, callback)
  throw Error('Type must be video or playlist')
}

function videoDetails (id, callback) {
  exec(`${conf.YOUTUBE_DL_EXE} -j https://youtu.be/${id}`, (err, stdout, stderr) => {
    if (err) return callback(err)
    try {
      const json = JSON.parse(stdout)
      callback(null, {
        type: 'video',
        title: json.title,
        channel: json.uploader,
        thumbnail: json.thumbnail,
        artist: json.artist,
        album: json.album,
        track: json.track,
        description: json.description,
        duration: formatDuration(json.duration)
      })
    } catch (err) {
      callback(err)
    }
  })
}

function playlistDetails (id, callback) {
  // Need to call the playlist api to get the title, channel, thumbnail, & description
  // and the playlistItems api to get the videos in the playlist.
  // Call in parallel and join the results at the end.
  Promise.all([
    new Promise((resolve, reject) => {
      api('playlistItems', { playlistId: id, part: 'snippet' }, (err, result) => {
        if (err) return reject(err)
        else resolve(result)
      })
    }),
    new Promise((resolve, reject) => {
      api('playlists', { id, part: 'snippet' }, (err, result) => {
        if (err) return reject(err)
        else resolve(result)
      })
    })
  ]).then(([list, items]) => callback(null, Object.assign({}, list, items)))
    .catch(callback)
}

function formatDuration (seconds) {
  if (!seconds) return '?'
  // https://stackoverflow.com/a/25279340
  return new Date(seconds * 1000).toISOString().substr(11, 8)
}
