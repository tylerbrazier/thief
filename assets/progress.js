// Initiates a request for Server-sent Events.
// https://medium.com/conectric-networks/a-look-at-server-sent-events-54a77f8d6ff7

// The server sends the following events types:
// - info: data field will have json metadata about the download
// - progress: data field will contain html to output
// - done: data field will be the route to the file to download
// - error: data field will contain an error message
// The connection is closed on 'done' or 'error' events.

/* eslint-env browser */

(function () {
  var percentCompleteRegex = /^\[download\] +[\d.]+%/
  var output = document.getElementById('output')
  var eventSourceUrl = document.getElementById('event-source-url').value
  var downloadLink = document.getElementById('download')
  var eventSource = new EventSource(eventSourceUrl)

  output.innerHTML = 'Requesting progress updates...'

  eventSource.addEventListener('info', function (event) {
    var data = JSON.parse(event.data)
    // if a playlist was not compressed, make the link just direct to the folder
    if (data.uncompressed) downloadLink.removeAttribute('download')
  })

  eventSource.addEventListener('progress', function (event) {
    // if the message is download percentage, update latest message if it was also percentage
    if (percentCompleteRegex.test(event.data)) {
      setPercentageMessage(event.data)
    } else {
      var d = document.createElement('div')
      d.innerHTML = event.data
      output.prepend(d)
    }
  })

  eventSource.addEventListener('done', function (event) {
    downloadLink.setAttribute('href', event.data)
    downloadLink.innerText = event.data
    eventSource.close()
  })

  eventSource.addEventListener('error', function (event) {
    var message = event.data || 'Error'
    output.innerHTML = '<span class="error">' + message + '</span><br>' + output.innerHTML
    eventSource.close()
  })

  function setPercentageMessage (newMessage) {
    var previousMessage = output.firstChild
    if (previousMessage && previousMessage.classList.contains('percentage')) {
      previousMessage.innerHTML = newMessage
    } else {
      var d = document.createElement('div')
      d.classList.add('percentage')
      d.innerHTML = newMessage
      output.prepend(d)
    }
  }
}())
