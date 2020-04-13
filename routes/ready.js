const validator = require('../tools/validator.js')
const detailsTool = require('../tools/details.js')
const addPagination = require('../tools/pagination.js')

module.exports = function ready (req, res, next) {
  if (!validator.validQuery(req.query)) {
    return res.status(400).render('error', { error: 'Invalid query' })
  }

  const { type, id, pageToken } = req.query
  if (!type && !id) return res.render('ready', { url: '', details: null })

  if (!validator.validId(id)) {
    return res.render('error', { error: 'Invalid id' })
  }
  if (!['video', 'playlist'].includes(type)) {
    return res.render('error', { error: 'Invalid type' })
  }

  let url
  if (type === 'video') url = 'https://www.youtube.com/watch?v=' + id
  if (type === 'playlist') url = 'https://www.youtube.com/playlist?list=' + id

  detailsTool(id, type, pageToken || '', (err, details) => {
    if (err) return next(err)
    res.render('ready', { url, details: addPagination(req, details) })
  })
}
