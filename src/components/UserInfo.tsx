import { APP_TEXTS } from '@/constants/appTexts';
import { Button } from './ui/button';

interface UserInfoProps {
  userName: string | null;
  onLogout: () => void;
}

export function UserInfo({ userName, onLogout }: UserInfoProps) {
  if (!userName) return null;

  return (
    <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
      <span
        className="text-xs sm:text-sm bg-blue-50 text-blue-700 px-2 sm:px-3 py-1 rounded-full truncate max-w-[180px] sm:max-w-none"
        data-testid="welcome-text"
        aria-label="Welcome"
      >
        {APP_TEXTS.HEADER.WELCOME.replace('{{name}}', userName)}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="ml-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        onClick={onLogout}
        data-testid="logout-button"
        aria-label="Logout"
      >
        {APP_TEXTS.HEADER.LOGOUT}
      </Button>
    </div>
  );
}
