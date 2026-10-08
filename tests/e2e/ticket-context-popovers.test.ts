import { expect, test as base, type Locator } from '@playwright/test'
import { waitForClientMount } from './wait-for-client-mount'
import { eq, inArray, or } from 'drizzle-orm'
import { db } from '../../server/db'
import {
  client,
  project,
  release,
  ticket,
  ticketLink,
  ticketRelation,
  timeEntry,
} from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'

async function settledBorderTopColor(locator: Locator) {
  return locator.evaluate(
    (element) =>
      new Promise<string>((resolve, reject) => {
        let previous = getComputedStyle(element).borderTopColor
        let stableFrames = 0
        let frames = 0
        const check = () => {
          const current = getComputedStyle(element).borderTopColor
          stableFrames = current === previous ? stableFrames + 1 : 0
          previous = current
          if (stableFrames >= 3) resolve(current)
          else if (++frames >= 120) reject(new Error('Border color did not settle'))
          else requestAnimationFrame(check)
        }
        requestAnimationFrame(check)
      }),
  )
}

async function expectNoHorizontalOverflow(locator: Locator) {
  await expect
    .poll(() => locator.evaluate((element) => element.scrollWidth <= element.clientWidth))
    .toBe(true)
}

async function expectPlainIconTrigger(trigger: Locator) {
  await expect(trigger).toBeVisible()
  await expect(trigger).toHaveClass(/bg-default/)
  await expect(trigger.locator('[aria-hidden="true"]').first()).toBeVisible()
  await expect(trigger.locator('xpath=following-sibling::span[@data-slot="base"]')).toHaveCount(0)
}

async function expectCenteredIcon(trigger: Locator, icon: Locator) {
  const [triggerBox, iconBox] = await Promise.all([trigger.boundingBox(), icon.boundingBox()])
  if (!triggerBox || !iconBox) throw new Error('Compact icon trigger must be visible')
  expect(
    Math.abs(triggerBox.x + triggerBox.width / 2 - (iconBox.x + iconBox.width / 2)),
  ).toBeLessThanOrEqual(1)
  expect(
    Math.abs(triggerBox.y + triggerBox.height / 2 - (iconBox.y + iconBox.height / 2)),
  ).toBeLessThanOrEqual(1)
}

