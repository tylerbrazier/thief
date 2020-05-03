const Job = require('./job.js')
const { v4: uuid } = require('uuid')

module.exports = { create, lookup }

const jobs = {} // map of ids to Jobs

function create (options) {
  const id = uuid()
  const job = new Job(id, options)
  jobs[id] = job
  job.emitter.on('done', () => remove(id))
  job.emitter.on('error', () => remove(id))
  job.run()
  return id
}

function lookup (id) {
  return jobs[id]
}

function remove (id) {
  delete jobs[id]
}
