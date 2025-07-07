type Maybe<T> = {
  type: "just",
  value: T
} | {
  type: "nothing",
}

export function just<T>(v: T): Maybe<T> {
  return {
    type: "just",
    value: v,
  }
}

export function nothing<T>(): Maybe<T> {
  return {
    type: "nothing",
  }
}

export type JSONLike =
  | string
  | number
  | boolean
  | null
  | JSONLike[]
  | { [key: string]: JSONLike }

export function toDataObj(v: any, visited_?: Set<any>): JSONLike {
  const visited = (function() {
    if (visited_ !== undefined) {
      return visited_
    }
    return new Set()
  })()

  if (visited.has(v)) {
    return `<recurisve ${typeof v}>`
  }

  if (typeof v === "string") {
    return v
  }

  if (typeof v === "number") {
    return v
  }

  if (typeof v === "boolean") {
    return v
  }

  if (typeof v === "function") {
    return "<function>"
  }

  if (v instanceof Node) {
    return "<Node>";
  }

  if (v instanceof Window) {
    return "<Window>";
  }

  if (v === null) {
    return null
  }

  if (Array.isArray(v)) {
    return v.map(e => toDataObj(e, visited))
  }

  if (typeof v === "object") {
    if (v instanceof Date) {
        return v.toISOString()
    }
    if (v instanceof RegExp) {
      return v.toString()
    }

    visited.add(v)
    const obj: Record<string, JSONLike> = {}
    for (let k in v) {
      obj[k] = toDataObj(v[k], visited)
    }
    return obj

    //return Object.fromEntries(Object.entries(v).map(([k, v]) => [k, toJSONLike(v)]).filter(([_, v]) => v !== undefined))
  }

  return `<${typeof v}>`
}

export function compare(a: JSONLike, b: JSONLike): boolean {
  if (a === b) {
    return true;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!compare(a[i]!, b[i]!)) {
        return false;
      }
    }
    return true;
  }

  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (const key of keysA) {
      if (!keysB.includes(key)) {
        return false;
      }
      // @ts-ignore
      if (!compare(a[key]!, b[key]!)) {
        return false;
      }
    }
    return true;
  }

  throw new Error("Unreachable")
}

export class Signal<T> {
  private latestValue: T
  private listeners: ((_: T) => void)[]

  constructor(initialValue: T) {
    this.latestValue = initialValue
    this.listeners = []
  }

  getValue(): T {
    return this.latestValue
  }

  setValue(v: T) {
    for (const listener of this.listeners) {
      listener(v)
    }
    this.latestValue = v
  }

  triggerUpdate() {
    this.setValue(this.getValue())
  }

  listen(fn: (_: T) => void) {
    this.listeners.push(fn)
  }

  throttle(ms: number): Signal<T> {
    const s = new Signal(this.getValue())
    let deactivated = false

    const this_ = this
    function cb(v: T) {
      if (deactivated) {
        return
      }
      deactivated = true
      setTimeout(() => {
        deactivated = false
        if (this_.getValue() !== s.getValue()) {
          cb(this_.getValue())
        }
      }, ms)
      s.setValue(v)
    }
    this.listen(cb)

    return s
  }

  debounce(ms: number): Signal<T> {
    const s = new Signal(this.getValue())
    let timer: number
    this.listen(v => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        s.setValue(v)
      }, ms)
    })
    return s
  }

  dedupe(compare: (a: T, b: T) => boolean): Signal<T> {
    const s = new Signal(this.getValue())
    this.listen(v => {
      if (!compare(v, s.getValue())) {
        s.setValue(v)
      }
    })
    return s
  }

  filterMap<A>(iv: A, fn: (_: T) => Maybe<A>): Signal<A> {
    const s = new Signal<A>(iv)
    this.listen(v => {
      const maybe = fn(v)
      if (maybe.type === "just") {
        s.setValue(maybe.value)
      }
    })
    return s
  }

  map<A>(fn: (_: T) => A): Signal<A> {
    return this.filterMap(
      fn(this.getValue()),
      (v => just(fn(v)))
    )
  }

  static map2<A, B, T>(
    sa: Signal<A>,
    sb: Signal<B>,
    fn: (a: A, b: B) => T): Signal<T> {
      const st = new Signal(fn(sa.getValue(), sb.getValue()))
      sa.listen(v => {
        st.setValue(fn(v, sb.getValue()))
      })
      sb.listen(v => {
        st.setValue(fn(sa.getValue(), v))
      })
      return st
  }
}

export class AssertionError extends Error {
  constructor(msg: string) {
    super("Assertion error: " + msg)
  }
}

export function assert(cond: boolean) {
  if (!cond) {
    throw new Error("Assertion failed")
  }
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

const domParser = new DOMParser()

export function parseHTML(source: string): HTMLElement {
  const doc = domParser.parseFromString(`
  <head></head><body>${source}</body>
`, "text/html")
  if (doc.body.firstElementChild instanceof HTMLElement) {
    return doc.body.firstElementChild
  }
  throw new AssertionError("")
}

export function parseTemplate(source: string): DocumentFragment {
  const doc = domParser.parseFromString(source, "text/html")
  if ( doc.body.firstChild instanceof HTMLTemplateElement) {
    return doc.body.firstChild.content
  }
  throw new AssertionError("Source is not <template>")
}

export function randomId(): string {
  return "foo"
}
