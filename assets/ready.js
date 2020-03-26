// Fetches video/playlist details and injects the html into the page.
// Do this because loading video details using youtube-dl is slow.

/* eslint-env browser */

(function () {
  var detailsDiv = document.getElementById('async-details')
  var params = new URLSearchParams(window.location.search)
  var type = params.get('type')
  var id = params.get('id')
  if (!type || !id) return error('Error: no type or id param')

  var progress = document.createElement('progress')
  var h2 = document.createElement('h2')
  h2.innerText = type.charAt(0).toUpperCase() + type.slice(1) + ' details'
  detailsDiv.append(h2, progress)

  fetch('/details/' + type + '/' + id)
    .then(function (res) { return res.text() })
    .then(onResponse)
    .catch(error)

  function onResponse (html) {
    progress.remove()
    var div = document.createElement('div')
    div.innerHTML = html
    detailsDiv.append(div)
  }
  function error (err) {
    detailsDiv.innerHTML = '<div class="error">' + (err.message || err) + '</div>'
  }
}())
