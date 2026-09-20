import { expect, test } from '@playwright/test'

test('follows system theme changes and captures responsive layouts', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Good practice starts here.' })).toBeVisible()
  await page.screenshot({ path: 'test-results/workspace-desktop.png', fullPage: true })
  await page.getByRole('link', { name: 'Set up your workspace' }).click()
  await expect(page.getByRole('region', { name: 'Google Gemini' })).toBeVisible()
  await page.screenshot({ path: 'test-results/providers-desktop.png', fullPage: true })
  await page.getByRole('link', { name: 'Preferences', exact: true }).click()
  await page.getByLabel('Color theme').selectOption('system')
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByRole('status')).toContainText('Preferences saved')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('link', { name: 'Your data', exact: true }).click()
  await page.screenshot({ path: 'test-results/data-light-desktop.png', fullPage: true })
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: 'test-results/data-mobile.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.getByRole('link', { name: 'AI providers', exact: true }).click()
  await page.screenshot({ path: 'test-results/providers-mobile.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  expect(errors).toEqual([])
})

test('shows an actionable storage failure rather than a blank screen', async ({ page }) => {
  await page.addInitScript(() => {
    IDBFactory.prototype.open = () => {
      throw new DOMException('Storage disabled', 'SecurityError')
    }
  })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('Allow site data')
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('alert')).toContainText('Allow site data')
})

test('supports keyboard navigation and returns focus after cancelling deletion', async ({
  page,
}) => {
  await page.goto('/#/settings/data')
  await expect(
    page.getByRole('button', { name: 'Delete all local data', exact: true }),
  ).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  const deleteButton = page.getByRole('button', { name: 'Delete all local data', exact: true })
  await deleteButton.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(deleteButton).toBeFocused()
})
