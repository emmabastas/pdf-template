export function takeover() {
  document.body.innerHTML = `
  <m-col class="w-full h-full gap-4 text-xl justify-center items-center bg-gray-200">
    Could not find the page you are looking for.
    <m-route href="/">Take me back home!</m-route>
  </m-col>
`
}
