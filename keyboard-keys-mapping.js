function logMessage(...args) {
  console.log(...args)
}

window.addEventListener("keydown", (e) => {
  if (!e.repeat) logMessage(`Key "${e.key}" pressed [event: keydown]`, e)
  else logMessage(`Key "${e.key}" repeating [event: keydown]`, e)
})

window.addEventListener("beforeinput", (e) => {
  logMessage(`Key "${e.data}" about to be input [event: beforeinput]`, e)
})

window.addEventListener("input", (e) => {
  logMessage(`Key "${e.data}" input [event: input]`, e)
})

window.addEventListener("keyup", (e) => {
  logMessage(`Key "${e.key}" released [event: keyup]`, e)

  // if (e.code === 111 ) { // "Escape"
  //   // cleanup
  // }
})
