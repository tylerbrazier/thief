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
const prename = promisify(fs.rename)
const prmdir = promisify(fs.rmdir)

module.exports = class Job {
  constructor (id, url, addMeta, audioOnly, format) {
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

  async run () {
    try {
      await pmkdir(this.dir, { recursive: true })
      console.log('Working dir ' + this.dir)
      await this._download({
        url: this.url,
        dir: this.dir,
        withInfo: this.isPlaylist,
        addMeta: this.addMeta,
        audioOnly: this.audioOnly,
        format: this.format,
        emitter: this.emitter
      })
      if (this.isPlaylist) {
        const playlistDir = await this._getFirstFilename()
        if (!playlistDir) throw Error('Unable to find files')

        this.emitter.emit('progress', 'Compressing...')
        const tgz = await this._compress(join(this.dir, playlistDir))

        await prename(tgz, join(conf.DEST_DIR, basename(tgz)))
        this.emitter.emit('done', basename(tgz))

        await this._cleanup()
      } else {
        const filename = await this._getFirstFilename()
        if (!filename) throw Error('Unable to find downloaded file')

        await prename(join(this.dir, filename), join(conf.DEST_DIR, filename))
        this.emitter.emit('done', filename)

        await this._cleanup()
      }
    } catch (err) {
      this.emitter.emit('error', err.message)
    }
  }

  _download () {
    return new Promise((resolve, reject) => {
      const args = [ '--restrict-filenames', '--newline' ]
      if (this.addMeta) args.push('--add-metadata')
      if (this.audioOnly) args.push('-x')
      if (this.audioOnly) args.push('--audio-format', this.format)
      else args.push('--format', this.format)
      let outputTemplate = '%(title)s.%(ext)s'
      if (this.isPlaylist) outputTemplate = '%(playlist)s/%(playlist_index)s-' + outputTemplate
      args.push('-o', outputTemplate)
      args.push(this.url.toString())

      this.emitter.emit('progress', 'youtube-dl ' + args.join(' '))
      const proc = spawn('youtube-dl', args, { cwd: this.dir })

      // wire up event emitting
      const ondata = data => this.emitter.emit('progress', data.toString().trim())
      proc.stdout.on('data', ondata)
      proc.stderr.on('data', ondata)
      proc.on('error', reject)
      proc.on('close', (code) => {
        if (code === 0) {
          this.emitter.emit('progress', 'Finished downloading')
          resolve()
        } else reject(Error('youtube-dl exited with ' + code))
      })
    })
  }

  _getFirstFilename () {
    return preaddir(this.dir).then(entries => entries.pop())
  }

  _compress (dir) {
    const filepath = dir + '.tar.gz'
    return tar.c({
      gzip: true,
      cwd: join(dir, '..'),
      file: filepath
    }, [ basename(dir) ]).then(() => filepath)
  }

  _cleanup () {
    console.log('Removing ' + this.dir)
    return prmdir(this.dir, { recursive: true }) // XXX recursive is experimental in node 12
  }
}
