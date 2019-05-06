// The client needs to make an independent request to get download progress.
// The server can't respond to the /download POST request with progress info;
// the client must initiate it. So we have to manage some state in order to
// associate an in-progress download with the client request to get updates on
// that progress. That's the purpose of this little module. A single instance of
// this module can be shared among different modules because of module caching:
// https://nodejs.org/api/modules.html#modules_caching

const EventEmitter = require('events')

module.exports = {
  publish,
  subscribe
}

// map of downloadId -> ProgressEmitter
const downloadQueues = {}

const EVENT_NAME = 'progress'

// Subscribers will be notified using this ProgressEmitter.
// When data is published, it will be buffered and kept in the buffer so that
// any new subscribers can get data that was published before they subscribed.
class ProgressEmitter extends EventEmitter {
  constructor () {
    super()
    this.stdoutBuffer = ''
    this.stderrBuffer = ''
  }
}

// The downloader calls this to publish progress.
// The data arg should be an object including the properties:
// - downloadId  (required)
// - stdout      (optional)
// - stderr      (optional)
// - passthrough (optional)
// - done        (true or false)
function publish (err, data) {
  let emitter = downloadQueues[data.downloadId]
  if (!emitter) {
    emitter = new ProgressEmitter()
    downloadQueues[data.downloadId] = emitter
  }

  emitter.stdoutBuffer += data.stdout || ''
  emitter.stderrBuffer += data.stderr || ''

  emitter.emit(EVENT_NAME, err, data)

  if (err || data.done) {
    emitter.removeAllListeners(EVENT_NAME)
    delete downloadQueues[data.downloadId]
  }
}

// Anyone who wants to receive progress updates will call this.
// callback will be called with (err, data) where data is an object with:
// - downloadId
// - stdout
// - stderr
// - passthrough
// - done
function subscribe (downloadId, callback) {
  const emitter = downloadQueues[downloadId]

  if (!emitter) {
    const errMessage = 'No in-progress download with id ' + downloadId
    return callback(Error(errMessage), {
      downloadId,
      stdout: '',
      stderr: '',
      passthrough: null,
      done: true
    })
  }

  // send any existing buffered data
  if (emitter.stdoutBuffer || emitter.stderrBuffer) {
    callback(null, {
      downloadId,
      stdout: emitter.stdoutBuffer,
      stderr: emitter.stderrBuffer,
      passthrough: null,
      done: false
    })
  }

  emitter.on(EVENT_NAME, callback)
}
