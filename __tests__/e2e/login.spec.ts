import { expect, test } from '@playwright/test';
import { DIALOG_TEXTS } from '../../src/constants/dialogTexts';
import { TEST_USER } from '../../src/constants/mockData';

test.describe('Login', () => {
  test('should allow user to log in with a valid username', async ({
    page
  }) => {
    // Navigate to the application
    await page.goto('/');

    // Verify the login dialog is shown
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Check dialog content
    await expect(
      dialog.getByRole('heading', { name: DIALOG_TEXTS.WELCOME.TITLE })
    ).toBeVisible();
    await expect(
      dialog.getByText(DIALOG_TEXTS.WELCOME.DESCRIPTION)
    ).toBeVisible();

    // Fill in the username
    const usernameInput = page.getByTestId('username-input');
    await expect(usernameInput).toBeVisible();
    await usernameInput.fill(TEST_USER);

    // Submit the form
    const submitButton = page.getByTestId('confirm-username-button');
    await submitButton.click();

    // Verify the dialog is closed after successful login
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // Verify user info is shown in the header
    await expect(page.getByText(TEST_USER)).toBeVisible({ timeout: 5000 });
  });
});
