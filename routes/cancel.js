const pool = require('../tools/jobPool.js')

module.exports = function route (req, res, next) {
  const job = pool.lookup(req.params.id)
  if (!job) return res.status(400).send('No download in progress')

  const success = job.cancel()
  if (success) return res.send('ok')
  else res.status(500).send('Unable to kill the process')
}
