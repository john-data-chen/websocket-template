import { Analytics } from '@vercel/analytics/react';
import { useEffect, useRef, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { Button } from './components/ui/button';
import { UsernameDialog } from './components/UsernameDialog';
import UserTable from './components/UserTable';
import { APP_TEXTS } from './constants/appTexts';
import { WEBSOCKET_CONFIG, WEBSOCKET_URL } from './constants/websocket';
import { useWebSocket } from './hooks/useWebSocket';
import { useSessionStore } from './stores/useSessionStore';

function App() {
  const { user, logout } = useSessionStore();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const initialCheckDone = useRef(false);
  const errorShownRef = useRef<boolean>(false);

  // Check if user is logged in, if not, open login dialog
  useEffect(() => {
    if (!initialCheckDone.current) {
      setIsLoginDialogOpen(!user);
      initialCheckDone.current = true;
    }
  }, [user]);

  const { TOAST_DURATION } = WEBSOCKET_CONFIG;

  const showConnectionError = () => {
    if (errorShownRef.current) return;

    errorShownRef.current = true;
    toast.error(APP_TEXTS.CONNECTION.ERROR.TITLE, {
      description: APP_TEXTS.CONNECTION.ERROR.DESCRIPTION,
      duration: TOAST_DURATION,
      id: 'websocket-error'
    });
  };

  const handleReconnectFailed = () => {
    showConnectionError();
  };

  const { isConnected: wsConnected } = useWebSocket(WEBSOCKET_URL, {
    maxReconnectAttempts: WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS,
    reconnectDelay: WEBSOCKET_CONFIG.RECONNECT_DELAY,
    maxWaitTime: WEBSOCKET_CONFIG.MAX_WAIT_TIME,
    pingInterval: WEBSOCKET_CONFIG.PING_INTERVAL,
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    onReconnectFailed: handleReconnectFailed
  });

  return (
    <>
      <Analytics />
      <Toaster position="bottom-right" richColors />
      <main className="min-h-screen bg-gray-50" data-testid="app-root">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <div className="flex items-center space-x-3">
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                    {APP_TEXTS.HEADER.TITLE}
                  </h1>
                  <output className="flex items-center" aria-live="polite">
                    <span
                      className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'} mr-1.5 sm:mr-2`}
                      aria-hidden="true"
                      data-testid="connection-status-indicator"
                    />
                    <span
                      className="text-xs sm:text-sm text-gray-500"
                      data-testid="connection-status-text"
                    >
                      {wsConnected
                        ? APP_TEXTS.CONNECTION.CONNECTED
                        : APP_TEXTS.CONNECTION.OFFLINE}
                    </span>
                  </output>
                </div>
              </div>
              {user && (
                <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                  <span
                    className="text-xs sm:text-sm bg-blue-50 text-blue-700 px-2 sm:px-3 py-1 rounded-full truncate max-w-[180px] sm:max-w-none"
                    data-testid="welcome-text"
                    aria-label="Welcome"
                  >
                    {APP_TEXTS.HEADER.WELCOME.replace(
                      '{{name}}',
                      user.name ?? ''
                    )}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                    onClick={logout}
                    data-testid="logout-button"
                    aria-label="Logout"
                  >
                    {APP_TEXTS.HEADER.LOGOUT}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
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
        </main>

        <UsernameDialog
          open={isLoginDialogOpen}
          onOpenChange={(open) => {
            setIsLoginDialogOpen(open);
            if (user) {
              setIsLoginDialogOpen(false);
            }
          }}
        />
      </main>
    </>
  );
}

export default App;
