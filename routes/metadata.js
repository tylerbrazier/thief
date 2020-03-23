const exec = require('child_process').exec

const videoIdRegex = /^[A-Za-z0-9_-]+$/

exports.video = function video (req, res, next) {
  if (!videoIdRegex.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid video id' })
  }
  exec('youtube-dl -j ' + req.params.id, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: err.message })
    try {
      const json = JSON.parse(stdout)
      res.json({
        description: json.description,
        artist: json.artist,
        album: json.album,
        track: json.track,
        duration: formatDuration(json.duration)
      })
    } catch (err) {
      res.status(500).json({ error: 'Unable to parse json from: ' + stdout })
    }
  })
}

exports.playlist = function playlist (req, res, next) {
  // https://developers.google.com/youtube/v3/docs/playlistItems/list
  res.status(500).json({ error: '(not implemented yet)' })
}

function formatDuration (seconds) {
  // https://stackoverflow.com/a/25279340
  return seconds && new Date(seconds * 1000).toISOString().substr(11, 8)
}
