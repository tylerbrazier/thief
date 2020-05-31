// Initiates a request for Server-sent Events.
// https://medium.com/conectric-networks/a-look-at-server-sent-events-54a77f8d6ff7
// See /routes/progress.js for details on the events that are sent.
// The connection is closed on 'done' or 'error' events.

/* eslint-env browser */

(function () {
  var percentCompleteRegex = /^\[download\] +[\d.]+%/
  var output = document.getElementById('output')
  var eventSourceUrl = document.getElementById('event-source-url').value
  var downloadLink = document.getElementById('download')
  var eventSource = new EventSource(eventSourceUrl)

  prependOutput('Requesting progress updates...')

  eventSource.addEventListener('progress', function (event) {
    // if the message is download percentage, update latest message if it was also percentage
    var json = parseEvent(event)
    if (!json || !json.message) return
    json.message.trim().split('\n').forEach(function (message) {
      if (percentCompleteRegex.test(message)) {
        setPercentageMessage(message)
      } else if (message) {
        prependOutput(message, json.error ? 'error' : null)
      }
    })
  })

  eventSource.addEventListener('done', function (event) {
    eventSource.close()
    var json = parseEvent(event)
    if (!json || !json.link) return
    if (json.uncompressed) downloadLink.removeAttribute('download')
    downloadLink.setAttribute('href', json.link)
    downloadLink.innerText = json.link
  })

  eventSource.addEventListener('error', function (event) {
    eventSource.close()
    console.error(event)
    var json = parseEvent(event)
    var message = (json && json.message) || 'Error'
    prependOutput(message, 'error')
  })

  function parseEvent (event) {
    if (!event || !event.data) return console.error('No data on event')
    try {
      return JSON.parse(event.data)
    } catch (err) {
      console.error(err)
      prependOutput('Unable to parse json: ' + event.data, 'error')
    }
  }

  function setPercentageMessage (newMessage) {
    var previousMessage = output.firstChild
    if (previousMessage && previousMessage.classList.contains('percentage')) {
      previousMessage.innerText = newMessage
    } else {
      prependOutput(newMessage, 'percentage')
    }
  }

  function prependOutput (message, className) {
    var d = document.createElement('div')
    if (className) d.className = className
    d.innerText = message
    output.prepend(d)
  }
}())
