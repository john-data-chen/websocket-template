import { z } from 'zod';

export const nameSchema = z
  .string()
  .min(2, { message: '姓名至少需要 2 個字元' })
  .max(10, { message: '姓名最多 10 個字元' });

export const emailSchema = z
  .string()
  .min(1, { message: '請輸入電子郵件' })
  .email({ message: '請輸入有效的電子郵件地址' });

export const descriptionSchema = z
  .string()
  .min(5, { message: '描述至少需要 5 個字元' })
  .max(200, { message: '描述最多 200 個字元' });
