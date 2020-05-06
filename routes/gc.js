// garbage collect all downloaded files

const conf = require('../conf.js')
const join = require('path').join
const { readdir, unlink, rmdir } = require('fs').promises

module.exports = async function gc (req, res, next) {
  try {
    const removedFiles = await gcDir(conf.DEST_DIR)
    const message = 'Removed files:\n' + removedFiles.join('\n')
    res.render('message', { message })
  } catch (err) {
    next(err)
  }
}

async function gcDir (dir) {
  const removedFiles = []
  const dirEntries = await readdir(dir, { withFileTypes: true })

  for (var entry of dirEntries) {
    var path = join(dir, entry.name)
    if (entry.isDirectory()) {
      removedFiles.push(...await gcDir(path))
      await rmdir(path)
      removedFiles.push(path + '/')
    } else {
      await unlink(path)
      removedFiles.push(path)
    }
  }
  return removedFiles
}
