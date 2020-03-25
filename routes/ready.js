const validId = require('../tools/validator.js').validId
const detailsTool = require('../tools/details.js')

module.exports = function ready (req, res, next) {
  const { type, id } = req.query
  if (!type && !id) return res.render('ready', { url: '', details: null })
  if (!validId(id)) {
    return res.render('error', { error: 'Invalid id' })
  }
  if (!['video', 'playlist'].includes(type)) {
    return res.render('error', { error: 'Invalid type' })
  }

  let url
  if (type === 'video') url = 'https://www.youtube.com/watch?v=' + id
  if (type === 'playlist') url = 'https://www.youtube.com/playlist?list=' + id

  detailsTool(id, type, (err, details) => {
    if (err) return next(err)
    res.render('ready', { url, details })
  })
}
