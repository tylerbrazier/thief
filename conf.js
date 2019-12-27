const tmpdir = require('os').tmpdir
const join = require('path').join

module.exports = {
  PORT: process.env.PORT || 8080,
  DEST_DIR: join(tmpdir(), 'thief'), // where downloads are saved
  DEST_ROUTE: '/downloads'
}
