// Used like an api endpoint to details html to be injected into the /ready page

const detailsTool = require('../tools/details.js')
const validId = require('../tools/validator.js').validId

exports.video = generateRouteHandler('video')
exports.playlist = generateRouteHandler('playlist')

function generateRouteHandler (type) {
  return function route (req, res, next) {
    if (!validId(req.params.id)) {
      return res.status(400).json({ error: `Invalid ${type} id` })
    }
    detailsTool(req.params.id, type, (err, details) => {
      if (err) {
        return res
          .status(500)
          .send(`<div class="error keep-newlines">${err.message || err}</div>`)
      } else res.render('details', { details })
    })
  }
}
