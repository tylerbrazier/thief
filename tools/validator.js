// validate youtube video or playlist id
exports.validId = function validId (id) {
  if (!id || typeof id !== 'string') return false
  return /^[A-Za-z0-9_-]+$/.test(id)
}

// validate each query param is a single value; see https://expressjs.com/en/4x/api.html#req.query
exports.validQuery = function validQuery (queryParams) {
  return Object.values(queryParams).every(q => typeof q === 'string')
}

exports.validFormat = function validFormat (format) {
  return /^[a-z0-9]*$/.test(format)
}

exports.validPlaylistItems = function validPlaylistItems (input) {
  // https://github.com/ytdl-org/youtube-dl/blob/master/README.md#video-selection
  return /^[\d,-]*$/.test(input)
}
