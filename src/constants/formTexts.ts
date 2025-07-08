export const FORM_TEXTS = {
  // Form Titles
  EDIT_USER_TITLE: '編輯使用者',
  ADD_USER_TITLE: '新增使用者',
  EDIT_USER_DESCRIPTION: '編輯使用者資訊表單',
  ADD_USER_DESCRIPTION: '新增使用者資訊表單',

  // Form Fields
  FIELDS: {
    NAME: {
      LABEL: '姓名',
      PLACEHOLDER: '請輸入姓名 (2-10 字元)',
      MOBILE_PLACEHOLDER: '2-10 字元',
      REQUIRED: '*',
      REMINDER: '此欄位必填，目前長度不符合 2-10 字元'
    },
    EMAIL: {
      LABEL: '電子郵件',
      PLACEHOLDER: '請輸入電子郵件',
      MOBILE_PLACEHOLDER: '電子郵件',
      REQUIRED: '*',
      REMINDER: '此欄位必填，目前不是有效的電子郵件格式'
    },
    STATUS: {
      LABEL: '帳號狀態',
      ACTIVE: '啟用',
      INACTIVE: '停用',
      ACTIVE_DESCRIPTION: '啟用中',
      INACTIVE_DESCRIPTION: '已停用'
    },
    DESCRIPTION: {
      LABEL: '描述',
      PLACEHOLDER: '請輸入描述 (5-200 字元)',
      REQUIRED: '*',
      REMINDER: '此欄位必填，目前長度不符合 5-200 字元'
    }
  },

  // Buttons
  BUTTONS: {
    CANCEL: '取消',
    SUBMIT: '新增',
    UPDATE: '更新',
    SAVE: '儲存'
  },

  // Notifications
  NOTIFICATIONS: {
    EDITING_USERS: '正在編輯的使⽤者：'
  },

  // Default Values
  DEFAULTS: {
    ANONYMOUS: 'anonymous'
  }
} as const;

export type FormTexts = typeof FORM_TEXTS;
