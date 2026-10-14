import { expect, type Page } from '@playwright/test'

export function appToasts(page: Page) {
  return page.getByRole('region', { name: 'Notifications (F8)' }).locator('[data-slot="base"]')
}

export function appToast(page: Page, title: string) {
  return appToasts(page).filter({ hasText: title })
}

export function renderedAppToast(page: Page, title: string) {
  return page.locator('[data-slot="viewport"] > li[data-slot="base"]').filter({ hasText: title })
}

export async function openToastAction(page: Page, title: string, action: string, last = false) {
  const matchingToasts = appToast(page, title)
  const toast = last ? matchingToasts.last() : matchingToasts.first()
  await expect(toast).toBeVisible()
  const currentUrl = page.url()
  await toast.getByRole('link', { name: action, exact: true }).click()
  await page.waitForURL((url) => url.href !== currentUrl, { timeout: 5_000 })
}
