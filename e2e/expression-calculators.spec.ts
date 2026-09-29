import { expect, test } from '@playwright/test';

async function openCalculator(page: import('@playwright/test').Page, name: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore calculators' }).click();
  await page.getByRole('button', { name }).click();
}

test.describe('expression calculators', () => {
  test('calculator selection immediately focuses the selected calculator', async ({ page }) => {
    await openCalculator(page, 'Normal Calculator');
    await expect(page.getByTestId('normal-calculator')).toBeVisible();
    await expect(page.getByTestId('normal-calculator')).toHaveAttribute('tabindex', '-1');
    await page.getByRole('button', { name: 'Scientific Calculator' }).click();
    await expect(page.getByTestId('scientific-calculator')).toBeVisible();
  });

  test('normal calculator evaluates precedence and handles errors', async ({ page }) => {
    await openCalculator(page, 'Normal Calculator');
    const input = page.getByLabel('Calculator expression');
    await input.fill('2 + 3 * 4');
    await input.press('Enter');
    await expect(page.getByText('= 14')).toBeVisible();
    await input.fill('1 / 0');
    await input.press('Enter');
    await expect(page.getByRole('alert')).toContainText('divide by zero');
  });

  test('scientific calculator evaluates functions and switches angle mode', async ({ page }) => {
    await openCalculator(page, 'Scientific Calculator');
    const input = page.getByLabel('Calculator expression');
    await expect(page.getByRole('button', { name: 'Toggle angle mode' })).toHaveText('DEG');
    await input.fill('sin(90)');
    await input.press('Enter');
    await expect(page.getByText('= 1')).toBeVisible();
    await page.getByRole('button', { name: 'Toggle angle mode' }).click();
    await expect(page.getByRole('button', { name: 'Toggle angle mode' })).toHaveText('RAD');
    await input.fill('sin(pi / 2)');
    await input.press('Enter');
    await expect(page.getByText('= 1')).toBeVisible();
  });

  test('scientific calculator supports every exposed scientific function', async ({ page }) => {
    await openCalculator(page, 'Scientific Calculator');
    const input = page.getByLabel('Calculator expression');
    const cases = [
      ['(2 + 3) * 4', '= 20'], ['50%', '= 0.5'], ['2^3', '= 8'], ['sqrt(9)', '= 3'],
      ['5!', '= 120'], ['pi', '= 3.14159265359'], ['e', '= 2.71828182846'], ['log(100)', '= 2'],
      ['ln(e)', '= 1'], ['sin(90)', '= 1'], ['cos(0)', '= 1'], ['tan(45)', '= 1'],
      ['asin(1)', '= 90'], ['acos(1)', '= 0'], ['atan(1)', '= 45']
    ] as const;
    for (const [expression, expected] of cases) {
      await input.fill(expression);
      await input.press('Enter');
      await expect(page.getByText(expected, { exact: true })).toBeVisible();
    }
    await input.fill('sqrt(-1)');
    await input.press('Enter');
    await expect(page.getByRole('alert')).toContainText('outside');
  });

  test('scientific keypad supports touch-style interaction', async ({ page }) => {
    await openCalculator(page, 'Scientific Calculator');
    await page.getByRole('button', { name: '2' }).click();
    await page.getByRole('button', { name: 'xʸ' }).click();
    await page.getByRole('button', { name: '3' }).click();
    await page.getByRole('button', { name: '=' }).click();
    await expect(page.getByText('= 8')).toBeVisible();
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByLabel('Calculator expression')).toHaveValue('');
  });
});
