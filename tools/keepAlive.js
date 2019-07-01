// Heroku will terminate connections that are idle for 30s. See:
// https://devcenter.heroku.com/articles/request-timeout
// This module will keep the connection alive by sending out a 'Still working'
// message if the progressNotifier has been idle for a few seconds.

const progressNotifier = require('./progressNotifier.js')

// map of downloadId -> Timeout (object returned by setTimeout())
const timeoutMap = {}

const DELAY = 8000 // 8 seconds

module.exports = function keepAlive (downloadId) {
  startTimer(downloadId)

  progressNotifier.subscribe(downloadId, (err, data) => {
    clearTimeout(timeoutMap[data.downloadId])

    if (err || data.done) {
      delete timeoutMap[data.downloadId]
      return
    }

    startTimer(data.downloadId)
  })
}

function startTimer (downloadId) {
  timeoutMap[downloadId] = setTimeout(ping, DELAY, downloadId)
}

function ping (downloadId) {
  progressNotifier.publish(null, { downloadId, stdout: 'Still working...\n' })
}
