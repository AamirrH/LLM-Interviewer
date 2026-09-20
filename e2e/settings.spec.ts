import { expect, test } from '@playwright/test'

test('workspace routes to settings and preferences survive a reload', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Good practice starts here.' })).toBeVisible()
  await page.getByRole('link', { name: 'Set up your workspace' }).click()
  await page.getByRole('link', { name: 'Preferences', exact: true }).click()
  await page.getByLabel('Color theme').selectOption('light')
  await page.getByLabel('Editor font size').selectOption('18')
  await page.getByLabel('Enable autocomplete and snippets').check()
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByRole('status')).toContainText('Preferences saved')
  await page.reload()
  await expect(page.getByLabel('Color theme')).toHaveValue('light')
  await expect(page.getByLabel('Editor font size')).toHaveValue('18')
  await expect(page.getByLabel('Enable autocomplete and snippets')).toBeChecked()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('provider keys stay local, survive reload, and can be removed', async ({ page }) => {
  const externalRequests: string[] = []
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173')) externalRequests.push(request.url())
  })
  await page.goto('/#/settings/providers')
  const card = page.getByRole('region', { name: 'Google Gemini' })
  await card.getByLabel('Google Gemini API key').fill('test-only-not-a-real-key')
  await card.getByRole('button', { name: 'Save key' }).click()
  await expect(card.getByText('Saved locally', { exact: true })).toBeVisible()
  await expect(card.getByLabel('Google Gemini API key')).toHaveValue('')
  await page.reload()
  await expect(card.getByText('Saved locally', { exact: true })).toBeVisible()
  await card.getByRole('button', { name: 'Remove key' }).click()
  await expect(card.getByText('No key saved', { exact: true })).toBeVisible()
  expect(externalRequests).toEqual([])
})

test('exports and restores preferences without exporting provider keys', async ({ page }) => {
  await page.goto('/#/settings/providers')
  const card = page.getByRole('region', { name: 'Google Gemini' })
  await card.getByLabel('Google Gemini API key').fill('secret-must-stay-local')
  await card.getByRole('button', { name: 'Save key' }).click()
  await expect(card.getByText('Saved locally', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Preferences', exact: true }).click()
  await page.getByLabel('Color theme').selectOption('light')
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByRole('status')).toContainText('Preferences saved')
  await page.getByRole('link', { name: 'Your data', exact: true }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export backup' }).click()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const backup = Buffer.concat(chunks)
  expect(backup.toString()).not.toContain('secret-must-stay-local')
  await page.getByRole('link', { name: 'Preferences', exact: true }).click()
  await page.getByLabel('Color theme').selectOption('dark')
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByRole('status')).toContainText('Preferences saved')
  await page.getByRole('link', { name: 'Your data', exact: true }).click()
  await page
    .getByLabel('Choose backup file')
    .setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: backup })
  await page.getByRole('button', { name: 'Restore preferences' }).click()
  await expect(page.getByRole('status')).toContainText('Backup restored')
  await page.getByRole('link', { name: 'Preferences', exact: true }).click()
  await expect(page.getByLabel('Color theme')).toHaveValue('light')
  await page.getByRole('link', { name: 'AI providers', exact: true }).click()
  await expect(card.getByText('Saved locally', { exact: true })).toBeVisible()
})

test('rejects invalid backup files and requires deliberate deletion', async ({ page }) => {
  await page.goto('/#/settings/providers')
  const card = page.getByRole('region', { name: 'Google Gemini' })
  await card.getByLabel('Google Gemini API key').fill('delete-me')
  await card.getByRole('button', { name: 'Save key' }).click()
  await expect(card.getByText('Saved locally', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Your data', exact: true }).click()
  await page
    .getByLabel('Choose backup file')
    .setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{invalid'),
    })
  await expect(page.getByRole('alert')).toContainText('Invalid backup')
  await page.getByRole('button', { name: 'Delete all local data', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: 'Permanently delete data' })).toBeDisabled()
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).not.toBeVisible()
  await page.getByRole('button', { name: 'Delete all local data', exact: true }).click()
  await dialog.getByLabel('Type DELETE to confirm').fill('DELETE')
  await dialog.getByRole('button', { name: 'Permanently delete data' }).click()
  await expect(page.getByRole('status')).toContainText('All local data deleted')
  await page.reload()
  await page.getByRole('link', { name: 'AI providers', exact: true }).click()
  await expect(card.getByText('No key saved', { exact: true })).toBeVisible()
})

test('loaded settings work offline and at a narrow viewport', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/settings/preferences')
  await expect(page.getByLabel('Color theme')).toBeVisible()
  await context.setOffline(true)
  await expect(page.getByText('Offline · local settings available')).toBeVisible()
  await page.getByLabel('Color theme').selectOption('light')
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByRole('status')).toContainText('Preferences saved')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})
