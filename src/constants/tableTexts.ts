export const TABLE_TEXTS = {
  // Page Title
  PAGE_TITLE: '使用者管理',

  // Buttons
  BUTTONS: {
    ADD_USER: '新增使用者',
    EDIT: '編輯',
    DELETE: '刪除',
    CONFIRM_DELETE: '確認刪除',
    CANCEL: '取消'
  },

  // Table Headers
  HEADERS: {
    NAME: '姓名',
    EMAIL: '電子郵件',
    STATUS: '狀態',
    DESCRIPTION: '描述',
    ACTIONS: '操作'
  },

  // Status Badges
  STATUS: {
    ACTIVE: '啟用',
    INACTIVE: '停用'
  },

  // Delete Dialog
  DELETE_DIALOG: {
    TITLE: '確認刪除',
    DESCRIPTION: '確定要刪除使用者嗎？此操作無法復原。'
  },

  // Accessibility
  ARIA_LABELS: {
    DELETE: '刪除',
    EDIT: '編輯'
  }
} as const;

export type TableTexts = typeof TABLE_TEXTS;
