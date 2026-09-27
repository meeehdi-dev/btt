export function externalUrl(input: string) {
  try {
    const url = new URL(input)
    if (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      url.hostname &&
      !url.username &&
      !url.password
    )
      return url.href
  } catch {
    // Invalid URL.
  }
  throw new Error('A valid http(s) URL is required')
}