async function measureCompactBadgeContrast(label: Locator) {
  return label.evaluate((element) => {
    type RGB = readonly [number, number, number]
    type RGBA = readonly [number, number, number, number]
    const context = document.createElement('canvas').getContext('2d')
    if (!context) throw new Error('A canvas context is required to measure badge contrast')
    const readColor = (value: string): RGBA => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = value
      context.fillRect(0, 0, 1, 1)
      const pixels = context.getImageData(0, 0, 1, 1).data
      return [pixels[0]!, pixels[1]!, pixels[2]!, pixels[3]! / 255]
    }
    const button = element.closest('button')
    const card = element.closest('article')
    if (!button || !card)
      throw new Error('Compact hierarchy badge text must be inside an agenda card button')
    const style = getComputedStyle(element)
    const foreground = readColor(style.color)
    const overlay = readColor(getComputedStyle(button).backgroundColor)
    const surface = readColor(getComputedStyle(card).backgroundColor)
    const background: RGB = [
      overlay[0] * overlay[3] + surface[0] * (1 - overlay[3]),
      overlay[1] * overlay[3] + surface[1] * (1 - overlay[3]),
      overlay[2] * overlay[3] + surface[2] * (1 - overlay[3]),
    ]
    const luminanceWeights: RGB = [0.2126, 0.7152, 0.0722]
    const luminance = ([red, green, blue]: RGB) => {
      const linearRed =
        red / 255 <= 0.04045 ? red / 255 / 12.92 : ((red / 255 + 0.055) / 1.055) ** 2.4
      const linearGreen =
        green / 255 <= 0.04045 ? green / 255 / 12.92 : ((green / 255 + 0.055) / 1.055) ** 2.4
      const linearBlue =
        blue / 255 <= 0.04045 ? blue / 255 / 12.92 : ((blue / 255 + 0.055) / 1.055) ** 2.4
      return (
        luminanceWeights[0] * linearRed +
        luminanceWeights[1] * linearGreen +
        luminanceWeights[2] * linearBlue
      )
    }
    const foregroundLuminance = luminance([foreground[0], foreground[1], foreground[2]])
    const backgroundLuminance = luminance(background)
    return (
      (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
      (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
    )
  })
}

async function expectTwoRowReleaseTicketCard(card: Locator, title: string) {
  const header = card.locator('[data-release-ticket-header]')
  const context = card.locator('[data-release-ticket-context]')
  const hierarchy = context.getByLabel('Ticket hierarchy')
  await expectNoHorizontalOverflow(hierarchy)
  await expectNoHorizontalOverflow(context)
  const usage = header.getByLabel('Ticket usage')
  const status = context.getByRole('combobox', { name: `Ticket status for ${title}` })
  const related = context.getByRole('button', { name: 'Related tickets' })
  const external = context.getByRole('button', { name: 'External links' })
  await expect(header.getByRole('heading', { name: title })).toBeVisible()
  await expect(usage).toBeVisible()
  await expect(context.getByLabel('Ticket usage')).toHaveCount(0)
  await expect(usage.getByLabel(/Estimate usage:/)).toHaveCount(0)
  await expect(context.getByRole('link')).toHaveCount(3)
  await expect(status).toContainText('Idea')
  await expect(status.locator('[data-ticket-status-icon="Idea"]')).toBeVisible()
  await expect(status.locator('[aria-hidden="true"]').first()).toBeVisible()
  await expect(status).toHaveClass(/bg-default/)
  await expect(status).toHaveClass(/text-muted/)
  await expect(hierarchy.getByRole('link').first()).toHaveClass(/text-muted/)
  await expect(status).not.toHaveClass(/\bring\b/)
  await expect(hierarchy.getByRole('link').first()).toHaveClass(/bg-default/)
  const [
    cardBox,
    headerBox,
    titleBox,
    contextBox,
    hierarchyBox,
    hierarchyLinkBox,
    usageBox,
    statusBox,
    relatedBox,
    externalBox,
  ] = await Promise.all([
    card.boundingBox(),
    header.boundingBox(),
    header.getByRole('heading', { name: title }).boundingBox(),
    context.boundingBox(),
    hierarchy.boundingBox(),
    hierarchy.getByRole('link').first().boundingBox(),
    usage.boundingBox(),
    status.boundingBox(),
    related.boundingBox(),
    external.boundingBox(),
  ])
  if (
    !cardBox ||
    !headerBox ||
    !titleBox ||
    !usageBox ||
    !contextBox ||
    !hierarchyBox ||
    !hierarchyLinkBox ||
    !statusBox ||
    !relatedBox ||
    !externalBox
  )
    throw new Error('Release ticket card rows must be present')
  expect(
    Math.abs(titleBox.y + titleBox.height / 2 - (usageBox.y + usageBox.height / 2)),
  ).toBeLessThan(5)
  expect(contextBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height)
  expect(Math.abs(contextBox.x - headerBox.x)).toBeLessThan(2)
  expect(hierarchyBox.height).toBeLessThanOrEqual(70)
  expect(contextBox.height).toBeLessThanOrEqual(100)
  expect(Math.abs(statusBox.height - hierarchyLinkBox.height)).toBeLessThan(2)
  expect(usageBox.x - (titleBox.x + titleBox.width)).toBeGreaterThanOrEqual(0)
  expect(usageBox.x - (titleBox.x + titleBox.width)).toBeLessThanOrEqual(12)
  expect(
    statusBox.x >= hierarchyBox.x + hierarchyBox.width - 1 ||
      statusBox.y >= hierarchyBox.y + hierarchyBox.height - 1,
  ).toBe(true)
  expect(
    relatedBox.x >= statusBox.x + statusBox.width - 1 ||
      relatedBox.y >= statusBox.y + statusBox.height - 1,
  ).toBe(true)
  expect(
    externalBox.x >= relatedBox.x + relatedBox.width - 1 ||
      externalBox.y >= relatedBox.y + relatedBox.height - 1,
  ).toBe(true)
  expect(cardBox.height).toBeLessThan(180)
}

async function expectTwoRowBoardTicketCard(card: Locator, title: string) {
  const header = card.getByLabel('Ticket main information')
  const context = card.getByLabel('Ticket context')
  const titleLink = header.getByRole('link', { name: title })
  const statusTrigger = header.getByRole('button', {
    name: `Change status for ${title} from Idea`,
  })
  const usage = header.getByLabel('Ticket usage')
  const hierarchy = context.getByLabel('Ticket hierarchy')
  await expectNoHorizontalOverflow(context)
  await expect
    .poll(() => hierarchy.evaluate((element) => element.scrollWidth > element.clientWidth))
    .toBe(true)
  const hierarchyBadge = hierarchy.getByRole('button').first()
  const related = context.getByRole('button', { name: 'Related tickets' })
  await expect(usage).toBeVisible()
  await expect(usage.getByLabel(/Estimate usage:/)).toHaveCount(0)
  await expect(statusTrigger).toBeVisible()
  await expect(statusTrigger.locator('[data-ticket-status-icon="Idea"]')).toBeVisible()
  await expect(titleLink.locator('[data-ticket-status-icon]')).toHaveCount(0)
  await expect(hierarchyBadge).toHaveClass(/bg-secondary\/10/)
  await expect(hierarchyBadge.locator('span').last()).toHaveClass(/text-secondary-700/)
  await expect(hierarchyBadge.locator('span').last()).toHaveClass(/dark:text-secondary-300/)
  await expect(related).toHaveClass(/text-muted/)
  await expect(related).toHaveClass(/bg-default/)
  const [headerBox, titleBox, usageBox, contextBox, hierarchyBox, hierarchyBadgeBox, relatedBox] =
    await Promise.all([
      header.boundingBox(),
      titleLink.boundingBox(),
      usage.boundingBox(),
      context.boundingBox(),
      hierarchy.boundingBox(),
      hierarchyBadge.boundingBox(),
      related.boundingBox(),
    ])
  if (
    !headerBox ||
    !titleBox ||
    !usageBox ||
    !contextBox ||
    !hierarchyBox ||
    !hierarchyBadgeBox ||
    !relatedBox
  )
    throw new Error('Board ticket card rows must be visible')
  const statusBox = await statusTrigger.boundingBox()
  if (!statusBox) throw new Error('Board ticket status icon must be visible beside its title')
  expect(statusBox.x + statusBox.width).toBeLessThanOrEqual(titleBox.x + 1)
  expect(usageBox.x - (titleBox.x + titleBox.width)).toBeGreaterThanOrEqual(0)
  expect(usageBox.x - (titleBox.x + titleBox.width)).toBeLessThanOrEqual(12)
  expect(contextBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height)
  expect(hierarchyBadgeBox.height).toBe(20)
  expect(relatedBox.height).toBe(20)
  expect(hierarchyBadge).toHaveCSS('font-size', '10px')
  expect(contextBox.height).toBeLessThanOrEqual(100)
  expect(
    relatedBox.x >= hierarchyBox.x + hierarchyBox.width - 1 ||
      relatedBox.y >= hierarchyBox.y + hierarchyBox.height - 1,
  ).toBe(true)
}

async function cleanup(userId: string) {
  const clients = await db.select({ id: client.id }).from(client).where(eq(client.userId, userId))
  const clientIds = clients.map((row) => row.id)
  const projects = clientIds.length
    ? await db.select({ id: project.id }).from(project).where(inArray(project.clientId, clientIds))
    : []
  const projectIds = projects.map((row) => row.id)
  const releases = projectIds.length
    ? await db
        .select({ id: release.id })
        .from(release)
        .where(inArray(release.projectId, projectIds))
    : []
  const releaseIds = releases.map((row) => row.id)
  const tickets = releaseIds.length
    ? await db.select({ id: ticket.id }).from(ticket).where(inArray(ticket.releaseId, releaseIds))
    : []
  const ticketIds = tickets.map((row) => row.id)
  if (ticketIds.length) {
    await db.delete(timeEntry).where(inArray(timeEntry.ticketId, ticketIds))
    await db.delete(ticketLink).where(inArray(ticketLink.ticketId, ticketIds))
    await db
      .delete(ticketRelation)
      .where(
        or(
          inArray(ticketRelation.fromTicketId, ticketIds),
          inArray(ticketRelation.toTicketId, ticketIds),
        ),
      )
    await db.delete(ticket).where(inArray(ticket.id, ticketIds))
  }
  if (releaseIds.length) await db.delete(release).where(inArray(release.id, releaseIds))
  if (projectIds.length) await db.delete(project).where(inArray(project.id, projectIds))
  if (clientIds.length) await db.delete(client).where(inArray(client.id, clientIds))
}

type ContextFixture = {
  ownerId: string
  suffix: string
  clientRecord: { id: string; name: string }
  projectRecord: { id: string; name: string }
  releaseRecord: { id: string; name: string }
  one: { id: string }
  two: { id: string }
  many: { id: string }
  manyTitle: string
  date: string
  shortManyEntry: { id: string }
  tallEntry: { id: string }
}

const test = base.extend<{ popovers: ContextFixture }>({
  popovers: async ({ page, context }, use) => {
    const helpers = (await testAuth.$context).test
    const owner = helpers.createUser({
      name: 'Context popover owner',
      email: `ticket-context-${crypto.randomUUID()}@example.com`,
    })
    try {
      await helpers.saveUser(owner)
      await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
      const create = async (path: string, data: unknown) => {
        const response = await page.request.post(path, { data })
        expect(response.ok(), await response.text()).toBeTruthy()
        return response.json()
      }
      const suffix = crypto.randomUUID().slice(0, 8)
      const clientRecord = await create('/api/clients', { name: `Context ${suffix}` })
      const projectRecord = await create('/api/projects', {
        clientId: clientRecord.id,
        name: `Context project ${suffix}`,
        color: '#abcdef',
      })
      const releaseRecord = await create('/api/releases', {
        projectId: projectRecord.id,
        name: `Context release ${suffix}`,
      })
      const oneTitle = `Context one ${suffix}`
      const twoTitle = `Context two ${suffix}`
      const manyTitle = `Context many ${suffix}`
      const one = await create('/api/tickets', {
        releaseId: releaseRecord.id,
        title: oneTitle,
        links: [{ label: 'Single external', url: 'https://example.com/single' }],
      })
      const two = await create('/api/tickets', {
        releaseId: releaseRecord.id,
        title: twoTitle,
        links: [{ label: 'Pull request', url: 'https://example.com/pr' }],
      })
      const many = await create('/api/tickets', {
        releaseId: releaseRecord.id,
        title: manyTitle,
        estimateMinutes: 15,
        links: [
          { label: 'Design', url: 'https://example.com/design' },
          { label: 'Pull request', url: 'https://example.com/pr-many' },
          { url: 'https://jira.atlassian.com/browse/NXMR-POPOVER' },
        ],
        relatedTicketIds: [one.id, two.id],
      })
      const date = await page.evaluate(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      })
      const shortManyEntry = await create('/api/time-entries', {
        ticketId: many.id,
        date,
        startMinute: 540,
        durationMinutes: 30,
        description: 'Popover test work',
      })
      await create('/api/time-entries', {
        ticketId: one.id,
        date,
        startMinute: 600,
        durationMinutes: 30,
        description: 'Popover test work',
      })
      const tallEntry = await create('/api/time-entries', {
        ticketId: many.id,
        date,
        startMinute: 720,
        durationMinutes: 90,
        description: 'Taller popover test work',
      })
      await use({
        ownerId: owner.id,
        suffix,
        clientRecord,
        projectRecord,
        releaseRecord,
        one,
        two,
        many,
        manyTitle,
        date,
        shortManyEntry,
        tallEntry,
      })
    } finally {
      await cleanup(owner.id)
      await helpers.deleteUser(owner.id)
    }
  },
})

