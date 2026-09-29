import { expect, test, type Locator } from '@playwright/test'
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
  const usage = header.getByLabel('Ticket usage')
  const hierarchy = context.getByLabel('Ticket hierarchy')
  await expectNoHorizontalOverflow(hierarchy)
  await expectNoHorizontalOverflow(context)
  const hierarchyBadge = hierarchy.getByRole('button').first()
  const related = context.getByRole('button', { name: 'Related tickets' })
  await expect(usage).toBeVisible()
  await expect(usage.getByLabel(/Estimate usage:/)).toHaveCount(0)
  await expect(hierarchyBadge).toHaveClass(/text-muted/)
  await expect(hierarchyBadge).toHaveClass(/bg-default/)
  await expect(related).toHaveClass(/text-muted/)
  await expect(related).toHaveClass(/bg-default/)
  const [headerBox, titleBox, usageBox, contextBox, hierarchyBox, relatedBox] = await Promise.all([
    header.boundingBox(),
    titleLink.boundingBox(),
    usage.boundingBox(),
    context.boundingBox(),
    hierarchy.boundingBox(),
    related.boundingBox(),
  ])
  if (!headerBox || !titleBox || !usageBox || !contextBox || !hierarchyBox || !relatedBox)
    throw new Error('Board ticket card rows must be visible')
  expect(usageBox.x - (titleBox.x + titleBox.width)).toBeGreaterThanOrEqual(0)
  expect(usageBox.x - (titleBox.x + titleBox.width)).toBeLessThanOrEqual(12)
  expect(contextBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height)
  expect(contextBox.height).toBeLessThanOrEqual(144)
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

