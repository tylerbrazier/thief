// set extra runtime options for youtube-dl

const conf = require('../conf.js')
const validQuery = require('../tools/validator.js').validQuery

module.exports = function route (req, res, next) {
  // do minimal sanity checks since this route is protected by basic auth
  if (!validQuery(req.query)) return res.status(400).render('error', { error: 'Bad query' })

  // the filter will remove empty strings from the result
  conf.youtube_dl_options = (req.query.options || '').split(' ').filter(v => !!v)

  res.render('message', { message: 'youtube-dl options set: ' + conf.youtube_dl_options.join(' ') })
}
