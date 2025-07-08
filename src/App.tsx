import { Analytics } from '@vercel/analytics/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Button } from './components/ui/button';
import { UserInfo } from './components/UserInfo';
import { UsernameDialog } from './components/UsernameDialog';
import UserTable from './components/UserTable';
import { APP_TEXTS } from './constants/appTexts';
import { WEBSOCKET_CONFIG } from './constants/websocket';
import { useAuth } from './hooks/useAuth';
import {
  useWebSocketActions,
  useWebSocketConnection
} from './stores/useWebSocketStore';

function App() {
  const { user, login, logout } = useAuth();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const { isConnected: wsConnected } = useWebSocketConnection();
  const { connect } = useWebSocketActions();

  // Initialize WebSocket connection
  useEffect(() => {
    connect();
  }, [connect]);

  // Show login dialog if user is not logged in
  useEffect(() => {
    if (!user) {
      setIsLoginDialogOpen(true);
    }
  }, [user]);

  // Connection status effect
  useEffect(() => {
    if (!wsConnected) {
      toast.error(APP_TEXTS.CONNECTION.ERROR.TITLE, {
        description: APP_TEXTS.CONNECTION.ERROR.DESCRIPTION,
        duration: WEBSOCKET_CONFIG.TOAST_DURATION
      });
    }
  }, [wsConnected]);

  return (
    <>
      <Analytics />
      <Toaster position="bottom-right" richColors />
      <ErrorBoundary
        onError={(error) => {
          console.error('App error boundary caught:', error);
          // You can add error reporting here (e.g., Sentry, LogRocket)
        }}
        fallback={({ error, resetError }) => (
          <div className="p-4">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Application Error
            </h2>
            <p className="mb-4">
              {error?.message ||
                'An unexpected error occurred in the application.'}
            </p>
            <Button
              onClick={resetError}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Reload Application
            </Button>
          </div>
        )}
      >
        <div className="min-h-screen bg-gray-50" data-testid="app-root">
          <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                      {APP_TEXTS.HEADER.TITLE}
                    </h1>
                    <ConnectionStatus isConnected={wsConnected} />
                  </div>
                </div>
                <UserInfo userName={user?.name ?? null} onLogout={logout} />
              </div>
            </div>
          </header>
          <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
            {user ? (
              <div className="overflow-x-auto">
                <UserTable />
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center min-h-[calc(100vh-180px)] sm:min-h-[60vh] p-4">
                <div className="text-center max-w-md w-full">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4">
                    {APP_TEXTS.LOGIN.REQUIRED}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-6">
                    {APP_TEXTS.LOGIN.PROMPT}
                  </p>
                  <Button
                    aria-label="Open login dialog"
                    data-testid="open-login-dialog-button"
                    onClick={() => setIsLoginDialogOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    {APP_TEXTS.LOGIN.BUTTON}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <UsernameDialog
            open={isLoginDialogOpen}
            onOpenChange={(open) => {
              setIsLoginDialogOpen(open);
            }}
            onUsernameSet={(username) => {
              login(username);
              setIsLoginDialogOpen(false);
            }}
          />
        </div>
      </ErrorBoundary>
    </>
  );
}

export default App;
