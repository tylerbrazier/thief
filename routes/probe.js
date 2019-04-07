const exec = require('child_process').exec

module.exports = function route (req, res, next) {
  if (!req.body) return next('No body on request')

  const url = req.body.url

  if (!url) return res.status(400).send('url is required')

  const cmd = 'youtube-dl -J ' + url

  console.log(`Getting metadata for ${url}...`)
  exec(cmd, (err, stdout, stderr) => {
    if (err) return next(err)

    try {
      const json = JSON.parse(stdout)

      if (!json) return next('JSON parse returned empty: ' + json)

      if (json._type === 'playlist') {
        return res.status(400).send('downloading playlist is not supported yet')
      }

      res.render('download', getMetadata(url, json))
    } catch (err) {
      return next(err)
    }
  })
}

function getMetadata (url, json) {
  const { track, artist } = json
  const type = (track || artist ? 'mp3' : 'webm')

  return {
    url: url,
    track: track || '',
    artist: artist || '',
    filename: getFilename(track, artist, json.title, type),
    type: type
  }
}

function getFilename (track, artist, title, type) {
  if (track || artist) {
    return `${sanitize(artist)}-${sanitize(track)}.${type}`
  } else {
    return `${sanitize(title)}.${type}`
  }
}

// replace spaces with underscore and remove anything besides
// alphanumerics, underscores, dots, and dashes
function sanitize (str) {
  return str.replace(/[^\w\s.-]/g, '').replace(/\s+/g, '_')
}
