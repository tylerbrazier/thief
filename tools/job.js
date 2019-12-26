const conf = require('../conf.js')
const EventEmitter = require('events')
const zlib = require('zlib')
const tar = require('tar')
const fs = require('fs')
const { tmpdir } = require('os')
const { join, basename } = require('path')
const { promisify } = require('util')
const pmkdir = promisify(fs.mkdir)
const preaddir = promisify(fs.readdir)
const preadFile = promisify(fs.readFile)
const prename = promisify(fs.rename)

class Job {
  constructor(id, url) {
    this.id = id
    this.url = url
    this.dir = join(tmpdir(), id)
    this.emitter = new EventEmitter()
    this.isPlaylist = url.pathname.startsWith('/playlist')
  }

  async start() {
    await pmkdir(this.dir, { recursive: true })
    await download(this.url, this.dir, this.isPlaylist, this.emitter)
    if (this.isPlaylist) {
      const jsonFilename = await getFirstFilename(this.dir, f => f.endsWith('.info.json'))
      if (!jsonFilename) throw Error('Could not find .info.json file')

      const json = await readJson(this.dir, jsonFilename)
      const playlist = sanitize(json.playlist)
      if (!playlist) throw Error('no playlist found in ' + jsonFilename)

      const playlistDir = join(this.dir, playlist)

      await pmkdir(playlistDir)

      // move all the audio files into the playlist dir
      await moveAllFiles(this.dir, playlistDir, f => !f.endsWith('.info.json'))

      this._emit('Compressing...')
      const tgz = await compressDir(playlistDir)

      await prename(tgz, join(conf.DEST, basename(tgz)))

      this._emit(basename(tgz), 'done')
    } else {
      const filename = await getFirstFilename(this.dir)
      if (!filename) throw Error('Unable to find downloaded file')

      await prename(join(this.dir, filename), join(conf.DEST, filename)) // move to DEST
      this._emit(filename, 'done')
    }
  }

  // returns EventEmitter that emits:
  // progress (with text)
  // done (with final filename)
  // error (with Error)
  subscribe() {
    return this.emitter
  }

  _emit (message, event = 'progress') {
    this.emitter.emit(event, message)
  }
}

function download (url, dir, withInfo = false, emitter = new EventEmitter()) {
  return new Promise((resolve, reject) => {
    const args = [
      '--restrict-filenames',
      '--newline',
      '-o', '%(title)s'
    ]
    if (withInfo) args.push('--write-info-json')

    emitter.emit('progress', 'Downloading ' + url.toString())
    const proc = spawn('youtube-dl', args, { cwd: dir })

    // wire up event emitting
    proc.stdout.on('data', (stdout) => emitter.emit('progress', stdout))
    proc.stderr.on('data', (stderr) => emitter.emit('progress', stderr))
    proc.on('close', (code) => {
      emitter.emit('progress', `Finished downloading (exit code ${code})`)
      if (code == 0) resolve()
      else reject(Error('youtube-dl exited with code ' + code))
    })
    proc.on('error', (err) => {
      emitter.emit('error', err)
      reject(err)
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
  // move all the audio files into the playlist dir
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
