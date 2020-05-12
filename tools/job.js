const conf = require('../conf.js')
const KeepAliveEmitter = require('./keepAliveEmitter.js')
const tar = require('tar')
const spawn = require('child_process').spawn
const { join, basename, dirname } = require('path')

const destinationRegex = /^\[.+?\] Destination: (\S+)/
const alreadyDownloadedRegex = /^\[.+?\] (\S+) has already been downloaded/

module.exports = class Job {
  constructor (id, options) {
    this.id = id
    this.url = options.url
    this.addMeta = options.addMeta
    this.audioOnly = options.audioOnly
    this.format = options.format
    this.ignoreErrors = options.ignoreErrors
    this.isPlaylist = options.url.pathname.startsWith('/playlist')
    this.progressBuffer = [] // used by /progress route
    this.emitter = new KeepAliveEmitter()
    this.destFile = null // will be set by _checkForDestination()
    // Events from emitter:
    // info (with json)
    // progress (with text)
    // done (with final filename)
    // error (with Error)

    this.emitter.on('progress', data => this.progressBuffer.push(data))
    this.emitter.on('progress', data => this._checkForDestination(data))
    this.emitter.on('progress', console.log)
    this.emitter.on('done', console.log)
    this.emitter.on('error', console.error)
  }

  async run () {
    try {
      await this._download()
      if (!this.destFile) throw Error('Could not determine output file name')
      if (this.isPlaylist) await this._postprocessPlaylist()
      this.emitter.emit('done', this.destFile)
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
      const proc = spawn(conf.YOUTUBE_DL_EXE, args, { cwd: conf.DEST_DIR })

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
    if (conf.SKIP_COMPRESSION) {
      this.emitter.emit('info', { uncompressed: true })
    } else {
      const dirPath = join(conf.DEST_DIR, this.destFile)
      this.emitter.emit('progress', 'Compressing...')
      this.destFile = await this._compress(dirPath)
    }
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

  _compress (dir) { // dir is expected to be an absolute path
    const filepath = dir + '.tar.gz'
    return tar.c({
      gzip: true,
      cwd: join(dir, '..'),
      file: filepath
    }, [basename(dir)]).then(() => basename(filepath))
  }
}
