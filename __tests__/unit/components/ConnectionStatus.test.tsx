import { ConnectionStatus } from '@/components/ConnectionStatus';
import { APP_TEXTS } from '@/constants/appTexts';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('ConnectionStatus', () => {
  it('should show connected status when isConnected is true', () => {
    render(<ConnectionStatus isConnected={true} />);

    const indicator = screen.getByTestId('connection-status-indicator');
    const statusText = screen.getByTestId('connection-status-text');

    expect(indicator).toHaveClass('bg-green-500');
    expect(statusText).toHaveTextContent(APP_TEXTS.CONNECTION.CONNECTED);
  });

  it('should show disconnected status when isConnected is false', () => {
    render(<ConnectionStatus isConnected={false} />);

    const indicator = screen.getByTestId('connection-status-indicator');
    const statusText = screen.getByTestId('connection-status-text');

    expect(indicator).toHaveClass('bg-red-500');
    expect(statusText).toHaveTextContent(APP_TEXTS.CONNECTION.OFFLINE);
  });
});
