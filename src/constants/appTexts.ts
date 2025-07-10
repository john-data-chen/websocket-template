export const APP_TEXTS = {
  // Header
  HEADER: {
    TITLE: '用戶管理系統',
    WELCOME: '歡迎, {{name}} !',
    LOGOUT: '登出'
  },

  // Login
  LOGIN: {
    REQUIRED: '請先登入',
    PROMPT: '您需要登入才能使用此系統',
    BUTTON: '點擊登入'
  }
} as const;

export type AppTexts = typeof APP_TEXTS;
