export function initialize() {

  // `.bytes()` is not implemented on mobile browser I personally use,
  // and it is not transpiled even though that version is in the
  // browserlist..
  if (Response.prototype.bytes === undefined) {
    Response.prototype.bytes = async function() {
      return new Uint8Array(await this.arrayBuffer())
    }
  }
}
