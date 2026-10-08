import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import {
  TicketCreate,
  TicketLinkCreate,
  TicketLinkUpdate,
  TicketRelationCreate,
  TicketUpdate,
} from '../../server/domain/schemas'
import { nextStatus, ticketStatuses, ticketStatusIcons } from '../../shared/ticket-status'
import { ticketStatus } from '../../server/db/schema'
import { externalUrl } from '../../shared/ticket-url'
import { ticketLinkLabel } from '../../app/utils/ticket-link-label'

const decode = <S extends Schema.ConstraintDecoder<unknown>>(schema: S, input: unknown) =>
  Schema.decodeUnknownPromise(schema)(input)

describe('ticket workflow', () => {
  it('advances through seven fixed statuses and stops at Done', () => {
    expect(ticketStatuses).toEqual([
      'Idea',
      'Estimate',
      'Develop',
      'Review',
      'Test',
      'Deploy',
      'Done',
    ])
    for (let index = 0; index < ticketStatuses.length - 1; index++)
      expect(nextStatus(ticketStatuses[index]!)).toBe(ticketStatuses[index + 1])
    expect(nextStatus('Done')).toBeNull()
    expect(ticketStatus.enumValues).toEqual(ticketStatuses)
    expect(ticketStatusIcons).toEqual({
      Idea: 'lucide:lightbulb',
      Estimate: 'lucide:calculator',
      Develop: 'lucide:code',
      Review: 'lucide:eye',
      Test: 'lucide:flask-conical',
      Deploy: 'lucide:rocket',
      Done: 'lucide:circle-check',
    })
  })
  it('validates create/update estimates and fixed status', async () => {
    await expect(
      decode(TicketCreate, { releaseId: 'r', title: 'Work', estimateMinutes: 30 }),
    ).resolves.toBeTruthy()
    await expect(
      decode(TicketCreate, { releaseId: 'r', title: 'Work', estimateMinutes: 0 }),
    ).rejects.toThrow()
    await expect(
      decode(TicketCreate, { releaseId: 'r', title: 'Work', estimateMinutes: 1.5 }),
    ).rejects.toThrow()
    await expect(
      decode(TicketCreate, { releaseId: 'r', title: 'Work', status: 'Blocked' }),
    ).rejects.toThrow()
    await expect(decode(TicketUpdate, { status: 'Done', estimateMinutes: null })).resolves.toEqual({
      status: 'Done',
      estimateMinutes: null,
    })
    await expect(decode(TicketCreate, { releaseId: 'r', title: ' ' })).rejects.toThrow()
    await expect(
      decode(TicketCreate, {
        releaseId: 'r',
        title: 'Linked work',
        links: [{ label: 'PR', url: 'https://example.com' }],
        relatedTicketIds: ['other'],
      }),
    ).resolves.toMatchObject({ links: [{ label: 'PR' }], relatedTicketIds: ['other'] })
    await expect(
      decode(TicketCreate, {
        releaseId: 'r',
        title: 'Unlabeled link',
        links: [{ url: 'https://jira.atlassian.com/browse/NXMR-1' }],
      }),
    ).resolves.toMatchObject({ links: [{ url: 'https://jira.atlassian.com/browse/NXMR-1' }] })
    await expect(
      decode(TicketCreate, {
        releaseId: 'r',
        title: 'Invalid link',
        links: [{ label: '', url: 'https://example.com' }],
      }),
    ).rejects.toThrow()
  })
  it('validates link and relation payloads and safe URLs', async () => {
    await expect(
      decode(TicketLinkCreate, { label: 'PR', url: 'https://example.com' }),
    ).resolves.toBeTruthy()
    await expect(
      decode(TicketLinkCreate, { url: 'https://jira.atlassian.com/browse/NXMR-1' }),
    ).resolves.toMatchObject({ url: 'https://jira.atlassian.com/browse/NXMR-1' })
    await expect(
      decode(TicketLinkCreate, { label: null, url: 'https://example.com' }),
    ).resolves.toMatchObject({ label: null })
    await expect(
      decode(TicketLinkCreate, { label: '', url: 'https://example.com' }),
    ).rejects.toThrow()
    await expect(decode(TicketLinkUpdate, {})).resolves.toEqual({})
    await expect(decode(TicketLinkUpdate, { label: null })).resolves.toMatchObject({
      label: null,
    })
    await expect(decode(TicketLinkUpdate, { url: 'https://example.com' })).resolves.toMatchObject({
      url: 'https://example.com',
    })
    await expect(decode(TicketRelationCreate, { ticketId: 't' })).resolves.toBeTruthy()
    expect(externalUrl('https://example.com/path')).toBe('https://example.com/path')
    expect(ticketLinkLabel('Pull request', 'https://example.com/pr')).toBe('Pull request')
    expect(ticketLinkLabel(null, 'https://jira.atlassian.com/browse/NXMR-1')).toBe(
      'jira.atlassian.com',
    )
    expect(ticketLinkLabel(undefined, 'https://example.com/path')).toBe('example.com')
    expect(() => externalUrl('javascript:alert(1)')).toThrow()
    expect(() => externalUrl('https://user:pass@example.com')).toThrow()
  })
})
