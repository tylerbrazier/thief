var moreButtons = document.querySelectorAll('button.get-more-info')
moreButtons.forEach(function (button) { button.onclick = onclick })

function onclick () {
  var moreInfo = document.querySelector('.more-info[data-id="' + this.dataset.id + '"]')
  moreInfo.classList.toggle('hidden')

  if (moreInfo.classList.contains('loaded')) return

  moreInfo.innerHTML = '<progress></progress>'
  fetch('/metadata?id=' + this.dataset.id + '&type=' + this.dataset.type)
    .then(function (res) { return res.json() })
    .then(function (json) {
      if (json.error) showError(moreInfo, json.error)
      else showInfo(moreInfo, json)
    })
    .catch(function (err) { showError(moreInfo, err.message) })
}

function showInfo (ele, json) {
  ele.classList.add('loaded')

  ele.innerText = json.items[0].snippet.description || '(no description)'
}

function showError (ele, message) {
  ele.innerText = message
  ele.classList.add('loaded', 'error')
}
