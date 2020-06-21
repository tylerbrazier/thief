const conf = require('../conf.js')
const KeepAliveEmitter = require('./keepAliveEmitter.js')
const tar = require('tar')
const spawn = require('child_process').spawn
const { join, basename, dirname } = require('path')

const destinationRegex = /\[.+?\] Destination: (\S+)/
const alreadyDownloadedRegex = /\[.+?\] (\S+) has already been downloaded/

module.exports = class Job {
  constructor (id, options) {
    this.id = id
    this.url = options.url
    this.format = options.format
    this.addMeta = options['add-meta']
    this.audioOnly = options['audio-only']
    this.playlistItems = options['playlist-items']
    this.ignoreErrors = options['ignore-errors']
    this.isPlaylist = options.url.pathname.startsWith('/playlist')
    this.progressBuffer = [] // used by /progress route
    this.emitter = new KeepAliveEmitter()
    this.destFile = null // will be set by _checkForDestination()
    this.proc = null // will be set by _download()
    // Events from emitter:
    // progress (with text)
    // done (with final filename)
    // error (with Error)

    this.emitter.on('progress', json => this.progressBuffer.push(json))
    this.emitter.on('progress', json => this._checkForDestination(json.message))
    this.emitter.on('progress', json => console.log('progress:', json))
    this.emitter.on('done', json => console.log('done:', json))
    this.emitter.on('error', err => console.log('error:', err))
  }

  async run () {
    try {
      await this._download()
      if (!this.destFile) throw Error('Could not determine output file name')
      if (this.isPlaylist && !conf.SKIP_COMPRESSION) await this._compress()
      this.emitter.emit('done', {
        link: `${conf.DEST_ROUTE}/${this.destFile}`,
        uncompressed: this.isPlaylist && conf.SKIP_COMPRESSION
      })
    } catch (err) {
      this.emitter.emit('error', err)
    }
  }

  cancel () {
    // kill() returns true or false
    console.log('Cancel request received for ' + this.id)
    return this.proc ? this.proc.kill() : false
  }

  _download () {
    return new Promise((resolve, reject) => {
      let outputTemplate = '%(title)s.%(ext)s'
      const args = ['--restrict-filenames', '--newline']
      if (this.addMeta) args.push('--add-metadata')
      if (this.ignoreErrors) args.push('--ignore-errors')
      if (this.playlistItems) args.push('--playlist-items', this.playlistItems)
      if (this.audioOnly) {
        args.push('-x')
        if (this.format) args.push('--audio-format', this.format)
      } else if (this.format) {
        args.push('--format', this.format)
      }
      if (this.isPlaylist) outputTemplate = '%(playlist)s/%(playlist_index)s-' + outputTemplate
      args.push('-o', outputTemplate)
      args.push(...conf.youtube_dl_options) // add runtime options set in /maintenance
      args.push(this.url.toString())

      this.emitter.emit('progress', { message: 'youtube-dl ' + args.join(' ') })
      this.proc = spawn(conf.YOUTUBE_DL_EXE, args, { cwd: conf.DEST_DIR })

      // wire up event emitting
      this.proc.stdout.on('data', d => this.emitter.emit('progress', { message: d.toString().trim() }))
      this.proc.stderr.on('data', d => this.emitter.emit('progress', {
        message: d.toString().trim(),
        error: true
      }))
      this.proc.on('error', reject)
      this.proc.on('close', (code, signal) => {
        if (code === 0 || this.ignoreErrors) {
          this.emitter.emit('progress', { message: 'Finished downloading' })
          resolve()
        } else {
          reject(Error(`youtube-dl exited (${code || signal})`))
        }
      })
    })
  }

  async _compress () {
    this.emitter.emit('progress', { message: 'Compressing...' })
    const filepath = join(conf.DEST_DIR, this.destFile) + '.tar.gz'
    await tar.c({
      gzip: true,
      cwd: conf.DEST_DIR,
      file: filepath
    }, [this.destFile])
    this.destFile = basename(filepath)
  }

  _checkForDestination (eventData) {
    // parse youtube-dl output to figure out what the resulting filename (or directory) is
    const match = eventData.match(destinationRegex) || eventData.match(alreadyDownloadedRegex)
    if (!match) return
    if (!match[1]) return console.error('ERROR Unable to capture filename from ' + eventData)
    if (this.isPlaylist) {
      // output template puts the file in a directory so that will be our destination.
      const dir = dirname(match[1])
      if (dir === '.') return console.error('ERROR Unable to get dirname of ' + match[1])
      this.destFile = dir
    } else {
      this.destFile = match[1]
    }
  }
}
