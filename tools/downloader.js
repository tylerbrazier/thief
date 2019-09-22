const uuid = require('uuid/v4')
const spawn = require('child_process').spawn

// Downloads url and fires callback whenever output is streamed by youtube-dl.
// Returns an id to associate with the download. The callback will be given:
// (err, data) where data is an object with the following properties:
// - downloadId: matches the id returned by the function
// - stdout: the stdout of the process
// - stderr: the stderr of the process
// - passthrough: will be same as 'passthrough' option given as download arg
// - done: true when the process finishes (final callback), false otherwise
//
// The callback will be fired once with an initial message before this function returns.
// (This is done to initialize the progressNotifier queue)
//
// options param should have the following properties:
// - url: youtube url to download
// - path: the complete path of the resulting file
// - passthrough: (optional) anything you'd like passed through to the callback
// - postdownload: (optional) callback to be fired when finished downloading
//   but before sending the final 'done' callback; the postdownload hook
//   will receive the following args: (data, callback), where data is the same
//   object that will be sent to the final callback (thus it will contain done:true).
//   The final 'done' callback will not be sent out until postdownload hook has
//   finished and called its own callback, which takes an (err) as its only param.
//   If an error happens during the download, postdownload will not be called at all.
module.exports = function download (options, callback) {
  const { url, path, passthrough, postdownload } = options
  const downloadId = uuid()

  const args = ['--restrict-filenames', '--newline', '-o', path]
  if (path.endsWith('.mp3')) {
    args.push('-x', '--audio-quality', '0', '--audio-format', 'mp3')
  } else {
    args.push('-f', 'webm')
  }
  args.push(url)

  const proc = spawn('youtube-dl', args)

  proc.stdout.on('data', (stdout) => {
    callback(null, {
      downloadId,
      stdout,
      stderr: '',
      passthrough,
      done: false
    })
  })

  proc.stderr.on('data', (stderr) => {
    callback(null, {
      downloadId,
      stdout: '',
      stderr,
      passthrough,
      done: false
    })
  })

  proc.on('close', (code) => {
    const data = {
      downloadId,
      stdout: 'Exited with code ' + code,
      stderr: '',
      passthrough,
      done: true
    }

    if (postdownload) {
      return postdownload(data, (err) => {
        if (err) return callback(err, data)
        callback(null, data)
      })
    }

    callback(null, data)
  })

  proc.on('error', (err) => {
    callback(err, {
      downloadId,
      stdout: '',
      stderr: '',
      passthrough,
      done: true
    })
  })

  callback(null, {
    downloadId,
    stdout: `Downloading ${url}\n`,
    stderr: '',
    passthrough,
    done: false
  })

  return downloadId
}
