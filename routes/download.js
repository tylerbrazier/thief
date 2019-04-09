const os = require('os')
const path = require('path')
const util = require('util')
const id3 = require('node-id3')
const sanitize = require('../sanitize.js')
const exec = util.promisify(require('child_process').exec)

module.exports = async function route (req, res, next) {
  const body = req.body
  if (!body) return next('No body on request')

  // filename doesn't include extension because youtube-dl -o needs '.%(ext)s'
  const filename = sanitize(body.filename)
  if (!filename) return res.status(400).send('filename is required')

  const { url, format, artist, title } = body
  if (!url) return res.status(400).send('url is required')
  if (format !== 'mp3') return res.status(400).send('only mp3 is supported right now')

  // basepath doesn't include extention because youtube-dl -o needs '.%(ext)s'
  const basepath = path.join(os.tmpdir(), filename)
  const fullpath = `${basepath}.${format}`

  try {
    await download(url, basepath, format)

    if (format === 'mp3' && (artist || title)) {
      await tag(fullpath, artist, title)
    }

    console.log(`Sending response ${fullpath}`)
    res.download(fullpath)
  } catch (err) {
    return next(err)
  }
}

async function download (url, basepath, format) {
  let cmd = 'youtube-dl -x --audio-quality 0 '
  cmd += `--audio-format ${format} `
  cmd += `-o '${basepath}.%(ext)s' `
  cmd += `'${url}'`

  console.log(`Downloading ${url} -> ${basepath}.${format}`)
  const { stdout, stderr } = await exec(cmd)
  if (stdout) console.log(stdout)
  if (stderr) console.error(stderr)
}

function tag (file, artist, title) {
  const meta = { title: title, artist: artist }

  console.log(`Tagging ${file} with ${util.inspect(meta)}`)

  // util.promisify doesn't seem to work on id3.write
  return new Promise((resolve, reject) => {
    id3.write(meta, file, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}
