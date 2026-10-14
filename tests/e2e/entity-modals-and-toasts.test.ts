import { expect, test } from '@playwright/test'
import { testAuth } from '../../server/utils/auth-test'
import { openAgendaAddDialog } from './helpers/agenda'
import { expectModalActionsRightAligned } from './helpers/modal-actions'
import { renderedAppToast } from './helpers/toasts'
import { waitForClientMount } from './wait-for-client-mount'

async function createOwner(context: import('@playwright/test').BrowserContext) {
  const helpers = (await testAuth.$context).test
  const user = helpers.createUser({
    name: 'M44 empty Agenda owner',
    email: `m44-agenda-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(user)
  await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
  return { helpers, user }
}

test('creation modals preserve focus, dismissal, and viewport width at 1280 CSS px', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createOwner(context)
  try {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/clients')
    await waitForClientMount(page)

    await page.getByRole('button', { name: 'New client' }).click()
    const clientDialog = page.getByRole('dialog', { name: 'New client' })
    await expect(clientDialog).toBeVisible()
    const clientName = clientDialog.getByRole('textbox', { name: 'Name' })
    await expect(clientName).toBeFocused()
    await expectModalActionsRightAligned(clientDialog, ['Cancel', 'Create client'])
    await expect(clientDialog.getByRole('button', { name: 'Create client' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Meta+Enter Control+Enter',
    )
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy()
    await page.keyboard.press('Escape')
    await expect(clientDialog).toBeHidden()

    await page.getByRole('button', { name: 'New client' }).click()
    await page.keyboard.press('Meta+Enter')
    expect(
      await clientName.evaluate((input) => (input as HTMLInputElement).validity.valueMissing),
    ).toBeTruthy()
    await clientName.fill('Keyboard shortcut client')
    await page.keyboard.press('Control+Enter')
    await expect(clientDialog).toBeHidden()
    await expect(renderedAppToast(page, 'Client created.')).toBeVisible()

    await page.getByRole('button', { name: 'New client' }).click()
    await clientDialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(clientDialog).toBeHidden()

    await page.goto('/tickets')
    await waitForClientMount(page)
    await page.getByRole('button', { name: 'New ticket' }).click()
    const ticketDialog = page.getByRole('dialog', { name: 'New ticket' })
    await expect(ticketDialog).toBeVisible()
    expect(
      await ticketDialog.evaluate((dialog) => dialog.contains(document.activeElement)),
    ).toBeTruthy()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy()
    await page.mouse.click(1, 1)
    await expect(ticketDialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(ticketDialog).toBeHidden()

    await page.getByRole('button', { name: 'New ticket' }).click()
    await ticketDialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(ticketDialog).toBeHidden()
  } finally {
    await helpers.deleteUser(user.id)
  }
})

test('Agenda Add completed work shows a non-actionable empty state when no active ticket exists', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createOwner(context)
  try {
    await page.setViewportSize({ width: 1600, height: 1200 })
    const date = await page.evaluate(() => {
      const value = new Date()
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    })
    await page.goto(`/agenda?date=${date}`)
    await waitForClientMount(page)
    await page.waitForLoadState('networkidle')
    const dialog = await openAgendaAddDialog(page, date, { focusTicketSearch: false })
    await expect(dialog.getByText(/No active tickets\./)).toBeVisible()
    await expect(dialog.getByRole('link', { name: /Create a ticket/ })).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: /Create a ticket/ })).toHaveCount(0)
  } finally {
    await helpers.deleteUser(user.id)
  }
})
