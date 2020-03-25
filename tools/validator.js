exports.validId = function validId (id) {
  if (!id || typeof id !== 'string') return false
  return /^[A-Za-z0-9_-]+$/.test(id)
}
