/*
This module is concerned with dialog-boxes fir the user to interact with.
The idea is to expose an API similar to the built-in `alert` and `confirm`. That
is, the consumer of the API need not be concerned with how the dialogues are
presented, only with what they want to communicate and ask.
 */

import * as utils from "./utils"
import * as ls from "./localstorage"

// Returns a function that can be called to remove the dialogue
function showDialogoue(dialogue: HTMLElement): () => void {
  const overlay = document.createElement("div")
  overlay.style.position = "absolute"
  overlay.style.width = "100vw"
  overlay.style.height = "100vh"
  overlay.style.display = "flex"
  overlay.style.top = "0px"
  overlay.style.backgroundColor = "black"
  overlay.style.opacity = "0.5"
  overlay.style.zIndex = "1"

  const dialogueOuterContainer = document.createElement("div")
  dialogueOuterContainer.style.position = "absolute"
  dialogueOuterContainer.style.width = "100vw"
  dialogueOuterContainer.style.height = "100vh"
  dialogueOuterContainer.style.display = "flex"
  dialogueOuterContainer.style.top = "0px"
  dialogueOuterContainer.style.zIndex = "2"
  dialogueOuterContainer.style.justifyContent = "center"
  dialogueOuterContainer.style.alignItems = "center"

  const dialogueInnerContainer = document.createElement("div")
  dialogueInnerContainer.style.flexShrink = "0"
  dialogueInnerContainer.style.width = "min-content"
  dialogueInnerContainer.style.height = "min-content"

  dialogueInnerContainer.append(dialogue)
  dialogueOuterContainer.append(dialogueInnerContainer)
  document.body.append(overlay)
  document.body.append(dialogueOuterContainer)

  return () => {
    overlay.remove()
    dialogueOuterContainer.remove()
  }
}

const [
  errorDialogueDom,
  errorDialogueDetails,
  errorDialogueSendBtn,
  errorDialogueNoSendBtn,
  errorDialogueRememberCheckbox,
] = (function() {

  const dom = utils.parseHTML(`
  <div class="bg-gray-200 flex flex-col bakground-white w-2xl rounded">
    <div class="w-full bg-red-300 rounded py-4 flex flex-row justify-center">
      <p class="text-xl inline">🛑 Something went wrong 🛑</p>
    </div>
    <div class="flex flex-col p-6 gap-4 items-center">
      <p>An error occurred on the code that I did not expect, I would really appreciate it if you sent an error report, that will help me fix this error for you and others. No personal data will be sent! (All data that will be sent is in the details bellow)</p>
      <details class="w-md">
        <summary>Details</summary>
        <pre class="text-xs max-h-[200px] overflow-auto border rounded p-2"></pre>
      </details>
      <div class="flex flex-row gap-4 items-center">
        <button class="rounded border bg-gray-250 hover:bg-gray-300 px-2 py-1">Send report</button>
        <button class="rounded border bg-gray-250 hover:bg-gray-300 px-2 py-1">Do not send</button>
        <div class="flex flex-row gap-2 items-center px-4">
            <input type="checkbox"></input>
            <label>Remember my choice</label>
          </div>
      </div>
    </div>
  </div>
  `)

  const textArea =
        dom.getElementsByTagName("pre")[0]!
  utils.assert(textArea instanceof HTMLPreElement)

  const sendBtn =
        dom.getElementsByTagName("button")[0]!
  utils.assert(sendBtn instanceof HTMLButtonElement)

  const noSendBtn =
        dom.getElementsByTagName("button")[1]!
  utils.assert(noSendBtn instanceof HTMLButtonElement)

  const rememberCheckbox =
        dom.getElementsByTagName("input")[0]!
  utils.assert(rememberCheckbox instanceof HTMLInputElement)

  return [
    dom,
    textArea,
    sendBtn,
    noSendBtn,
    rememberCheckbox,
  ]

})()

export function error(data: utils.JSONLike, send: () => void) {
  if (ls.getSendDiagnostics() === "ask") {
    errorDialogueDetails.innerText = JSON.stringify(data, null, 2)

    const remove = showDialogoue(errorDialogueDom)

    errorDialogueSendBtn.addEventListener("click", onSend)
    errorDialogueNoSendBtn.addEventListener("click", onNoSend)

    function onSend() {
      errorDialogueSendBtn.removeEventListener("click", onSend)
      remove()
      if (errorDialogueRememberCheckbox.checked) {
        ls.setSendDiagnostics("yes")
      }
      send()
    }

    function onNoSend() {
      errorDialogueNoSendBtn.removeEventListener("click", onNoSend)
      remove()
      if (errorDialogueRememberCheckbox.checked) {
        ls.setSendDiagnostics("no")
      }
    }
  }

  if (ls.getSendDiagnostics() === "yes") {
    send()
  }
}
