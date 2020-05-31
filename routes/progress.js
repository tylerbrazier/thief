// This route is hit by the client-side js using EventSource() to get download progress updates.
// https://medium.com/conectric-networks/a-look-at-server-sent-events-54a77f8d6ff7
//
// The server sends the following events types:
// - progress: data field will be { message: '<output to show>', error: true/false }
// - done: data field will be { link: '<route to the file to download>', uncompressed: true/false }
// - error: data field will be { message: '<error message>' }
// When the client receives the 'done' or 'error' event he should close the connection.

const pool = require('../tools/jobPool.js')

module.exports = function route (req, res, next) {
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  })

  const job = pool.lookup(req.params.id)
  if (!job) {
    const err = { message: 'No download in progress' }
    res.write(`event: error\ndata: ${JSON.stringify(err)}\n\n`)
    res.end()
    return
  }

  // write any buffered messages
  job.progressBuffer.forEach(json => res.write(`event: progress\ndata: ${JSON.stringify(json)}\n\n`))

  job.emitter.on('progress', json => res.write(`event: progress\ndata: ${JSON.stringify(json)}\n\n`))

  job.emitter.on('error', err => {
    // JSON.stringify() doesn't work on Error objects
    res.write(`event: error\ndata: ${JSON.stringify({ message: err.message || err })}\n\n`)
    res.end()
  })

  job.emitter.on('done', json => {
    res.write(`event: done\ndata: ${JSON.stringify(json)}\n\n`)
    res.end()
  })

  req.on('close', () => res.end())
}
