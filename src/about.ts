export function takeover() {
  document.body.innerHTML = `
  <m-col class="w-full h-full gap-4 text-xl justify-center items-center bg-gray-200">
    This is the about page. I will write something here at some point
    <m-route href="/">Take me back home!</m-route>
  </m-col>
  `
}
