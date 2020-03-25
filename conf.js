const tmpdir = require('os').tmpdir
const join = require('path').join
const readFileSync = require('fs').readFileSync

module.exports = {
  PORT: process.env.PORT || 8080,
  DEST_DIR: join(tmpdir(), 'thief'), // where downloads are saved
  DEST_ROUTE: '/downloads',
  YOUTUBE_API_KEY: readApiKey(),
  MAX_PAGE_SIZE: process.env.MAX_PAGE_SIZE || 20 // for search results and playlist items
}

function readApiKey () {
  if (process.env.YOUTUBE_API_KEY) return process.env.YOUTUBE_API_KEY
  if (process.env.NODE_ENV === 'production') return ''
  try {
    return readFileSync(join(__dirname, 'YOUTUBE_API_KEY'), 'utf8').trim()
  } catch (err) {
    console.error(err)
    return ''
  }
}
