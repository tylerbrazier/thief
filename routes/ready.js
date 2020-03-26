const validId = require('../tools/validator.js').validId
const detailsTool = require('../tools/details.js')

module.exports = function ready (req, res, next) {
  const { type, id, async } = req.query
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

  // Loading video details using youtube-dl is slow, so in order to render this
  // page right away we can fetch the details asynchronously using client side ajax.
  // If query params include async=1 then use ajax (client has js enabled);
  // otherwise fall back to waiting to render the page until details are finished.
  if (['1', 'true'].includes(async)) {
    res.render('ready', { url, details: null })
  } else {
    detailsTool(id, type, (err, details) => {
      if (err) return next(err)
      res.render('ready', { url, details })
    })
  }
}
