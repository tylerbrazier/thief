// Appends &async=1 to each /ready link on the page to tell the server
// to send the /ready page right away and fetch details with ajax.
// Do this because loading video details using youtube-dl is slow.
// Using javascript to append &async=1 because if client has js disabled
// then details need to be loaded synchronously.

/* eslint-env browser */

(function () {
  var anchors = document.getElementsByClassName('details-link')
  for (var anchor of anchors) {
    anchor.href += '&async=1'
  }
}())
