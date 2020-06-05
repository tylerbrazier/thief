// Initiates a request for Server-sent Events.
// https://medium.com/conectric-networks/a-look-at-server-sent-events-54a77f8d6ff7
// See /routes/progress.js for details on the events that are sent.
// The connection is closed on 'done' or 'error' events.

/* eslint-env browser */

(function () {
  var percentCompleteRegex = /^\[download\] +[\d.]+%/
  var outputDiv = document.getElementById('output')
  var controlDiv = document.getElementById('download-control')
  var downloadId = document.getElementById('download-id').value
  var eventSource = new EventSource('/progress/' + downloadId)
  var cancelButton = null

  prependOutput('Requesting progress updates...')

  eventSource.addEventListener('progress', function (event) {
    if (!cancelButton) makeCancelButton()
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
    cleanup()
    var json = parseEvent(event)
    if (!json || !json.link) return
    makeDownloadLink(json)
  })

  eventSource.addEventListener('error', function (event) {
    cleanup()
    console.error(event)
    var json = parseEvent(event)
    var message = (json && json.message) || 'Error'
    prependOutput(message, 'error')
  })

  function makeCancelButton () {
    cancelButton = document.createElement('button')
    cancelButton.innerText = 'Cancel'
    cancelButton.onclick = cancel
    controlDiv.appendChild(cancelButton)
  }

  function makeDownloadLink (eventData) {
    var a = document.createElement('a')
    a.innerText = eventData.link
    a.setAttribute('href', eventData.link)
    if (!eventData.uncompressed) a.setAttribute('download', '')
    controlDiv.appendChild(a)
  }

  function cancel () {
    cancelButton.disabled = true // prevent multiple clicks
    fetch('/cancel/' + downloadId)
      .then(function (res) {
        if (res.ok) prependOutput('Cancel request received')
        else return res.text().then(function (text) { return Promise.reject(Error(text)) })
      })
      .catch(function (err) {
        console.error(err)
        prependOutput(err.message, 'error')
      })
  }

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
    var previousMessage = outputDiv.firstChild
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
    outputDiv.prepend(d)
  }

  function cleanup () {
    cancelButton.remove()
    eventSource.close()
  }
}())
