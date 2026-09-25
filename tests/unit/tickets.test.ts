import { Effect, Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import {
  TicketCreate,
  TicketLinkCreate,
  TicketRelationCreate,
  TicketUpdate,
} from '../../server/domain/schemas'
import { nextStatus, ticketStatuses } from '../../shared/ticket-status'
import { ticketStatus } from '../../server/db/schema'
import { externalUrl } from '../../app/utils/ticket-url'

const decode = <S extends Schema.Top>(schema: S, input: unknown) =>
  Effect.runPromise(Schema.decodeUnknownEffect(schema)(input))

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
      decode(TicketLinkCreate, { label: '', url: 'https://example.com' }),
    ).rejects.toThrow()
    await expect(decode(TicketRelationCreate, { ticketId: 't' })).resolves.toBeTruthy()
    expect(externalUrl('https://example.com/path')).toBe('https://example.com/path')
    expect(() => externalUrl('javascript:alert(1)')).toThrow()
    expect(() => externalUrl('https://user:pass@example.com')).toThrow()
  })
})
