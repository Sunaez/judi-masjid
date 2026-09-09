import '@testing-library/jest-dom'

beforeEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.clear()
  if (typeof sessionStorage !== 'undefined') sessionStorage.clear()
})

if (!globalThis.fetch) {
  globalThis.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    })
  )
}

if (!globalThis.Headers) {
  globalThis.Headers = class Headers {}
}

if (!globalThis.Request) {
  globalThis.Request = class Request {}
}

if (!globalThis.Response) {
  globalThis.Response = class Response {}
}
