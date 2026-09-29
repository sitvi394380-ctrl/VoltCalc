import { expect, test, type Page } from '@playwright/test';

async function calculators(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Explore calculators/ }).click();
}

test.describe('calculator workflows', () => {
  test('Ohm’s Law valid, missing, invalid, zero, and reset cases', async ({ page }) => {
    await calculators(page);
    await page.getByRole('button', { name: "Ohm's Law" }).click();
    await page.getByLabel('Voltage').fill('12');
    await page.getByLabel('Current').fill('2');
    await page.locator('button.primary').click();
    await expect(page.getByRole('status')).toContainText('Resistance');
    await expect(page.getByRole('status')).toContainText('6 Ω');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.getByLabel('Voltage')).toHaveValue('');
    await page.locator('button.primary').click();
    await expect(page.getByRole('status')).toContainText(/enter any two/i);
    await page.getByLabel('Voltage').fill('-1');
    await page.getByLabel('Current').fill('2');
    await page.locator('button.primary').click();
    await expect(page.getByRole('status')).toContainText(/non-negative/i);
    await page.getByLabel('Voltage').fill('12');
    await page.getByLabel('Current').fill('0');
    await page.locator('button.primary').click();
    await expect(page.getByRole('status')).toContainText(/invalid/i);
  });

  test('Power Factor valid, boundary, impossible, and invalid cases', async ({ page }) => {
    await calculators(page);
    await page.getByRole('button', { name: 'Power Factor' }).click();
    await page.getByLabel('Real power').fill('800');
    await page.getByLabel('Apparent power').fill('1000');
    await page.locator('button.primary').click();
    await expect(page.getByRole('status')).toContainText('0.800000');
    await page.getByLabel('Real power').fill('0');
    await page.locator('button.primary').click();
    await expect(page.getByRole('status')).toContainText('0.000000');
    await page.getByLabel('Real power').fill('1001');
    await page.locator('button.primary').click();
    await expect(page.getByRole('status')).toContainText(/no greater/i);
    await page.getByLabel('Real power').fill('-1');
    await page.locator('button.primary').click();
    await expect(page.getByRole('status')).toContainText(/non-negative/i);
  });

  test('Transformer valid relationship, mismatch, and zero denominator', async ({ page }) => {
    await calculators(page);
    await page.getByRole('button', { name: 'Transformer' }).click();
    for (const [label, value] of [['Primary voltage', '240'], ['Secondary voltage', '120'], ['Primary turns', '1000'], ['Secondary turns', '500']] as const) await page.getByLabel(label).fill(value);
    await page.locator('button.primary').click();
    await expect(page.getByRole('status')).toContainText('Turns Ratio');
    await page.getByLabel('Secondary turns').fill('400');
    await page.locator('button.primary').click();
    await expect(page.getByRole('status')).toContainText(/mismatch/i);
    await page.getByLabel('Secondary voltage').fill('0');
    await page.getByLabel('Secondary turns').fill('500');
    await page.locator('button.primary').click();
    await expect(page.getByRole('status')).toContainText(/greater than zero/i);
  });

  test('Three-phase power validates PF and values', async ({ page }) => {
    await calculators(page);
    await page.getByRole('button', { name: 'Three-Phase Power' }).click();
    await page.getByLabel('Line voltage').fill('400');
    await page.getByLabel('Current').fill('10');
    await page.getByLabel('Power factor').fill('0.8');
    await page.locator('button.primary').click();
    await expect(page.getByRole('status')).toContainText('5542.562584');
    await page.getByLabel('Power factor').fill('0');
    await page.locator('button.primary').click();
    await expect(page.getByRole('status')).toContainText(/greater than zero/i);
    await page.getByLabel('Power factor').fill('1.1');
    await page.locator('button.primary').click();
    await expect(page.getByRole('status')).toContainText(/at most one/i);
    await page.getByLabel('Current').fill('-2');
    await page.getByLabel('Power factor').fill('0.8');
    await page.locator('button.primary').click();
    await expect(page.getByRole('status')).toContainText(/greater than zero/i);
  });

  test('unit converter covers power, voltage, current, and resistance in both directions', async ({ page }) => {
    await calculators(page);
    await page.getByRole('button', { name: 'Unit Converter' }).click();
    const value = page.getByLabel('Value');
    const from = page.getByLabel('From');
    const to = page.getByLabel('To');
    const calculate = page.locator('button.primary');
    for (const [number, source, target, expected] of [['1', 'kW', 'W', '1000 W'], ['1000', 'W', 'kW', '1 kW'], ['1', 'kV', 'V', '1000 V'], ['1000', 'V', 'kV', '1 kV'], ['1', 'A', 'mA', '1000 mA'], ['1000', 'mA', 'A', '1 A'], ['1', 'kΩ', 'Ω', '1000 Ω'], ['1000', 'Ω', 'kΩ', '1 kΩ']] as const) {
      await value.fill(number); await from.selectOption(source); await to.selectOption(target); await calculate.click();
      await expect(page.getByRole('status')).toContainText(expected);
    }
  });
});
