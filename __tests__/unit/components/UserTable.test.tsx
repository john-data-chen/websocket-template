import UserTable from '@/components/UserTable';
import { TEST_DESCRIPTION, TEST_EMAIL, TEST_USER } from '@/constants/mockData';
import { TABLE_TEXTS } from '@/constants/tableTexts';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock UserForm component
vi.mock('@/components/UserForm', () => ({
  default: (props: Record<string, unknown>) =>
    props.open ? (
      <div data-testid="user-form">
        <button
          onClick={() => (props.onOpenChange as (open: boolean) => void)(false)}
          data-testid="close-form-button"
        >
          {TABLE_TEXTS.BUTTONS.CANCEL}
        </button>
        <button
          onClick={() =>
            (
              props.onSubmit as (data: {
                name: string;
                email: string;
                isActive: boolean;
                description: string;
              }) => void
            )({
              name: TEST_USER,
              email: TEST_EMAIL,
              isActive: true,
              description: TEST_DESCRIPTION
            })
          }
          data-testid="submit-form-button"
        >
          送出
        </button>
      </div>
    ) : null
}));

describe('UserTable', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders user table with correct title and headers', () => {
    render(<UserTable />);

    // Check if the table container and title are rendered
    expect(screen.getByTestId('user-table-container')).toBeInTheDocument();
    expect(screen.getByText(TABLE_TEXTS.PAGE_TITLE)).toBeInTheDocument();

    // Check if all table headers are rendered
    Object.values(TABLE_TEXTS.HEADERS).forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });

    // Check if status badges are rendered
    expect(
      screen.getAllByText(TABLE_TEXTS.STATUS.ACTIVE).length +
        screen.getAllByText(TABLE_TEXTS.STATUS.INACTIVE).length
    ).toBeGreaterThan(0);
  });

  it('can open and close the add user form', () => {
    render(<UserTable />);

    // Open the form
    fireEvent.click(screen.getByTestId('add-user-button'));
    expect(screen.getByTestId('user-form')).toBeInTheDocument();

    // Close the form
    fireEvent.click(screen.getByTestId('close-form-button'));
    expect(screen.queryByTestId('user-form')).not.toBeInTheDocument();
  });

  it('can add a new user', async () => {
    render(<UserTable />);

    // Open the form and submit a new user
    fireEvent.click(screen.getByTestId('add-user-button'));
    fireEvent.click(screen.getByTestId('submit-form-button'));

    // Check if the new user is added to the table
    await waitFor(() => {
      expect(screen.getByText(TEST_USER)).toBeInTheDocument();
    });
  });

  it('can open the edit user form', () => {
    render(<UserTable />);

    // Find and click the first edit button
    const editButtons = screen.getAllByTestId(/edit-user-\d+-button/);
    fireEvent.click(editButtons[0]);

    // Check if the form is opened
    expect(screen.getByTestId('user-form')).toBeInTheDocument();
  });

  it('can open and cancel the delete confirmation dialog', () => {
    render(<UserTable />);

    // Find and click the first delete button
    const deleteButtons = screen.getAllByTestId(/delete-user-\d+-button/);
    fireEvent.click(deleteButtons[0]);

    // Check if the delete dialog is opened
    expect(screen.getByTestId('delete-dialog-title')).toHaveTextContent(
      TABLE_TEXTS.DELETE_DIALOG.TITLE
    );

    // Cancel the delete action
    fireEvent.click(screen.getByTestId('cancel-delete-button'));

    // Check if the dialog is closed
    expect(screen.queryByTestId('delete-dialog-title')).not.toBeInTheDocument();
  });

  it('can delete a user', async () => {
    render(<UserTable />);

    // Get the first user's name
    const userRows = screen.getAllByRole('row').slice(1); // Skip header row
    const userName = userRows[0].querySelector('td')?.textContent;

    // Open delete dialog
    const deleteButtons = screen.getAllByTestId(/delete-user-\d+-button/);
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    fireEvent.click(screen.getByTestId('confirm-delete-button'));

    // Check if the user is removed from the table
    await waitFor(() => {
      expect(screen.queryByText(userName || '')).not.toBeInTheDocument();
    });
  });
});
