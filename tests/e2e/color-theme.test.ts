import { expect, test, type Locator, type Page } from '@playwright/test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../../server/db'
import {
  client as clientTable,
  project as projectTable,
  release as releaseTable,
  ticket as ticketTable,
  timeEntry,
} from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'
import { waitForClientMount } from './wait-for-client-mount'

async function contrastRatio(element: Locator) {
  return element.evaluate((foregroundElement) => {
    type Color = [number, number, number, number]
    const context = document.createElement('canvas').getContext('2d')
    if (!context) throw new Error('A canvas context is required to measure color contrast')

    const readColor = (value: string): Color => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = value
      context.fillRect(0, 0, 1, 1)
      const pixel = context.getImageData(0, 0, 1, 1).data
      return [pixel[0]!, pixel[1]!, pixel[2]!, pixel[3]! / 255]
    }
    const composite = (top: Color, bottom: Color): Color => {
      const alpha = top[3] + bottom[3] * (1 - top[3])
      if (alpha === 0) return [0, 0, 0, 0]
      return [
        (top[0] * top[3] + bottom[0] * bottom[3] * (1 - top[3])) / alpha,
        (top[1] * top[3] + bottom[1] * bottom[3] * (1 - top[3])) / alpha,
        (top[2] * top[3] + bottom[2] * bottom[3] * (1 - top[3])) / alpha,
        alpha,
      ]
    }

    const layers: Element[] = []
    for (
      let ancestor: Element | null = foregroundElement;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      layers.push(ancestor)
    }
    let background: Color = [0, 0, 0, 0]
    for (const layer of layers.toReversed()) {
      background = composite(readColor(getComputedStyle(layer).backgroundColor), background)
    }
    if (background[3] < 1) {
      const fallback: Color = document.documentElement.classList.contains('dark')
        ? [24, 24, 27, 1]
        : [255, 255, 255, 1]
      background = composite(background, fallback)
    }

    const foreground = composite(readColor(getComputedStyle(foregroundElement).color), background)
    const luminance = (color: Color) => {
      const channels = color.slice(0, 3).map((channel) => {
        const srgb = channel / 255
        return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
    }
    const foregroundLuminance = luminance(foreground)
    const backgroundLuminance = luminance(background)
    return (
      (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
      (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
    )
  })
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.locator('html').evaluate((element, value) => {
    element.classList.remove('light', 'dark')
    element.classList.add(value)
  }, theme)
}

test('semantic colors keep primary, hierarchy, and tracked-time text contrasted', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

  const brand = page.getByText('btt', { exact: true })
  const signIn = page.getByRole('button', { name: 'Continue with GitHub' })
  for (const theme of ['light', 'dark'] as const) {
    await setTheme(page, theme)
    await expect.poll(() => contrastRatio(brand)).toBeGreaterThanOrEqual(4.5)
    await expect.poll(() => contrastRatio(signIn)).toBeGreaterThanOrEqual(4.5)
  }

  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Color theme E2E owner',
    email: `color-theme-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  let clientId = ''
  let projectId = ''
  let releaseId = ''
  const ticketIds: string[] = []
  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    const create = async (path: string, data: unknown) => {
      const response = await page.request.post(path, { data })
      expect(response.ok(), await response.text()).toBeTruthy()
      return response.json()
    }
    const client = await create('/api/clients', { name: 'Theme contrast client' })
    clientId = client.id
    const project = await create('/api/projects', {
      clientId,
      name: 'Theme contrast project',
      color: '#abcdef',
    })
    projectId = project.id
    const release = await create('/api/releases', {
      projectId,
      name: 'Theme contrast release',
    })
    releaseId = release.id

    const date = new Date().toISOString().slice(0, 10)
    const usageCases = [
      { name: 'Theme info usage', minutes: 60, semantic: 'info' },
      { name: 'Theme success usage', minutes: 90, semantic: 'success' },
      { name: 'Theme warning usage', minutes: 120, semantic: 'warning' },
      { name: 'Theme error usage', minutes: 150, semantic: 'error' },
    ] as const
    const tickets = [] as { id: string; name: string; semantic: string }[]
    for (const [index, usage] of usageCases.entries()) {
      const ticket = await create('/api/tickets', {
        releaseId,
        title: usage.name,
        estimateMinutes: 100,
      })
      ticketIds.push(ticket.id)
      tickets.push({ id: ticket.id, name: usage.name, semantic: usage.semantic })
      await create('/api/time-entries', {
        ticketId: ticket.id,
        date,
        startMinute: 540 + index * 30,
        durationMinutes: usage.minutes,
        description: usage.name,
      })
    }

    await setTheme(page, 'light')
    await page.goto('/tickets')
    await waitForClientMount(page)
    const cards = tickets.map((ticket) => page.locator(`[data-board-ticket-id="${ticket.id}"]`))
    for (const [index, ticket] of tickets.entries()) {
      const card = cards[index]!
      await expect(card, ticket.name).toBeVisible()
      const usageValue = card.locator(`[aria-label^="Tracked:"] .text-${ticket.semantic}`)
      await expect(usageValue).toBeVisible()
      expect(
        await contrastRatio(usageValue),
        `${ticket.semantic} usage text`,
      ).toBeGreaterThanOrEqual(4.5)
    }

    const hierarchyLabel = cards[0]!
      .getByLabel('Ticket hierarchy')
      .getByRole('button')
      .first()
      .locator('span')
      .last()
    await expect(hierarchyLabel).toHaveClass(/text-secondary-700/)
    expect(
      await contrastRatio(hierarchyLabel),
      'light secondary hierarchy label',
    ).toBeGreaterThanOrEqual(4.5)

    await setTheme(page, 'dark')
    for (const [index, ticket] of tickets.entries()) {
      const usageValue = cards[index]!.locator(`[aria-label^="Tracked:"] .text-${ticket.semantic}`)
      expect(
        await contrastRatio(usageValue),
        `dark ${ticket.semantic} usage text`,
      ).toBeGreaterThanOrEqual(4.5)
    }
    await expect(hierarchyLabel).toHaveClass(/dark:text-secondary-300/)
    expect(
      await contrastRatio(hierarchyLabel),
      'dark secondary hierarchy label',
    ).toBeGreaterThanOrEqual(4.5)
  } finally {
    if (ticketIds.length) {
      await db.delete(timeEntry).where(inArray(timeEntry.ticketId, ticketIds))
      await db.delete(ticketTable).where(inArray(ticketTable.id, ticketIds))
    }
    if (releaseId) await db.delete(releaseTable).where(eq(releaseTable.id, releaseId))
    if (projectId) await db.delete(projectTable).where(eq(projectTable.id, projectId))
    if (clientId) await db.delete(clientTable).where(eq(clientTable.id, clientId))
    await helpers.deleteUser(owner.id)
  }
})
