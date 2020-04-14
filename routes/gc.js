// garbage collect all downloaded regular files

const conf = require('../conf.js')
const fs = require('fs')
const join = require('path').join
const promisify = require('util').promisify
const preaddir = promisify(fs.readdir)
const punlink = promisify(fs.unlink)

module.exports = async function gc (req, res, next) {
  try {
    const dirEntries = await preaddir(conf.DEST_DIR, { withFileTypes: true })

    const removedFiles = []
    const skippedFiles = []
    for (var entry of dirEntries) {
      if (entry.isFile()) {
        await punlink(join(conf.DEST_DIR, entry.name))
        removedFiles.push(entry.name)
      } else {
        skippedFiles.push(entry.name)
      }
    }

    const message = 'Removed files:\n' + removedFiles.join('\n') +
      '\n\nSkipped:\n' + skippedFiles.join('\n')
    res.render('message', { message })
  } catch (err) {
    next(err)
  }
}
