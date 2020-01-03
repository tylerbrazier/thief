const https = require('https')

// callback is passed (err, json)
module.exports = function api (url, callback) {
  https.get(url, res => {
    let payload = ''
    res.setEncoding('utf8')
    res.on('data', chunk => { payload += chunk })
    res.on('end', () => {
      console.debug(url)
      console.debug(payload)
      try {
        const json = JSON.parse(payload)
        if (res.statusCode === 200) callback(null, json)
        else callback(Error(payload))
      } catch (err) {
        callback(Error('Unable to parse json from Youtube API response: ' + err.message))
      }
    })
  }).on('error', callback)
}
