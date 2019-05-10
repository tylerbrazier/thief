// Initiates a request for Server-sent Events.
// https://medium.com/conectric-networks/a-look-at-server-sent-events-54a77f8d6ff7

// The server sends the following events types:
// - progress: data field will contain html to output
// - done: data field will be the route to the file to download
// - error: data field will contain an error message
// The connection is closed on 'done' or 'error' events.

/* eslint-env browser */

var output = document.getElementById('output')
var eventSourceUrl = document.getElementById('eventSourceUrl').value
var downloadLink = document.getElementById('download')
var eventSource = new EventSource(eventSourceUrl)

output.innerHTML = 'Requesting progress updates...<br>'

eventSource.addEventListener('progress', function (event) {
  output.innerHTML += event.data
})

eventSource.addEventListener('done', function (event) {
  downloadLink.setAttribute('href', event.data)
  downloadLink.innerText = event.data
  eventSource.close()
})

eventSource.addEventListener('error', function (event) {
  output.innerHTML += '<span class="error">' + event.data + '</span>'
  eventSource.close()
})
