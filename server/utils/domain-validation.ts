export function validateRequiredName(value: unknown) {
  if (typeof value !== 'string') throw new Error('Name is required')
  const name = value.trim()
  if (name.length < 1 || name.length > 200)
    throw new Error('Name must be between 1 and 200 characters')
  return name
}

export function validateOptionalName(value: unknown) {
  return value === undefined ? undefined : validateRequiredName(value)
}

export function validateHexColor(value: unknown) {
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value))
    throw new Error('Color must be a six-digit hex value')
  return value.toLowerCase()
}

export function validateOptionalArchived(value: unknown) {
  if (value === undefined) return undefined
  if (typeof value !== 'boolean') throw new Error('Archived must be a boolean')
  return value
}

export function validateOptionalTargetDate(value: unknown) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error('Target date must use YYYY-MM-DD format')
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value)
    throw new Error('Target date is invalid')
  return value
}
