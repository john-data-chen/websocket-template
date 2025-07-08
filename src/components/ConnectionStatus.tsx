import { APP_TEXTS } from '@/constants/appTexts';

interface ConnectionStatusProps {
  readonly isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <output className="flex items-center" aria-live="polite">
      <span
        className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full mr-1.5 sm:mr-2 ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}
        aria-hidden="true"
        data-testid="connection-status-indicator"
      />
      <span
        className="text-xs sm:text-sm text-gray-500"
        data-testid="connection-status-text"
      >
        {isConnected
          ? APP_TEXTS.CONNECTION.CONNECTED
          : APP_TEXTS.CONNECTION.OFFLINE}
      </span>
    </output>
  );
}
