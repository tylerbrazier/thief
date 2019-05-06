// This route is hit by the client-side js code using EventSource()
// https://medium.com/conectric-networks/a-look-at-server-sent-events-54a77f8d6ff7
//
// The server sends the following events types:
// - progress: data field will contain html to output
// - done: data field will be the route to the file to download
// - error: data field will contain an error message
// When the client receives the 'done' or 'error' event he should close the connection.

const progressNotifier = require('../tools/progressNotifier.js')

module.exports = function route (req, res, next) {
  const downloadId = req.params.downloadId
  if (!downloadId) return next('downloadId is required')

  res.writeHead(200, {
    'Connection': 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  })

  progressNotifier.subscribe(downloadId, (err, data) => {
    const { stdout, stderr, passthrough, done } = data

    if (err) {
      res.write(`event: error\ndata: ${htmlEscape(err.message || err)}\n\n`)
      return res.end()
    }

    if (done) {
      const fileRoute = '/files/' + passthrough.filename
      res.write(`event: done\ndata: ${htmlEscape(fileRoute)}\n\n`)
      return res.end()
    }

    if (stdout || stderr) {
      const out = (stdout || '') + (stderr || '')
      const html = htmlEscape(out).replace(/\n/g, '<br>')
      return res.write(`event: progress\ndata: ${html}\n\n`)
    }
  })

  req.on('close', () => res.end())
}

function htmlEscape (text) {
  if (!text) return ''
  return text.replace(/&/g, '&amp').replace(/>/g, '&gt').replace(/</g, '&lt')
}
