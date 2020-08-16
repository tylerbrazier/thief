// tool for calling youtube's api
// https://developers.google.com/youtube/v3/docs/search/list
// https://developers.google.com/youtube/v3/docs/playlists/list
// https://developers.google.com/youtube/v3/docs/playlistItems/list

const https = require('https')
const conf = require('../conf.js')
const debuglog = require('util').debuglog('api')

// route is either 'search' or 'playlist' or 'playlistItems'
// q is an object of query params (api key automatically added)
// callback is passed (err, json)
module.exports = function api (route, q, callback) {
  q.key = conf.YOUTUBE_API_KEY
  q.maxResults = conf.MAX_PAGE_SIZE
  const url = `https://www.googleapis.com/youtube/v3/${route}?${formatQuery(q)}`

  debuglog('GET', url)
  https.get(url, res => {
    let payload = ''
    res.setEncoding('utf8')
    res.on('data', chunk => { payload += chunk })
    res.on('end', () => {
      debuglog('Response from GET ' + url, payload)
      try {
        if (res.statusCode !== 200) return callback(Error(payload))
        const json = JSON.parse(payload)
        if (route === 'search') {
          return callback(null, normalizeSearchResponse(json))
        }
        if (route === 'playlists') {
          return callback(null, normalizePlaylistResponse(json))
        }
        if (route === 'playlistItems') {
          return callback(null, normalizePlaylistItemsResponse(json))
        }
        throw Error('Invalid route type')
      } catch (err) {
        callback(err)
      }
    })
  }).on('error', callback)
}

function formatQuery (q) {
  return Object.entries(q).map(([k, v]) => `${k}=${v}`).join('&')
}

function normalizeSearchResponse (json) {
  return {
    type: 'search',
    nextPageToken: json.nextPageToken,
    prevPageToken: json.prevPageToken,
    pageInfo: json.pageInfo,
    entries: json.items.map(item => ({
      id: item.id.videoId || item.id.playlistId,
      type: item.id.kind.replace('youtube#', ''),
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.default.url
    }))
  }
}

// assumes playlist api was called with an id so only one item is returned
function normalizePlaylistResponse (json) {
  if (!json.items.length) return { type: 'playlist' } // would only happen if id is bogus
  return {
    title: json.items[0].snippet.title,
    channel: json.items[0].snippet.channelTitle,
    description: json.items[0].snippet.description,
    thumbnail: json.items[0].snippet.thumbnails.medium.url
  }
}

function normalizePlaylistItemsResponse (json) {
  return {
    type: 'playlist',
    nextPageToken: json.nextPageToken,
    prevPageToken: json.prevPageToken,
    pageInfo: json.pageInfo,
    entries: json.items.map(item => ({
      id: item.snippet.resourceId.videoId,
      type: 'video',
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.default.url,
      position: item.snippet.position + 1 // add one because youtube-dl playlist selection starts at 1
      // exclude channelTitle because it's not guaranteed to match uploader
    }))
  }
}
