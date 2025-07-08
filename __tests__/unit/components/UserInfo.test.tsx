import { UserInfo } from '@/components/UserInfo';
import { APP_TEXTS } from '@/constants/appTexts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('UserInfo', () => {
  const mockLogout = vi.fn();
  const testUserName = 'Test User';

  it('should not render when userName is not provided', () => {
    render(<UserInfo userName={null} onLogout={mockLogout} />);

    expect(screen.queryByTestId('welcome-text')).not.toBeInTheDocument();
    expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
  });

  it('should display welcome message with user name', () => {
    render(<UserInfo userName={testUserName} onLogout={mockLogout} />);

    const welcomeText = screen.getByTestId('welcome-text');
    expect(welcomeText).toHaveTextContent(
      APP_TEXTS.HEADER.WELCOME.replace('{{name}}', testUserName)
    );
  });

  it('should call onLogout when logout button is clicked', async () => {
    render(<UserInfo userName={testUserName} onLogout={mockLogout} />);

    const logoutButton = screen.getByTestId('logout-button');
    await userEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('should have proper accessibility attributes', () => {
    render(<UserInfo userName={testUserName} onLogout={mockLogout} />);

    const welcomeText = screen.getByTestId('welcome-text');
    const logoutButton = screen.getByTestId('logout-button');

    expect(welcomeText).toHaveAttribute('aria-label', 'Welcome');
    expect(logoutButton).toHaveAttribute('aria-label', 'Logout');
  });
});
