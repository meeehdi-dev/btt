import { expect, type Locator } from '@playwright/test'

export async function expectModalActionsRightAligned(dialog: Locator, labels: string[]) {
  const form = dialog.locator('form').last()
  // Modal scale/translate transitions can change geometry between measurements.
  // Wait for the actual alignment, rather than sampling separate animation frames.
  await expect(async () => {
    const formBox = await form.boundingBox()
    if (!formBox) throw new Error('Modal form must be visible')

    const buttons = await Promise.all(
      labels.map(async (label) => {
        const box = await dialog.getByRole('button', { name: label, exact: true }).boundingBox()
        if (!box) throw new Error(`Modal action ${label} must be visible`)
        return box
      }),
    )

    for (let index = 1; index < buttons.length; index++) {
      const previous = buttons[index - 1]!
      expect(previous.x + previous.width).toBeLessThan(buttons[index]!.x)
    }

    const lastButton = buttons.at(-1)!
    const rightEdge = lastButton.x + lastButton.width
    expect(Math.abs(rightEdge - (formBox.x + formBox.width))).toBeLessThanOrEqual(4)
  }).toPass({ timeout: 5_000 })
}
