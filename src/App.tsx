import { Analytics } from '@vercel/analytics/react';
import { useEffect, useState } from 'react';
// Custom toast container is used instead of sonner Toaster
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorFallback } from './components/ErrorFallback';
import { Button } from './components/ui/button';
import { UserInfo } from './components/UserInfo';
import { UsernameDialog } from './components/UsernameDialog';
import UserTable from './components/UserTable';
import { APP_TEXTS } from './constants/appTexts';
import { useAuth } from './hooks/useAuth';
import { useWebSocketActions } from './stores/useWebSocketStore';

function App() {
  const { user, login, logout } = useAuth();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
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
  return (
    <>
      <Analytics />
      <div
        id="editing-users-toast"
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '0.75rem 1.25rem',
          borderRadius: '0.375rem',
          zIndex: 9999,
          display: 'none',
          maxWidth: '320px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontSize: '0.9375rem',
          lineHeight: '1.5',
          backdropFilter: 'blur(4px)'
        }}
      ></div>
      <ErrorBoundary
        onError={(error) => {
          console.error('App error boundary caught:', error);
          // You can add error reporting here (e.g., Sentry, LogRocket)
        }}
        fallback={ErrorFallback}
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