test('ticket board and release cards expose relation and external-link popovers', async ({
  page,
  popovers,
}) => {
  const {
    suffix,
    clientRecord,
    projectRecord,
    releaseRecord,
    one,
    two,
    many,
    manyTitle,
    date,
    shortManyEntry,
  } = popovers

  const tickets = (await (await page.request.get('/api/tickets')).json()).tickets
  const manyFromApi = tickets.find((item: { ticket: { id: string } }) => item.ticket.id === many.id)
  expect(manyFromApi.relatedTickets.map((item: { id: string }) => item.id).toSorted()).toEqual(
    [one.id, two.id].toSorted(),
  )
  expect(manyFromApi.externalLinks).toHaveLength(3)
  expect(
    manyFromApi.externalLinks.find(
      (link: { url: string; label: string | null }) =>
        link.url === 'https://jira.atlassian.com/browse/NXMR-POPOVER',
    )?.label,
  ).toBeNull()
  const agenda = await (await page.request.get('/api/agenda', { params: { date } })).json()
  const manyFromAgenda = agenda.entries.find(
    (item: { ticketId: string }) => item.ticketId === many.id,
  )
  expect(manyFromAgenda.relatedTickets).toHaveLength(2)
  expect(manyFromAgenda.externalLinks).toHaveLength(3)
  expect(
    manyFromAgenda.externalLinks.find(
      (link: { url: string; label: string | null }) =>
        link.url === 'https://jira.atlassian.com/browse/NXMR-POPOVER',
    )?.label,
  ).toBeNull()

  await page.goto('/tickets')
  await waitForClientMount(page)
  const boardCard = page.locator(`[data-board-ticket-id="${many.id}"]`).filter({ visible: true })
  await expectTwoRowBoardTicketCard(boardCard, manyTitle)
  const boardHierarchy = boardCard.getByLabel('Ticket hierarchy')
  const boardHierarchyBadge = boardHierarchy.getByRole('button').first()
  await page.mouse.move(0, 0)
  const boardSurfaceMetrics = await boardCard.evaluate((element) => {
    const style = getComputedStyle(element)
    const content = element.querySelector('[data-entity-card-context]')?.parentElement
    const contentStyle = content ? getComputedStyle(content) : null
    return {
      padding: style.padding,
      backgroundColor: style.backgroundColor,
      borderColor: style.borderTopColor,
      borderRadius: style.borderRadius,
      fontSize: style.fontSize,
      contentDisplay: contentStyle?.display,
      contentGap: contentStyle?.rowGap,
    }
  })
  await boardCard.hover({ position: { x: 8, y: 8 } })
  await expect
    .poll(() => boardCard.evaluate((element) => getComputedStyle(element).borderTopColor))
    .not.toBe(boardSurfaceMetrics.borderColor)
  const boardHoverBorderColor = await settledBorderTopColor(boardCard)
  const boardBadgeMetrics = await boardHierarchyBadge.evaluate((element) => {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    const icon = element.querySelector('.iconify')?.getBoundingClientRect()
    const label = element.querySelector('span:last-child')
    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
      fontSize: style.fontSize,
      padding: style.padding,
      borderRadius: style.borderRadius,
      height: rect.height,
      iconWidth: icon?.width,
      iconHeight: icon?.height,
      labelColor: label ? getComputedStyle(label).color : null,
    }
  })
  const boardTitleFontSize = await boardCard
    .getByRole('link', { name: manyTitle })
    .evaluate((element) => getComputedStyle(element).fontSize)
  const boardHierarchyOverflow = await boardHierarchy.evaluate((element) => ({
    overflowX: getComputedStyle(element).overflowX,
    scrollable: element.scrollWidth > element.clientWidth,
  }))
  const boardRelations = boardCard.getByRole('button', { name: 'Related tickets' })
  const boardLinks = boardCard.getByRole('button', { name: 'External links' })
  await expectPlainIconTrigger(boardRelations)
  await expectPlainIconTrigger(boardLinks)
  await expect(boardCard.getByLabel('Tracked: 2hr of 15m').locator('span.text-error')).toHaveText(
    '2hr',
  )
  await boardRelations.hover()
  await expect(page.locator(`[data-related-ticket-id="${one.id}"]`)).toBeVisible()
  await page.keyboard.press('Escape')
  await boardLinks.hover()
  const boardExternalLink = page.getByRole('link', { name: 'Design', exact: true })
  await expect(boardExternalLink).toBeVisible()
  await expect(boardExternalLink).toHaveAttribute('target', '_blank')
  await expect(boardExternalLink).toHaveAttribute('href', 'https://example.com/design')
  const boardFallback = page.getByRole('link', { name: 'jira.atlassian.com', exact: true })
  await expect(boardFallback).toBeVisible()
  await expect(boardFallback).toHaveAttribute(
    'href',
    'https://jira.atlassian.com/browse/NXMR-POPOVER',
  )
  await page.keyboard.press('Escape')
  const singleBoardCard = page
    .locator(`[data-board-ticket-id="${one.id}"]`)
    .filter({ visible: true })
  const unestimatedBoardUsage = singleBoardCard.getByLabel('Tracked: 30m')
  await expect(unestimatedBoardUsage.locator('span.text-muted')).toHaveText('30m')
  await expect(unestimatedBoardUsage.locator('span.text-primary')).toHaveCount(0)
  await expectPlainIconTrigger(singleBoardCard.getByRole('button', { name: 'Related tickets' }))
  await expectPlainIconTrigger(singleBoardCard.getByRole('button', { name: 'External links' }))
  await singleBoardCard.getByRole('button', { name: 'External links' }).hover()
  await expect(page.getByRole('link', { name: 'Single external' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.goto(`/releases/${releaseRecord.id}`)
  await waitForClientMount(page)
  const releaseCard = page.locator(`[data-release-ticket-id="${many.id}"]`)
  await expectTwoRowReleaseTicketCard(releaseCard, manyTitle)
  await expect(
    releaseCard
      .getByRole('heading', { name: manyTitle })
      .locator('[data-ticket-status-icon="Idea"]'),
  ).toBeVisible()
  const releaseRelations = releaseCard.getByRole('button', { name: 'Related tickets' })
  const releaseLinks = releaseCard.getByRole('button', { name: 'External links' })
  await expectPlainIconTrigger(releaseRelations)
  await expectPlainIconTrigger(releaseLinks)
  await expect(releaseCard.getByLabel('Tracked: 2hr of 15m').locator('span.text-error')).toHaveText(
    '2hr',
  )
  await releaseRelations.focus()
  await expect(page.locator(`[data-related-ticket-id="${two.id}"]`)).toBeVisible()
  await page.keyboard.press('Escape')
  await releaseLinks.hover()
  const releaseExternalLink = page.getByRole('link', { name: 'Pull request', exact: true })
  await expect(releaseExternalLink).toBeVisible()
  await expect(releaseExternalLink).toHaveAttribute('target', '_blank')
  const releaseFallback = page.getByRole('link', { name: 'jira.atlassian.com', exact: true })
  await expect(releaseFallback).toBeVisible()
  await expect(releaseFallback).toHaveAttribute(
    'href',
    'https://jira.atlassian.com/browse/NXMR-POPOVER',
  )
  const singleReleaseCard = page.locator(`[data-release-ticket-id="${one.id}"]`)
  await expectPlainIconTrigger(singleReleaseCard.getByRole('button', { name: 'Related tickets' }))
  await expectPlainIconTrigger(singleReleaseCard.getByRole('button', { name: 'External links' }))
  for (const [name, path] of [
    [`Context ${suffix}`, `/clients/${clientRecord.id}`],
    [`Context project ${suffix}`, `/projects/${projectRecord.id}`],
    [`Context release ${suffix}`, `/releases/${releaseRecord.id}`],
  ]) {
    const hierarchyLink = releaseCard.getByRole('link', { name, exact: true })
    await expect(hierarchyLink).toHaveAttribute('href', path)
    await hierarchyLink.click()
    await expect(page).toHaveURL(path)
    await page.goto(`/releases/${releaseRecord.id}`)
    await waitForClientMount(page)
  }

  await page.goto(`/agenda?date=${date}`)
  await waitForClientMount(page)
  const agendaCard = page.locator(`[data-agenda-ticket-id="${many.id}"]`).filter({ visible: true })
  await expect(agendaCard.first().locator('[data-ticket-status-icon="Idea"]').first()).toBeVisible()
  const matchingAgendaEntry = page
    .locator(`[data-agenda-entry="${shortManyEntry.id}"]`)
    .getByRole('article')
  const agendaHierarchy = matchingAgendaEntry.getByLabel('Entry hierarchy and ticket links')
  const agendaHierarchyBadge = agendaHierarchy.getByRole('button', {
    name: `client: ${clientRecord.name}; actions`,
  })
  const agendaSurfaceMetrics = await matchingAgendaEntry.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      padding: style.padding,
      backgroundColor: style.backgroundColor,
      borderColor: style.borderTopColor,
      borderRadius: style.borderRadius,
      fontSize: style.fontSize,
      contentDisplay: style.display,
      contentGap: style.rowGap,
    }
  })
  const agendaBadgeMetrics = await agendaHierarchyBadge.evaluate((element) => {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    const icon = element.querySelector('.iconify')?.getBoundingClientRect()
    const label = element.querySelector('span:last-child')
    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
      fontSize: style.fontSize,
      padding: style.padding,
      borderRadius: style.borderRadius,
      height: rect.height,
      iconWidth: icon?.width,
      iconHeight: icon?.height,
      labelColor: label ? getComputedStyle(label).color : null,
    }
  })
  const agendaTitleFontSize = await matchingAgendaEntry
    .getByRole('link', { name: manyTitle })
    .evaluate((element) => getComputedStyle(element).fontSize)
  const agendaHierarchyOverflow = await agendaHierarchy.evaluate((element) => ({
    overflowX: getComputedStyle(element).overflowX,
    scrollable: element.scrollWidth > element.clientWidth,
  }))
  await page.mouse.move(0, 0)
  await matchingAgendaEntry.hover({ position: { x: 8, y: 8 } })
  const agendaHoverBorderColor = await settledBorderTopColor(matchingAgendaEntry)
  expect(agendaHoverBorderColor).toBe(boardHoverBorderColor)
  expect(agendaHoverBorderColor).not.toBe(agendaSurfaceMetrics.borderColor)
  expect(boardSurfaceMetrics).toEqual(agendaSurfaceMetrics)
  expect(boardBadgeMetrics).toEqual(agendaBadgeMetrics)
  expect(boardHierarchyOverflow).toEqual(agendaHierarchyOverflow)
  expect(boardHierarchyOverflow.scrollable).toBe(true)
  expect(boardTitleFontSize).toBe(agendaTitleFontSize)

  await page.goto(`/tickets/${many.id}`)
  await waitForClientMount(page)
  const ticketBreadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' })
  await expect(ticketBreadcrumb.locator('[data-ticket-status-icon="Idea"]')).toBeVisible()
  await expect(
    page
      .getByRole('combobox', { name: `Ticket status for ${manyTitle}` })
      .locator('[data-ticket-status-icon="Idea"]'),
  ).toBeVisible()
  await expect(
    page
      .getByRole('link', { name: `Context one ${suffix}` })
      .locator('[data-ticket-status-icon="Idea"]'),
  ).toBeVisible()

  const workspaceSearch = page.getByRole('searchbox', { name: 'Search workspace' })
  await workspaceSearch.fill(manyTitle)
  const ticketSearchHit = page.getByRole('option', { name: new RegExp(manyTitle) })
  await expect(ticketSearchHit.locator('[data-ticket-status-icon="Idea"]')).toBeVisible()
})

