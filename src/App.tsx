import { useEffect, useState } from 'react';
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

  // Monitor WebSocket connection status
  useEffect(() => {
    const checkConnection = () => {
      try {
        const ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
          setWsConnected(true);
          ws.close();
        };

        ws.onerror = (error) => {
          console.error('WebSocket connection error:', error);
          setWsConnected(false);
          toast.error('無法連接到即時協作伺服器', {
            description: '部分即時協作功能可能無法正常運作',
            duration: 5000
          });
        };

        // Set up connection check interval
        const timer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          } else if (ws.readyState === WebSocket.CLOSED) {
            checkConnection();
          }
        }, 30000);

        return () => clearInterval(timer);
      } catch (error) {
        console.error('Error initializing WebSocket:', error);
        setWsConnected(false);
      }
    };

    checkConnection();
  }, []);

  return (
    <>
      <Toaster position="top-right" richColors />
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
