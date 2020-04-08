// This route is hit by the client-side js using EventSource() to get download progress updates.
// https://medium.com/conectric-networks/a-look-at-server-sent-events-54a77f8d6ff7
//
// The server sends the following events types:
// - progress: data field will contain html to output
// - done: data field will be the route to the file to download
// - error: data field will contain an error message
// When the client receives the 'done' or 'error' event he should close the connection.

const pool = require('../tools/jobPool.js')
const conf = require('../conf.js')

module.exports = function route (req, res, next) {
  const job = pool.lookup(req.params.id)
  if (!job) return next(Error('No job with id ' + req.params.id))

  res.writeHead(200, {
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  })

  // write any buffered messages
  if (job.progressBuffer.length) {
    const data = job.progressBuffer.map(formatForEvent).join('<br>')
    res.write(`event: progress\ndata: ${data}\n\n`)
  }

  job.emitter.on('progress', message => {
    res.write(`event: progress\ndata: ${formatForEvent(message)}\n\n`)
  })

  job.emitter.on('error', err => {
    res.write(`event: error\ndata: ${formatForEvent(err.message || err)}\n\n`)
    res.end()
  })

  job.emitter.on('done', filename => {
    const fileRoute = `${conf.DEST_ROUTE}/${filename}`
    res.write(`event: done\ndata: ${formatForEvent(fileRoute)}\n\n`)
    res.end()
  })

  req.on('close', () => res.end())
}

function formatForEvent (text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp')
    .replace(/>/g, '&gt')
    .replace(/</g, '&lt')
    .replace(/\n+/g, '<br>')
}
