const exec = require('child_process').exec
const sanitize = require('../tools/sanitizer.js')

module.exports = function route (req, res, next) {
  if (!req.body) return next('No body on request')

  const url = req.body.url

  if (!url) return reject(res, 'url is required')

  try {
    new URL(url) // eslint-disable-line no-new
  } catch (err) {
    return reject(res, 'invalid url')
  }

  const cmd = 'youtube-dl -J ' + url

  console.log(`Getting metadata for ${url}...`)
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr)
      return next(err)
    }

    try {
      const json = JSON.parse(stdout)

      if (!json) return next('JSON parse returned empty: ' + json)

      if (json._type === 'playlist') {
        return reject(res, 'downloading playlist is not supported')
      }

      res.render('form', getMetadata(url, json))
    } catch (err) {
      return next(err)
    }
  })
}

function getMetadata (url, json) {
  let { track: title, artist } = json

  // Need to do this before ensuring artist and title are set in order
  // to determine the extension.
  const filename = getFilename(title, artist, json.title)

  // Even if this is a webm, may as well fill the tag fields in case the
  // video is for a song but the metadata doesn't include track & artist.
  // Try to parse the video title in the form 'Artist - Song'
  const split = json.title.split('-').map(s => s.trim())
  artist = artist || split[0]
  title = title || split[1] || split[0]

  return { url, title, artist, filename }
}

function getFilename (title, artist, videoTitle) {
  let basename
  if (title && artist) {
    basename = `${sanitize(artist)}-${sanitize(title)}`
  } else {
    basename = sanitize(title || videoTitle)
  }

  // assume .webm unless the video has a track title and/or artist
  const extension = (title || artist) ? '.mp3' : '.webm'

  return basename.replace(/_-_/g, '-') + extension
}

function reject (res, message) {
  res.status(400).render('message', { text: message, isError: true })
}
