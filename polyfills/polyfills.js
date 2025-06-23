// script:  js
function TIC() {
  gameScreens[currentScreen]()
}

Object.fromEntries = function (entries) {
  var obj = {}
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i]
    var key = entry[0]
    var value = entry[1]
    obj[key] = value
  }
  return obj
}

String.prototype.padStart = function padStart(targetLength, padString) {
  padString = typeof padString !== 'undefined' ? String(padString) : ' '
  var str = String(this)
  if (str.length >= targetLength) {
    return str
  }
  var padding = ''
  var padLength = targetLength - str.length
  while (padding.length < padLength) {
    padding += padString
  }
  padding = padding.slice(0, padLength)
  return padding + str
}
