const tmpdir = require('os').tmpdir
const join = require('path').join
const debuglog = require('util').debuglog('conf')

// load development settings from .env
// https://github.com/motdotla/dotenv#readme
if (process.env.NODE_ENV !== 'production') require('dotenv').config()

const conf = {
  PORT: process.env.PORT || 8080,

  // where downloads are saved
  DEST_DIR: process.env.DEST_DIR || join(tmpdir(), 'thief'),

  // route to downloaded files
  DEST_ROUTE: process.env.DEST_ROUTE || '/downloads',

  // look in PATH by default
  YOUTUBE_DL_EXE: process.env.YOUTUBE_DL_EXE || 'youtube-dl',

  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',

  // for maintenance; in the form user:password
  BASIC_AUTH_CREDS: process.env.BASIC_AUTH_CREDS || '',

  // for search results and playlist items
  MAX_PAGE_SIZE: process.env.MAX_PAGE_SIZE || 20,

  // if set, playlists won't be compressed into .tar.gz
  SKIP_COMPRESSION: process.env.SKIP_COMPRESSION || false,

  // set by /options route, not by env so it can be changed at runtime
  youtube_dl_options: []
}

debuglog(conf)

module.exports = conf
