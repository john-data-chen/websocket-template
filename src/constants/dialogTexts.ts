export const DIALOG_TEXTS = {
  // Welcome Dialog
  WELCOME: {
    TITLE: '歡迎使用',
    DESCRIPTION: '請輸入您的名字以繼續使用系統',
    LABEL: '名字',
    PLACEHOLDER: '請輸入您的名字',
    BUTTON: '確認'
  }
} as const;

export type DialogTexts = typeof DIALOG_TEXTS;
