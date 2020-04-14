// secures a route with basic auth
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication

const conf = require('../conf.js')

module.exports = function basicAuth (req, res, next) {
  const input = getCreds(req)
  if (!input || input !== conf.BASIC_AUTH_CREDS) {
    res.status(401)
    res.setHeader('WWW-Authenticate', 'Basic realm="maintenance"')
    res.render('error', { error: 'Not authenticated' })
  } else {
    next()
  }
}

function getCreds (req) {
  const authHeader = req.headers.authorization
  if (!authHeader || typeof authHeader !== 'string') return null
  try {
    const enc = authHeader.replace(/^basic /i, '')
    return Buffer.from(enc, 'base64').toString()
  } catch (err) {
    console.error(err)
    return null
  }
}
