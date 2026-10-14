import { expect, type Page } from '@playwright/test'

export async function openAgendaAddDialog(
  page: Page,
  date: string,
  { focusTicketSearch = true }: { focusTicketSearch?: boolean } = {},
) {
  const timeline = page.getByRole('region', { name: 'Week timeline' })
  const column = timeline.locator(`[data-week-date="${date}"]`)
  const [timelineBox, columnBox] = await Promise.all([timeline.boundingBox(), column.boundingBox()])
  if (!timelineBox || !columnBox)
    throw new Error('Agenda timeline and current-day column must be visible')
  const start = {
    x: columnBox.x + columnBox.width / 2,
    y: timelineBox.y + (540 - 480) * 1.8 + 5,
  }
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x, start.y + 10, { steps: 5 })
  await page.mouse.up()
  const dialog = page.getByRole('dialog', { name: 'Add completed work' })
  await expect(dialog).toBeVisible()
  if (focusTicketSearch) await expect(page.getByPlaceholder('Search tickets…')).toBeFocused()
  return dialog
}
