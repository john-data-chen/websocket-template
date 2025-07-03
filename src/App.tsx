import { UsernameDialog } from './components/UsernameDialog';
import { useSessionStore } from './stores/useSessionStore';

function App() {
  const { username, clearSession } = useSessionStore();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 頂部歡迎訊息 */}
      {username && (
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-semibold">用戶管理系統</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                歡迎, {username}!
              </span>
              <button
                onClick={clearSession}
                className="text-sm hover:underline"
                title="登出"
              >
                登出
              </button>
            </div>
          </div>
        </header>
      )}

      {/* 主要內容 */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {username ? `你好, ${username}!` : '用戶管理系統'}
          </h2>
          <p className="text-gray-600 mb-6">
            {username
              ? '歡迎使用即時協作用戶管理系統'
              : '請先登入以使用系統功能'}
          </p>

          <div className="space-y-4">
            {username ? (
              <>
                <p className="text-sm text-gray-500">
                  點擊下方按鈕開始管理用戶
                </p>
                <button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  onClick={() => {
                    // 這裡可以添加點擊事件
                  }}
                >
                  管理用戶
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center">
                請在彈出視窗中輸入您的名字
              </p>
            )}
          </div>
        </div>
      </main>

      {/* 用戶名輸入對話框 */}
      <UsernameDialog />
    </div>
  );
}

export default App;
