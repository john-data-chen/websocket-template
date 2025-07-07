import { Analytics } from '@vercel/analytics/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { Button } from './components/ui/button';
import { UsernameDialog } from './components/UsernameDialog';
import UserTable from './components/UserTable';
import { WEBSOCKET_URL } from './constants/websocket';
import { useSessionStore } from './stores/useSessionStore';

function App() {
  const { username, clearSession } = useSessionStore();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const initialCheckDone = useRef(false);

  // check if user is logged in, if not, open login dialog
  useEffect(() => {
    if (!initialCheckDone.current) {
      setIsLoginDialogOpen(!username);
      initialCheckDone.current = true;
    }
  }, [username]);
  const errorShownRef = useRef<boolean>(false);
  const reconnectAttempts = useRef<number>(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const pingInterval = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef<boolean>(true);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000; // 3 seconds base delay

  const showConnectionError = useCallback(() => {
    if (!isMounted.current || errorShownRef.current) return;

    errorShownRef.current = true;
    toast.error('無法連接到即時協作伺服器', {
      description: '部分即時協作功能可能無法正常運作',
      duration: 5000,
      id: 'websocket-error'
    });
  }, []);

  const setupWebSocket = useCallback(() => {
    if (!isMounted.current) return;

    // Clean up previous connection if exists
    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onerror = null;
      ws.current.onclose = null;
      ws.current.close();
      ws.current = null;
    }

    try {
      ws.current = new WebSocket(WEBSOCKET_URL);

      ws.current.onopen = () => {
        if (!isMounted.current) return;
        console.log('WebSocket connected');
        setWsConnected(true);
        reconnectAttempts.current = 0;
        errorShownRef.current = false;
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
        toast.dismiss('websocket-error');
      };

      ws.current.onerror = () => {
        if (!isMounted.current) return;
        console.error('WebSocket connection error');
        setWsConnected(false);
        showConnectionError();
      };

      ws.current.onclose = () => {
        if (!isMounted.current) return;
        console.log('WebSocket disconnected');
        setWsConnected(false);

        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current),
            30000 // Max 30 seconds
          );

          reconnectTimer.current = setTimeout(() => {
            if (isMounted.current) {
              reconnectAttempts.current++;
              setupWebSocket();
            }
          }, delay);
        } else {
          showConnectionError();
        }
      };
    } catch (error) {
      console.error('WebSocket initialization error:', error);
      setWsConnected(false);
      showConnectionError();
    }
  }, [showConnectionError]);

  // Set up ping interval when connected
  useEffect(() => {
    if (!wsConnected) return;

    pingInterval.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
    };
  }, [wsConnected]);

  // Initial WebSocket setup
  useEffect(() => {
    isMounted.current = true;
    setupWebSocket();

    return () => {
      isMounted.current = false;
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
        pingInterval.current = null;
      }
    };
  }, [setupWebSocket]);

  return (
    <>
      <Analytics />
      <Toaster position="bottom-right" richColors />
      <div className="min-h-screen bg-gray-50" data-testid="app-root">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <div className="flex items-center space-x-3">
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                    用戶管理系統
                  </h1>
                  <div className="flex items-center">
                    <span
                      className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'} mr-1.5 sm:mr-2`}
                      aria-hidden="true"
                    />
                    <span className="text-xs sm:text-sm text-gray-500">
                      {wsConnected ? '已連接' : '離線'}
                    </span>
                  </div>
                </div>
              </div>
              {username && (
                <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-xs sm:text-sm bg-blue-50 text-blue-700 px-2 sm:px-3 py-1 rounded-full truncate max-w-[180px] sm:max-w-none">
                    歡迎, {username}!
                  </span>
                  <button
                    onClick={clearSession}
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                    data-testid="logout-button"
                    aria-label="logout-button"
                  >
                    登出
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          {username ? (
            <div className="overflow-x-auto">
              <UserTable />
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-180px)] sm:min-h-[60vh] p-4">
              <div className="text-center max-w-md w-full">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4">
                  請先登入
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-6">
                  您需要登入才能使用此系統
                </p>
                <Button
                  aria-label="login-button"
                  data-testid="login-button"
                  onClick={() => setIsLoginDialogOpen(true)}
                  className="w-full sm:w-auto px-6 py-2"
                >
                  登入
                </Button>
              </div>
            </div>
          )}
        </main>

        <UsernameDialog
          open={isLoginDialogOpen}
          onOpenChange={(open) => {
            setIsLoginDialogOpen(open);
            if (username) {
              setIsLoginDialogOpen(false);
            }
          }}
        />
      </div>
    </>
  );
}

export default App;
