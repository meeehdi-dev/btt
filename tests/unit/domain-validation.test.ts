import { describe, expect, it } from 'vitest'
import {
  validateHexColor,
  validateOptionalTargetDate,
  validateRequiredName,
} from '../../server/utils/domain-validation'

describe('M2 domain validation', () => {
  it('normalizes valid names and colors', () => {
    expect(validateRequiredName('  Acme  ')).toBe('Acme')
    expect(validateHexColor('#ABC123')).toBe('#abc123')
    expect(validateOptionalTargetDate('2030-02-01')).toBe('2030-02-01')
    expect(validateOptionalTargetDate(null)).toBeNull()
  })

  it('rejects invalid names, colors, and dates', () => {
    expect(() => validateRequiredName('')).toThrowError()
    expect(() => validateHexColor('blue')).toThrowError()
    expect(() => validateOptionalTargetDate('2030-02-31')).toThrowError()
  })
})
