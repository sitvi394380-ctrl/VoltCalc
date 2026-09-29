import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('XSS payloads remain inert and query strings do not affect stability', async ({ page }) => {
  let dialogs = 0;
  page.on('dialog', async dialog => { dialogs += 1; await dialog.dismiss(); });
  await page.goto('/?value=%3Cimg%20src=x%20onerror=alert(1)%3E&script=javascript%3Aalert(2)');
  await page.getByRole('button', { name: /Explore calculators/ }).click();
  await page.getByLabel('Voltage').evaluate((element, payload) => {
    const input = element as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, payload);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, '<img src=x onerror=alert(1)>');
  await page.getByLabel('Current').fill('2');
  await page.locator('button.primary').click();
  await expect(page.getByRole('status')).toContainText(/non-negative|enter any two|invalid/i);
  await page.reload();
  expect(dialogs).toBe(0);
  await expect(page.getByRole('heading', { name: /make the math/i })).toBeVisible();
});

test('source contains no dynamic execution or unsafe HTML insertion primitives', async () => {
  const app = await readFile('src/App.tsx', 'utf8');
  const calculations = await readFile('src/calculations.ts', 'utf8');
  expect(`${app}\n${calculations}`).not.toMatch(/\beval\s*\(|new\s+Function\s*\(|innerHTML\s*=/);
  expect(`${app}\n${calculations}`).not.toMatch(/<script\b/i);
});
