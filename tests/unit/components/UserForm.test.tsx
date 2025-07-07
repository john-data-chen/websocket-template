import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserForm from '../../../src/components/UserForm';

vi.mock('../../../src/hooks/useIsMobileScreen', () => ({
  useIsMobileScreen: () => false
}));
vi.mock('../../../src/hooks/useWebSocket', () => ({
  useWebSocket: () => ({ sendMessage: vi.fn() })
}));
vi.mock('../../../src/stores/useSessionStore', () => ({
  useSessionStore: () => ({ username: 'Mark.S' })
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

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('calls onSubmit with correct data', async () => {
    const onSubmit = vi.fn();
    render(<UserForm {...baseProps} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByPlaceholderText(/請輸入姓名/), {
      target: { value: '小明' }
    });
    fireEvent.blur(screen.getByPlaceholderText(/請輸入姓名/));
    fireEvent.change(screen.getByPlaceholderText(/請輸入電子郵件/), {
      target: { value: 'test@mail.com' }
    });
    fireEvent.blur(screen.getByPlaceholderText(/請輸入電子郵件/));
    fireEvent.change(screen.getByPlaceholderText(/請輸入描述/), {
      target: { value: '這是描述內容' }
    });
    fireEvent.blur(screen.getByPlaceholderText(/請輸入描述/));

    // 明確切換 Switch（帳號狀態），如果預設已是 true 可省略
    // fireEvent.click(screen.getByRole('checkbox'));

    // 等待按鈕啟用
    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: '小明',
        email: 'test@mail.com',
        isActive: true,
        description: '這是描述內容'
      });
    });
  });

  it('renders edit form when user prop is provided', () => {
    render(
      <UserForm
        {...baseProps}
        user={{
          id: 1,
          name: '小明',
          email: 'test@mail.com',
          isActive: false,
          description: '描述'
        }}
      />
    );
    expect(screen.getByText('編輯使用者')).toBeInTheDocument();
    expect(screen.getByDisplayValue('小明')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@mail.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('描述')).toBeInTheDocument();
  });

  it('calls onOpenChange(false) when cancel is clicked', () => {
    const onOpenChange = vi.fn();
    render(<UserForm {...baseProps} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByText('取消'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
