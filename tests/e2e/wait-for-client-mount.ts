import type { Page } from '@playwright/test'

/** Wait for Nuxt's Vue app to mount without waiting for unrelated network traffic to settle. */
export function waitForClientMount(page: Page) {
  return page.waitForFunction(() => {
    const root = document.querySelector('#__nuxt')
    return root !== null && '__vue_app__' in root
  })
}
