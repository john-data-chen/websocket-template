import UserForm from '@/components/UserForm';
import { FORM_ATTRIBUTES } from '@/constants/formAttribute';
import { TEST_DESCRIPTION, TEST_EMAIL, TEST_USER } from '@/constants/mockData';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useIsMobileScreen', () => ({
  useIsMobileScreen: () => false
}));
vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => ({ sendMessage: vi.fn() })
}));
vi.mock('@/stores/useSessionStore', () => ({
  useSessionStore: () => ({ user: { name: 'Mark.S' } })
}));
vi.mock('sonner', () => ({
  toast: { dismiss: vi.fn(), default: vi.fn() }
}));

describe('UserForm', () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    user: null,
    onSubmit: vi.fn()
  };

  const testUser = {
    id: 1,
    name: TEST_USER,
    email: TEST_EMAIL,
    isActive: false,
    description: TEST_DESCRIPTION
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('calls onSubmit with correct data', async () => {
    const onSubmit = vi.fn();
    render(<UserForm {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(
      screen.getByPlaceholderText(FORM_ATTRIBUTES.FIELDS.NAME.PLACEHOLDER),
      {
        target: { value: TEST_USER }
      }
    );
    fireEvent.blur(
      screen.getByPlaceholderText(FORM_ATTRIBUTES.FIELDS.NAME.PLACEHOLDER)
    );

    fireEvent.change(
      screen.getByPlaceholderText(FORM_ATTRIBUTES.FIELDS.EMAIL.PLACEHOLDER),
      {
        target: { value: TEST_EMAIL }
      }
    );
    fireEvent.blur(
      screen.getByPlaceholderText(FORM_ATTRIBUTES.FIELDS.EMAIL.PLACEHOLDER)
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        FORM_ATTRIBUTES.FIELDS.DESCRIPTION.PLACEHOLDER
      ),
      {
        target: { value: TEST_DESCRIPTION }
      }
    );
    fireEvent.blur(
      screen.getByPlaceholderText(
        FORM_ATTRIBUTES.FIELDS.DESCRIPTION.PLACEHOLDER
      )
    );

    // Wait for button to be enabled
    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: TEST_USER,
        email: TEST_EMAIL,
        isActive: true,
        description: TEST_DESCRIPTION
      });
    });
  });

  it('renders edit form when user prop is provided', () => {
    render(<UserForm {...baseProps} user={testUser} />);
    expect(
      screen.getByText(FORM_ATTRIBUTES.EDIT_USER_TITLE)
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(TEST_USER)).toBeInTheDocument();
    expect(screen.getByDisplayValue(TEST_EMAIL)).toBeInTheDocument();
    expect(screen.getByDisplayValue(TEST_DESCRIPTION)).toBeInTheDocument();
  });

  it('calls onOpenChange(false) when cancel is clicked', () => {
    const onOpenChange = vi.fn();
    render(<UserForm {...baseProps} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByText(FORM_ATTRIBUTES.BUTTONS.CANCEL));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
