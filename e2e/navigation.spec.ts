import { expect, test } from '@playwright/test';

test.describe('navigation and accessibility smoke', () => {
  test('home loads and primary navigation reaches every section', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chromium', 'Desktop primary navigation is intentionally collapsed on mobile.');
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /make the math/i })).toBeVisible();
    for (const [label, heading] of [['Calculators', /electrical calculations/i], ['Formula library', /formula library/i], ['About', /about voltcalc/i], ['Contact', /^contact$/i]] as const) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }
  });

  test('calculator navigation and refresh remain stable', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Explore calculators/ }).click();
    await expect(page.getByRole('heading', { name: /electrical calculations/i })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: /make the math/i })).toBeVisible();
    await page.getByRole('button', { name: /Explore calculators/ }).click();
    await page.getByRole('button', { name: "Ohm's Law" }).click();
    await expect(page.getByRole('heading', { name: "Ohm's Law" })).toBeVisible();
  });

  test('keyboard focus, labels, errors, and mobile layout are usable', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    await page.getByRole('button', { name: /Explore calculators/ }).click();
    await expect(page.getByLabel('Voltage')).toBeVisible();
    await page.locator('button.primary').click();
    await expect(page.getByRole('status')).toContainText(/enter any two/i);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  });
});
