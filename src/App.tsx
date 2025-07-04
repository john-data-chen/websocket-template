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
      <Toaster position="bottom-right" richColors />
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                用戶管理系統
              </h1>
              <div className="flex items-center">
                <span
                  className={`h-3 w-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'} mr-2`}
                ></span>
                <span className="text-sm text-gray-500">
                  {wsConnected ? '已連接' : '離線'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {username && (
                <>
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    歡迎, {username}!
                  </span>
                  <button
                    onClick={clearSession}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    登出
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {username ? (
            <UserTable />
          ) : (
            <div className="flex flex-col justify-center items-center min-h-[60vh]">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  請先登入
                </h2>
                <p className="text-gray-600">您需要登入才能使用此系統</p>
              </div>
              <div className="flex justify-center mt-6">
                <Button onClick={() => setIsLoginDialogOpen(true)}>登入</Button>
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
