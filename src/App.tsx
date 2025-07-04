import { useState } from 'react';
import { Button } from './components/ui/button';
import { UsernameDialog } from './components/UsernameDialog';
import UserTable from './components/UserTable';
import { useSessionStore } from './stores/useSessionStore';

function App() {
  const { username, clearSession } = useSessionStore();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導航欄 */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">用戶管理系統</h1>
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

      {/* 主要內容區域 */}
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

      {/* 登入對話框 */}
      <UsernameDialog
        open={isLoginDialogOpen}
        onOpenChange={(open) => {
          setIsLoginDialogOpen(open);
          // 如果用戶已經登入，確保對話框保持關閉
          if (username) {
            setIsLoginDialogOpen(false);
          }
        }}
      />
    </div>
  );
}

export default App;
