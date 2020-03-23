/* eslint-env browser */

var moreButtons = document.querySelectorAll('button.get-more-info')
moreButtons.forEach(function (button) { button.onclick = onclick })

function onclick () {
  var infoEle = document.querySelector('.more-info[data-id="' + this.dataset.id + '"]')
  infoEle.classList.toggle('hidden')

  if (infoEle.classList.contains('loaded')) return

  infoEle.innerHTML = '<progress></progress>'
  fetch('/metadata/' + this.dataset.type + '/' + this.dataset.id)
    .then(function (res) { return res.json() })
    .then(function (json) {
      if (json.error) showError(infoEle, json.error)
      else showInfo(infoEle, json)
    })
    .catch(function (err) { showError(infoEle, err.message) })
}

function showInfo (ele, json) {
  ele.innerHTML = ''
  if (json.duration) ele.innerHTML += '<div><b>Duration:</b> ' + json.duration + '</div>'
  if (json.track) ele.innerHTML += '<div><b>Song:</b> ' + json.track + '</div>'
  if (json.artist) ele.innerHTML += '<div><b>Artist:</b> ' + json.artist + '</div>'
  if (json.album) ele.innerHTML += '<div><b>Album:</b> ' + json.album + '</div>'
  ele.innerHTML += '<div>' + (json.description || '(No description)') + '</div>'
  ele.classList.add('loaded')
}

function showError (ele, message) {
  ele.innerText = message
  ele.classList.add('loaded', 'error')
}
