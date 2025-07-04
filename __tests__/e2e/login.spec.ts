import { expect, test } from '@playwright/test';
import { TEST_USER } from '../../src/constants/mockData';

test.describe('Login', () => {
  test('should allow user to log in with a valid username', async ({
    page
  }) => {
    // Navigate to the application
    await page.goto('/');

    // Verify the login dialog is shown
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: '歡迎使用' })).toBeVisible();

    // Fill in the username
    const usernameInput = page.getByPlaceholder('請輸入您的名字');
    await usernameInput.fill(TEST_USER);

    // Submit the form
    const submitButton = page.getByRole('button', { name: '確認' });
    await submitButton.click();

    // Verify the user is logged in
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText(`歡迎, ${TEST_USER}!`)).toBeVisible();

    // Verify the user table is shown
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should show error for username that is too long', async ({ page }) => {
    await page.goto('/');

    // Enter a very long username
    const longUsername =
      'ThisIsAVeryLongUsernameThatExceedsTheMaximumAllowedLength';
    await page.getByPlaceholder('請輸入您的名字').fill(longUsername);
    await page.getByRole('button', { name: '確認' }).click();

    // Verify error message is shown
    await expect(page.getByText('名字長度不能超過 20 個字元')).toBeVisible();
  });

  test('should trim whitespace from username', async ({ page }) => {
    await page.goto('/');

    // Enter username with whitespace
    await page.getByPlaceholder('請輸入您的名字').fill(`  ${TEST_USER}  `);
    await page.getByRole('button', { name: '確認' }).click();

    // Verify the username is stored without extra whitespace
    await expect(page.getByText(`歡迎, ${TEST_USER}!`)).toBeVisible();
  });
});
