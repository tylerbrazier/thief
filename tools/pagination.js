// adds a pagination object to json param
module.exports = function addPagination (req, json) {
  // Don't do anything if all the results can fit on one page
  // (or if json is details for a video)
  if (!json.nextPageToken && !json.prevPageToken) return json

  if (json.nextPageToken) {
    var nextUrl = new URL(req.url, 'http://' + req.headers.host)
    nextUrl.searchParams.set('pageToken', json.nextPageToken)
  }
  if (json.prevPageToken) {
    var prevUrl = new URL(req.url, 'http://' + req.headers.host)
    prevUrl.searchParams.set('pageToken', json.prevPageToken)
  }

  return Object.assign(json, {
    pagination: {
      next: nextUrl && nextUrl.pathname + nextUrl.search,
      prev: prevUrl && prevUrl.pathname + prevUrl.search,
      totalResults: json.pageInfo.totalResults,
      resultsPerPage: json.pageInfo.resultsPerPage
    }
  })
}
