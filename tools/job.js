const conf = require('../conf.js')
const KeepAliveEmitter = require('./keepAliveEmitter.js')
const tar = require('tar')
const fs = require('fs')
const { tmpdir } = require('os')
const { spawn } = require('child_process')
const { join, basename } = require('path')
const { promisify } = require('util')
const pmkdir = promisify(fs.mkdir)
const preaddir = promisify(fs.readdir)
const preadFile = promisify(fs.readFile)
const prename = promisify(fs.rename)

class Job {
  constructor(id, url, addMeta, audioOnly, format) {
    this.id = id
    this.url = url
    this.addMeta = addMeta
    this.audioOnly = audioOnly
    this.format = format
    this.dir = join(tmpdir(), id)
    this.isPlaylist = url.pathname.startsWith('/playlist')
    this.progressBuffer = []
    this.emitter = new KeepAliveEmitter()
    // Events from emitter:
    // progress (with text)
    // done (with final filename)
    // error (with Error)

    this.emitter.on('progress', data => this.progressBuffer.push(data))
    this.emitter.on('progress', console.log)
    this.emitter.on('done', console.log)
    this.emitter.on('error', console.error)
  }

  async run() {
    try {
      await pmkdir(this.dir, { recursive: true })
      await download({
        url: this.url,
        dir: this.dir,
        withInfo: this.isPlaylist,
        addMeta: this.addMeta,
        audioOnly: this.audioOnly,
        format: this.format,
        emitter: this.emitter
      })
      if (this.isPlaylist) {
        const jsonFilename = await getFirstFilename(this.dir, f => f.endsWith('.info.json'))
        if (!jsonFilename) throw Error('Could not find .info.json file')

        const json = await readJson(this.dir, jsonFilename)
        const playlist = sanitize(json.playlist)
        if (!playlist) throw Error('No playlist found in ' + jsonFilename)

        const playlistDir = join(this.dir, playlist)

        await pmkdir(playlistDir)

        await moveAllFiles(this.dir, playlistDir, f => !f.endsWith('.info.json'))

        this.emitter.emit('progress', 'Compressing...')
        const tgz = await compressDir(playlistDir)

        await prename(tgz, join(conf.DEST_DIR, basename(tgz)))

        this.emitter.emit('done', basename(tgz))
      } else {
        const filename = await getFirstFilename(this.dir)
        if (!filename) throw Error('Unable to find downloaded file')

        await prename(join(this.dir, filename), join(conf.DEST_DIR, filename))
        this.emitter.emit('done', filename)
      }
    } catch (err) {
      this.emitter.emit('error', err.message)
    }
  }
}

function download (options) {
  const { url, dir, withInfo, addMeta, audioOnly, format, emitter } = options
  return new Promise((resolve, reject) => {
    const args = [
      '--restrict-filenames',
      '--newline',
      '-o', '%(title)s.%(ext)s'
    ]
    if (withInfo) args.push('--write-info-json')
    if (addMeta) args.push('--add-metadata')
    if (audioOnly) args.push('-x')
    if (audioOnly) args.push('--audio-format', format)
    else args.push('--format', format)
    args.push(url.toString())

    emitter.emit('progress', 'youtube-dl ' + args.join(' '))
    const proc = spawn('youtube-dl', args, { cwd: dir })

    // wire up event emitting
    const ondata = data => emitter.emit('progress', data.toString().trim())
    proc.stdout.on('data', ondata)
    proc.stderr.on('data', ondata)
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code == 0) {
        emitter.emit('progress', 'Finished downloading')
        resolve()
      } else reject(Error('youtube-dl exited with ' + code))
    })
  })
}

async function getFirstFilename (dir, filter = () => true) {
  const files = await preaddir(dir, { withFileTypes: true })
  return files
    .filter(f => f.isFile())
    .map(f => f.name)
    .filter(filter)
    .pop()
}

async function readJson (dir, filename) {
  const text = await preadFile(join(dir, filename), 'utf8')
  try {
    return JSON.parse(text)
  } catch (err) {
    throw Error(`Unable to parse ${filename}: ${err.message}`)
  }
}

async function moveAllFiles (src, dest, filter = () => true) {
  let filename
  while (filename = await getFirstFilename(src, filter)) {
    await prename(join(src, filename), join(dest, filename))
  }
}

function compressDir (dir) {
  const filepath = dir + '.tar.gz'
  return tar.c({
    gzip: true,
    cwd: join(dir, '..'),
    file: filepath
  }, [ basename(dir) ])
    .then(() => filepath)
}

// Replaces anything besides alphanumerics, dots, and dashes with _
function sanitize (text = '') {
  return text.trim().replace(/[^\w\s.-]/g, '_').replace(/\s+/g, '_')
}

module.exports = {
  Job,
  getFirstFilename,
  readJson,
  moveAllFiles,
  compressDir,
}
