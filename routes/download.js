const conf = require('../conf.js')
const join = require('path').join
const util = require('util')
const id3 = require('node-id3')
const sanitize = require('../tools/sanitizer.js')
const download = require('../tools/downloader.js')
const progressNotifier = require('../tools/progressNotifier.js')

module.exports = function route (req, res, next) {
  const body = req.body
  if (!body) return next('No body on request')

  const filename = sanitize(body.filename)
  if (!filename) return reject(res, 'filename is required')
  if (!filename.endsWith('.mp3') && !filename.endsWith('.webm')) {
    reject(res, 'file extension must either be webm or mp3')
  }

  const { url, artist, title } = body
  if (!url) return reject(res, 'url is required')

  try {
    new URL(url) // eslint-disable-line no-new
  } catch (err) {
    return reject(res, 'invalid url')
  }

  const path = join(conf.DEST, filename)

  const passthrough = { filename, artist, title }

  const downloadOptions = { url, path, passthrough, postdownload }

  const downloadId = download(downloadOptions, progressNotifier.publish)

  // wire up logging
  progressNotifier.subscribe(downloadId, (err, data) => {
    const { stdout, stderr } = data
    if (err) console.error(err)
    if (stdout) process.stdout.write(stdout)
    if (stderr) process.stderr.write(stderr)
    if (data.done) console.log() // print final newline
  })

  res.render('download', { eventSourceUrl: '/progress/' + downloadId })
}

// using data.passthrough, tag the filename with artist and title
function postdownload (data, callback) {
  const filename = data.passthrough.filename

  if (!filename.endsWith('.mp3')) return callback()

  const path = join(conf.DEST, filename)
  const meta = {
    artist: data.passthrough.artist,
    title: data.passthrough.title
  }

  const stdout = `Tagging ${path} with ${util.inspect(meta)}\n`

  const newData = Object.assign({}, data, { stdout, done: false })
  progressNotifier.publish(null, newData)

  id3.write(meta, path, callback)
}

function reject (res, message) {
  res.status(400).render('message', { text: message, isError: true })
}
