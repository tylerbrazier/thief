const conf = require('../conf.js')
const KeepAliveEmitter = require('./keepAliveEmitter.js')
const tar = require('tar')
const { tmpdir } = require('os')
const { spawn } = require('child_process')
const { join, basename } = require('path')
const { mkdir, readdir, rename, rmdir } = require('fs').promises

module.exports = class Job {
  constructor (id, options) {
    this.id = id
    this.url = options.url
    this.addMeta = options.addMeta
    this.audioOnly = options.audioOnly
    this.format = options.format
    this.ignoreErrors = options.ignoreErrors
    this.dir = join(tmpdir(), id)
    this.isPlaylist = options.url.pathname.startsWith('/playlist')
    this.progressBuffer = []
    this.emitter = new KeepAliveEmitter()
    // Events from emitter:
    // info (with json)
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
      await mkdir(this.dir, { recursive: true })
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
      if (this.isPlaylist) await this._postprocessPlaylist()
      else await this._postprocessSingle()
    } catch (err) {
      this.emitter.emit('error', err.message)
    }
  }

  _download () {
    return new Promise((resolve, reject) => {
      const args = ['--restrict-filenames', '--newline']
      if (this.addMeta) args.push('--add-metadata')
      if (this.audioOnly) args.push('-x')
      if (this.audioOnly) args.push('--audio-format', this.format)
      if (this.ignoreErrors) args.push('--ignore-errors')
      else args.push('--format', this.format)
      let outputTemplate = '%(title)s.%(ext)s'
      if (this.isPlaylist) outputTemplate = '%(playlist)s/%(playlist_index)s-' + outputTemplate
      args.push('-o', outputTemplate)
      args.push(...conf.youtube_dl_options) // add runtime options set in /maintenance
      args.push(this.url.toString())

      this.emitter.emit('progress', 'youtube-dl ' + args.join(' '))
      const proc = spawn(conf.YOUTUBE_DL_EXE, args, { cwd: this.dir })

      // wire up event emitting
      const ondata = data => this.emitter.emit('progress', data.toString().trim())
      proc.stdout.on('data', ondata)
      proc.stderr.on('data', ondata)
      proc.on('error', reject)
      proc.on('close', (code) => {
        if (code === 0 || this.ignoreErrors) {
          this.emitter.emit('progress', 'Finished downloading')
          resolve()
        } else reject(Error('youtube-dl exited with ' + code))
      })
    })
  }

  async _postprocessPlaylist () {
    const playlistDir = await this._getFirstFilename()
    if (!playlistDir) throw Error('Unable to find files')

    let mvSrc = join(this.dir, playlistDir)
    let mvDest
    if (conf.SKIP_COMPRESSION) {
      mvDest = join(conf.DEST_DIR, playlistDir)
      // Remove dest if it exists because move will fail if it does
      // XXX recursive is experimental in node 12
      // With recursive, no error is thrown if the path doesn't exist
      await rmdir(mvDest, { recursive: true })
      this.emitter.emit('info', { uncompressed: true })
    } else {
      this.emitter.emit('progress', 'Compressing...')
      mvSrc = await this._compress(mvSrc)
      mvDest = join(conf.DEST_DIR, basename(mvSrc))
    }

    await rename(mvSrc, mvDest)
    this.emitter.emit('done', basename(mvDest))

    await this._cleanup()
  }

  async _postprocessSingle () {
    const filename = await this._getFirstFilename()
    if (!filename) throw Error('Unable to find downloaded file')

    await rename(join(this.dir, filename), join(conf.DEST_DIR, filename))
    this.emitter.emit('done', filename)

    await this._cleanup()
  }

  _getFirstFilename () {
    return readdir(this.dir).then(entries => entries.pop())
  }

  _compress (dir) {
    const filepath = dir + '.tar.gz'
    return tar.c({
      gzip: true,
      cwd: join(dir, '..'),
      file: filepath
    }, [basename(dir)]).then(() => filepath)
  }

  _cleanup () {
    console.log('Removing ' + this.dir)
    return rmdir(this.dir, { recursive: true }) // XXX recursive is experimental in node 12
  }
}
