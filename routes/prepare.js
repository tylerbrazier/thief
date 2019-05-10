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
  const { track: title, artist } = json

  return {
    url: url,
    title: title || '',
    artist: artist || '',
    filename: getFilename(title, artist, json.title)
  }
}

function getFilename (title, artist, videoTitle) {
  let basename
  if (title && artist) {
    basename = `${sanitize(artist)}-${sanitize(title)}`
  } else {
    basename = sanitize(title || videoTitle)
  }

  const extension = (title || artist) ? '.mp3' : '.webm'
  return basename.replace(/_-_/g, '-') + extension
}

function reject (res, message) {
  res.status(400).render('message', { text: message, isError: true })
}
