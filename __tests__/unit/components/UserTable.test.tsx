import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import UserTable from '../../../src/components/UserTable';

// Mock UserForm (避免表單內部邏輯影響)
vi.mock('@/components/UserForm', () => ({
  default: (props: Record<string, unknown>) =>
    props.open ? (
      <div data-testid="user-form">
        <button
          onClick={() => (props.onOpenChange as (open: boolean) => void)(false)}
        >
          關閉
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
              name: '新用戶',
              email: 'test@a.com',
              isActive: true,
              description: 'desc'
            })
          }
        >
          送出
        </button>
      </div>
    ) : null
}));

describe('UserTable', () => {
  it('renders user table and users', () => {
    render(<UserTable />);
    expect(screen.getByText('使用者管理')).toBeInTheDocument();
    expect(
      screen.getAllByText('啟用').length + screen.getAllByText('停用').length
    ).toBeGreaterThan(0);
  });

  it('can open and close add user form', () => {
    render(<UserTable />);
    fireEvent.click(screen.getByText('新增使用者'));
    expect(screen.getByTestId('user-form')).toBeInTheDocument();
    fireEvent.click(screen.getByText('關閉'));
    expect(screen.queryByTestId('user-form')).not.toBeInTheDocument();
  });

  it('can add a new user', async () => {
    render(<UserTable />);
    fireEvent.click(screen.getByText('新增使用者'));
    fireEvent.click(screen.getByText('送出'));
    await waitFor(() => {
      expect(screen.getByText('新用戶')).toBeInTheDocument();
    });
  });

  it('can open edit user form', () => {
    render(<UserTable />);
    const editBtn = screen
      .getAllByRole('button', { name: '' })
      .find((btn) => btn.querySelector('svg'));
    fireEvent.click(editBtn!);
    expect(screen.getByTestId('user-form')).toBeInTheDocument();
  });

  it('can open and cancel delete dialog', () => {
    render(<UserTable />);
    const deleteBtn = screen.getAllByTestId('delete-btn')[0];
    fireEvent.click(deleteBtn);
    expect(screen.getByTestId('confirm-delete-btn')).toBeInTheDocument();
    fireEvent.click(screen.getByText('取消'));
    expect(screen.queryByTestId('confirm-delete-btn')).not.toBeInTheDocument();
  });

  it('can delete a user', async () => {
    render(<UserTable />);
    const deleteBtn = screen.getAllByTestId('delete-btn')[0];
    fireEvent.click(deleteBtn);
    expect(screen.getByTestId('confirm-delete-btn')).toBeInTheDocument();
    const name = screen
      .getByText(/確定要刪除使用者/)
      .querySelector('span')?.textContent;
    fireEvent.click(screen.getByTestId('confirm-delete-btn'));
    await waitFor(() => {
      expect(screen.queryByText(name!)).not.toBeInTheDocument();
    });
  });
});