test('Agenda entry context controls retain compact layout and weekly behavior', async ({
  page,
  popovers,
}) => {
  const { suffix, one, manyTitle, shortManyEntry, tallEntry } = popovers
  await page.setViewportSize({ width: 1280, height: 1900 })
  await page.goto('/agenda')
  await waitForClientMount(page)
  const compactAgendaCard = page
    .locator(`[data-agenda-entry="${shortManyEntry.id}"]`)
    .getByRole('article')
  const compactFilter = compactAgendaCard.getByRole('button', {
    name: `Filter by ${manyTitle}`,
  })
  const compactBadgeGroup = compactAgendaCard.getByLabel('Entry hierarchy and ticket links')
  const compactClient = compactBadgeGroup.getByRole('button', {
    name: `client: Context ${suffix}; actions`,
  })
  const compactProject = compactBadgeGroup.getByRole('button', {
    name: `project: Context project ${suffix}; actions`,
  })
  const compactRelease = compactBadgeGroup.getByRole('button', {
    name: `release: Context release ${suffix}; actions`,
  })
  const compactStatus = compactAgendaCard.getByRole('button', {
    name: `Change status for ${manyTitle} from Idea`,
  })
  const compactRelated = compactBadgeGroup.getByRole('button', { name: 'Related tickets' })
  const compactExternal = compactBadgeGroup.getByRole('button', { name: 'External links' })
  const compactControls = [
    compactClient,
    compactProject,
    compactRelease,
    compactRelated,
    compactExternal,
  ]
  const [filterHeight, compactControlMetrics, statusMetrics] = await Promise.all([
    compactFilter.evaluate((element) => element.getBoundingClientRect().height),
    Promise.all(
      compactControls.map((control) =>
        control.evaluate((element) => {
          const { x, width, height } = element.getBoundingClientRect()
          const style = getComputedStyle(element)
          const label = element.querySelector('span:not([aria-hidden="true"])')
          const icon = element.querySelector('[aria-hidden="true"]')?.getBoundingClientRect()
          return {
            x,
            width,
            height,
            iconWidth: icon?.width ?? 0,
            iconHeight: icon?.height ?? 0,
            backgroundColor: style.backgroundColor,
            color: label ? getComputedStyle(label).color : style.color,
            borderRadius: style.borderRadius,
            fontSize: style.fontSize,
          }
        }),
      ),
    ),
    compactStatus.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      const icon = element.querySelector('[data-ticket-status-icon]')?.getBoundingClientRect()
      return { x: rect.x, width: rect.width, height: rect.height, iconWidth: icon?.width ?? 0 }
    }),
  ])
  await expect(compactFilter).toBeVisible()
  await expect(compactStatus).toBeVisible()
  await expect(compactStatus.locator('[data-ticket-status-icon="Idea"]')).toBeVisible()
  await expect(compactBadgeGroup.getByRole('button', { name: /Change status/ })).toHaveCount(0)
  await expect(compactRelated).toBeVisible()
  await expect(compactExternal).toBeVisible()
  await expect(compactBadgeGroup.getByRole('button', { name: 'Related tickets' })).toHaveCount(1)
  await expect(compactBadgeGroup.getByRole('button', { name: 'External links' })).toHaveCount(1)
  const compactBadgeNames = await compactBadgeGroup
    .getByRole('button')
    .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')))
  expect(compactBadgeNames).toHaveLength(5)
  expect(compactBadgeNames).toEqual([
    `client: Context ${suffix}; actions`,
    `project: Context project ${suffix}; actions`,
    `release: Context release ${suffix}; actions`,
    'Related tickets',
    'External links',
  ])
  expect(filterHeight).toBe(20)
  expect(statusMetrics.height).toBe(20)
  expect(statusMetrics.width).toBe(20)
  expect(statusMetrics.iconWidth).toBe(16)
  const statusTitleBox = await compactAgendaCard
    .getByRole('link', { name: manyTitle })
    .boundingBox()
  if (!statusTitleBox)
    throw new Error('Agenda ticket title must be visible next to its status icon')
  expect(statusMetrics.x + statusMetrics.width).toBeLessThanOrEqual(statusTitleBox.x + 1)
  expect(compactControlMetrics.map((control) => control.height)).toEqual([20, 20, 20, 20, 20])
  expect(compactControlMetrics.map((control) => control.iconWidth)).toEqual([12, 12, 12, 12, 12])
  expect(compactControlMetrics.map((control) => control.iconHeight)).toEqual([12, 12, 12, 12, 12])
  const compactControlGaps = compactControlMetrics.slice(1).map((control, index) => {
    const previous = compactControlMetrics[index]!
    return control.x - (previous.x + previous.width)
  })
  for (const gap of compactControlGaps) expect(gap).toBeCloseTo(4, 2)
  expect(compactControlMetrics.map((control) => control.borderRadius)).toEqual(
    Array.from({ length: compactControls.length }, () => compactControlMetrics[0]!.borderRadius),
  )
  expect(compactControlMetrics.slice(0, 3).map((control) => control.backgroundColor)).toEqual([
    compactControlMetrics[0]!.backgroundColor,
    compactControlMetrics[0]!.backgroundColor,
    compactControlMetrics[0]!.backgroundColor,
  ])
  expect(compactControlMetrics[0]!.backgroundColor).not.toBe(
    compactControlMetrics[3]!.backgroundColor,
  )
  expect(compactControlMetrics.slice(0, 3).map((control) => control.color)).toEqual([
    compactControlMetrics[0]!.color,
    compactControlMetrics[0]!.color,
    compactControlMetrics[0]!.color,
  ])
  expect(compactControlMetrics[0]!.color).not.toBe(compactControlMetrics[3]!.color)
  for (const control of compactControls.slice(0, 3)) {
    await expect(control).toHaveClass(/bg-secondary\/10/)
    await expect(control.locator('span').last()).toHaveClass(/text-secondary-700/)
    await expect(control.locator('span').last()).toHaveClass(/dark:text-secondary-300/)
  }
  const root = page.locator('html')
  await root.evaluate((element) => element.classList.remove('dark'))
  const lightContrast = await measureCompactBadgeContrast(compactClient.locator('span').last())
  await root.evaluate((element) => element.classList.add('dark'))
  await expect
    .poll(() => measureCompactBadgeContrast(compactClient.locator('span').last()))
    .toBeGreaterThanOrEqual(4.5)
  const darkContrast = await measureCompactBadgeContrast(compactClient.locator('span').last())
  await root.evaluate((element) => element.classList.remove('dark'))
  expect(lightContrast).toBeGreaterThanOrEqual(4.5)
  expect(darkContrast).toBeGreaterThanOrEqual(4.5)
  expect(compactControlMetrics.slice(3).map((control) => control.backgroundColor)).toEqual([
    compactControlMetrics[3]!.backgroundColor,
    compactControlMetrics[3]!.backgroundColor,
  ])
  expect(compactControlMetrics.slice(0, 3).map((control) => control.fontSize)).toEqual([
    '10px',
    '10px',
    '10px',
  ])
  await expectCenteredIcon(compactFilter, compactFilter.locator('[data-slot="leadingIcon"]'))
  await expectCenteredIcon(compactRelated, compactRelated.locator('[aria-hidden="true"]').first())
  await expectCenteredIcon(compactExternal, compactExternal.locator('[aria-hidden="true"]').first())

  await page.setViewportSize({ width: 1280, height: 1900 })
  await expect(page.getByRole('region', { name: 'Week timeline' })).toBeVisible()
  const weeklyContextMetrics = await compactBadgeGroup.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }))
  expect(weeklyContextMetrics.scrollWidth).toBeGreaterThan(weeklyContextMetrics.clientWidth)
  await compactBadgeGroup.evaluate((element) => {
    element.scrollLeft = element.scrollWidth
  })
  const [weeklyContextBox, weeklyRelatedBox, weeklyExternalBox] = await Promise.all([
    compactBadgeGroup.boundingBox(),
    compactRelated.boundingBox(),
    compactExternal.boundingBox(),
  ])
  if (!weeklyContextBox || !weeklyRelatedBox || !weeklyExternalBox)
    throw new Error('Week context controls must be visible after horizontal scrolling')
  for (const box of [weeklyRelatedBox, weeklyExternalBox]) {
    expect(box.x).toBeGreaterThanOrEqual(weeklyContextBox.x - 1)
    expect(box.x + box.width).toBeLessThanOrEqual(weeklyContextBox.x + weeklyContextBox.width + 1)
  }
  await compactRelated.focus()
  await expect(page.locator(`[data-related-ticket-id="${one.id}"]`)).toBeVisible()
  await page.keyboard.press('Escape')
  await compactExternal.focus()
  await expect(page.getByRole('link', { name: 'Design', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')

  const tallAgendaCard = page.locator(`[data-agenda-entry="${tallEntry.id}"]`).getByRole('article')
  const tallBadgeGroup = tallAgendaCard.getByLabel('Entry hierarchy and ticket links')
  expect(await tallBadgeGroup.evaluate((element) => getComputedStyle(element).flexWrap)).toBe(
    'wrap',
  )
  const tallContextNames = await tallBadgeGroup
    .getByRole('button')
    .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')))
  expect(tallContextNames).toHaveLength(5)
  expect(tallContextNames.slice(3)).toEqual(['Related tickets', 'External links'])
  const [tallCardBox, tallGroupBox] = await Promise.all([
    tallAgendaCard.boundingBox(),
    tallBadgeGroup.boundingBox(),
  ])
  if (!tallCardBox || !tallGroupBox) throw new Error('Tall agenda context must be visible')
  expect(tallGroupBox.y + tallGroupBox.height).toBeLessThanOrEqual(
    tallCardBox.y + tallCardBox.height + 1,
  )
})

test('marking a release done warns, reports write failures, and returns to its project', async ({
  page,
  popovers,
}) => {
  const { many, one, two, projectRecord, releaseRecord } = popovers
  await page.goto(`/releases/${releaseRecord.id}`)
  await waitForClientMount(page)
  await page.getByRole('button', { name: 'Mark release as done' }).click()
  const completionWarning = page.getByRole('dialog', { name: 'Mark release as done?' })
  await expect(completionWarning.getByText('Not all tickets are done')).toBeVisible()
  await expect(completionWarning.getByText(/0 of 3 tickets are done/)).toBeVisible()
  await completionWarning.getByRole('button', { name: 'Cancel' }).click()
  await expect(completionWarning).toHaveCount(0)
  await expect(page).toHaveURL(`/releases/${releaseRecord.id}`)
  await page.route(`**/api/releases/${releaseRecord.id}`, async (request) => {
    if (request.request().method() === 'PATCH') {
      await request.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ statusCode: 500, statusMessage: 'Test failure' }),
      })
    } else {
      await request.continue()
    }
  })
  await page.getByRole('button', { name: 'Mark release as done' }).click()
  const failedCompletion = page.getByRole('dialog', { name: 'Mark release as done?' })
  await failedCompletion.getByRole('button', { name: 'Mark release as done' }).click()
  await expect(failedCompletion.getByText('Could not mark release as done')).toBeVisible()
  await page.unroute(`**/api/releases/${releaseRecord.id}`)
  await failedCompletion.getByRole('button', { name: 'Cancel' }).click()
  for (const ticketId of [one.id, two.id, many.id]) {
    const response = await page.request.patch(`/api/tickets/${ticketId}`, {
      data: { status: 'Done' },
    })
    expect(response.ok()).toBe(true)
  }
  await page.reload()
  await waitForClientMount(page)
  await page.getByRole('button', { name: 'Mark release as done' }).click()
  await expect(page).toHaveURL(`/projects/${projectRecord.id}`)
})