test('ticket context popovers show one or many relations and native external links across views', async ({
  page,
  context,
  browser,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Context popover owner',
    email: `ticket-context-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  let mobileContext: Awaited<ReturnType<typeof browser.newContext>> | undefined
  try {
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
    for (const [ticketId, startMinute] of [
      [many.id, 540],
      [one.id, 600],
    ] as const) {
      await create('/api/time-entries', {
        ticketId,
        date,
        startMinute,
        durationMinutes: 30,
        description: 'Popover test work',
      })
    }

    const tickets = (await (await page.request.get('/api/tickets')).json()).tickets
    const manyFromApi = tickets.find(
      (item: { ticket: { id: string } }) => item.ticket.id === many.id,
    )
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
    await page.waitForLoadState('networkidle')
    const boardCard = page.locator(`[data-board-ticket-id="${many.id}"]`).filter({ visible: true })
    await expectTwoRowBoardTicketCard(boardCard, manyTitle)
    const boardRelations = boardCard.getByRole('button', { name: 'Related tickets' })
    const boardLinks = boardCard.getByRole('button', { name: 'External links' })
    await expectPlainIconTrigger(boardRelations)
    await expectPlainIconTrigger(boardLinks)
    await expect(boardCard.getByLabel('Tracked: 30m of 15m').locator('span.text-error')).toHaveText(
      '30m',
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
    await expectPlainIconTrigger(singleBoardCard.getByRole('button', { name: 'Related tickets' }))
    await expectPlainIconTrigger(singleBoardCard.getByRole('button', { name: 'External links' }))
    await singleBoardCard.getByRole('button', { name: 'External links' }).hover()
    await expect(page.getByRole('link', { name: 'Single external' })).toBeVisible()
    await page.keyboard.press('Escape')

    await page.goto(`/releases/${releaseRecord.id}`)
    await page.waitForLoadState('networkidle')
    const releaseCard = page.locator(`[data-release-ticket-id="${many.id}"]`)
    await expectTwoRowReleaseTicketCard(releaseCard, manyTitle)
    const releaseRelations = releaseCard.getByRole('button', { name: 'Related tickets' })
    const releaseLinks = releaseCard.getByRole('button', { name: 'External links' })
    await expectPlainIconTrigger(releaseRelations)
    await expectPlainIconTrigger(releaseLinks)
    await expect(
      releaseCard.getByLabel('Tracked: 30m of 15m').locator('span.text-error'),
    ).toHaveText('30m')
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
      await page.waitForLoadState('networkidle')
    }

    await page.goto('/today')
    await page.waitForLoadState('networkidle')
    const compactAgendaCard = page
      .locator(`[data-agenda-ticket-id="${many.id}"]`)
      .filter({ visible: true })
    const compactFilter = compactAgendaCard.getByRole('button', {
      name: `Filter by ${manyTitle}`,
    })
    const compactStatus = compactAgendaCard.getByRole('button', { name: 'status: Idea; actions' })
    const compactRelated = compactAgendaCard.getByRole('button', { name: 'Related tickets' })
    const compactExternal = compactAgendaCard.getByRole('button', { name: 'External links' })
    const [filterHeight, statusHeight, relatedHeight, externalHeight, statusFontSize] =
      await Promise.all([
        compactFilter.evaluate((element) => element.getBoundingClientRect().height),
        compactStatus.evaluate((element) => element.getBoundingClientRect().height),
        compactRelated.evaluate((element) => element.getBoundingClientRect().height),
        compactExternal.evaluate((element) => element.getBoundingClientRect().height),
        compactStatus.evaluate((element) => getComputedStyle(element).fontSize),
      ])
    await expect(compactFilter).toBeVisible()
    await expect(compactStatus).toBeVisible()
    await expect(compactRelated).toBeVisible()
    await expect(compactExternal).toBeVisible()
    expect(filterHeight).toBeLessThanOrEqual(20)
    expect(statusHeight).toBeLessThanOrEqual(20)
    expect(relatedHeight).toBeLessThanOrEqual(20)
    expect(externalHeight).toBeLessThanOrEqual(20)
    expect(statusFontSize).toBe('10px')
    await expectCenteredIcon(compactFilter, compactFilter.locator('[data-slot="leadingIcon"]'))
    await expectCenteredIcon(compactRelated, compactRelated.locator('[aria-hidden="true"]').first())
    await expectCenteredIcon(
      compactExternal,
      compactExternal.locator('[aria-hidden="true"]').first(),
    )

    mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    })
    await mobileContext.addCookies(
      await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }),
    )
    const mobilePage = await mobileContext.newPage()
    await mobilePage.goto('/tickets')
    await mobilePage.waitForLoadState('networkidle')
    await mobilePage.getByRole('button', { name: 'Idea: 3 tickets' }).tap()
    const mobileBoardCard = mobilePage
      .locator(`[data-board-ticket-id="${many.id}"]`)
      .filter({ visible: true })
    await expect(mobileBoardCard).toBeVisible()
    await expectTwoRowBoardTicketCard(mobileBoardCard, manyTitle)
    await expect(
      mobileBoardCard
        .getByLabel('Ticket hierarchy')
        .getByRole('button', { name: `client: Context ${suffix}; actions` }),
    ).toBeVisible()
    expect(
      await mobilePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true)
    await mobilePage.goto(`/releases/${releaseRecord.id}`)
    await mobilePage.waitForLoadState('networkidle')
    await expectTwoRowReleaseTicketCard(
      mobilePage.locator(`[data-release-ticket-id="${many.id}"]`),
      manyTitle,
    )
    expect(
      await mobilePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true)
    await mobilePage.goto('/today')
    await mobilePage.waitForLoadState('networkidle')
    const agendaCard = mobilePage.locator(`[data-agenda-ticket-id="${many.id}"]`)
    const agendaClientButton = agendaCard.getByRole('button', {
      name: `client: Context ${suffix}; actions`,
    })
    const agendaStatusButton = agendaCard.getByRole('button', { name: 'status: Idea; actions' })
    await expect(agendaClientButton).toHaveClass(/bg-default/)
    await expect(agendaClientButton).toHaveClass(/px-1\.5/)
    await expect(agendaStatusButton).toHaveClass(/bg-default/)
    await expect(agendaCard.getByRole('link', { name: manyTitle })).toHaveAttribute(
      'title',
      manyTitle,
    )
    const mobileRelations = agendaCard.getByRole('button', { name: 'Related tickets' })
    await mobileRelations.tap()
    await expect(mobilePage.locator(`[data-related-ticket-id="${one.id}"]`)).toBeVisible()
    await mobilePage.keyboard.press('Escape')
    const mobileLinks = agendaCard.getByRole('button', { name: 'External links' })
    await expectPlainIconTrigger(mobileRelations)
    await expectPlainIconTrigger(mobileLinks)
    await mobileLinks.tap()
    const mobileExternalLink = mobilePage.getByRole('link', { name: 'Design', exact: true })
    await expect(mobileExternalLink).toBeVisible()
    await expect(mobileExternalLink).toHaveAttribute('target', '_blank')
    await expect(
      mobilePage.getByRole('link', { name: 'jira.atlassian.com', exact: true }),
    ).toHaveAttribute('href', 'https://jira.atlassian.com/browse/NXMR-POPOVER')
    expect(
      await mobilePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true)

    await page.goto(`/releases/${releaseRecord.id}`)
    await page.waitForLoadState('networkidle')
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
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Mark release as done' }).click()
    await expect(page).toHaveURL(`/projects/${projectRecord.id}`)
  } finally {
    await mobileContext?.close()
    await cleanup(owner.id)
  }
})
