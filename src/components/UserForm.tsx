import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { User } from '@/types/user';
import { zodResolver } from '@hookform/resolvers/zod';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: '姓名至少需要 2 個字元' })
    .max(10, { message: '姓名最多 10 個字元' }),
  email: z
    .string()
    .min(1, { message: '請輸入電子郵件' })
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: '請輸入有效的電子郵件地址'
    }),
  isActive: z.boolean().default(true),
  description: z
    .string()
    .min(5, { message: '描述至少需要 5 個字元' })
    .max(200, { message: '描述最多 200 個字元' })
});

type UserFormValues = {
  name: string;
  email: string;
  isActive: boolean;
  description: string;
};

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSubmit: (data: UserFormValues) => void;
}

export default function UserForm({
  open,
  onOpenChange,
  user,
  onSubmit
}: UserFormProps) {
  const defaultValues = useMemo(
    () => ({
      name: '',
      email: '',
      isActive: true,
      description: ''
    }),
    []
  );

  // 生成草稿的鍵名
  const draftKey = useMemo(
    () => (user ? `user_draft_${user.id}` : 'user_draft_new'),
    [user]
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues
  });

  // 儲存草稿到 localStorage
  const saveDraft = useCallback(
    (data: UserFormValues) => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(data));
      } catch (error) {
        console.error('儲存草稿失敗:', error);
      }
    },
    [draftKey]
  );

  // 從 localStorage 載入草稿
  const loadDraft = useCallback(() => {
    try {
      const draft = localStorage.getItem(draftKey);
      return draft ? JSON.parse(draft) : null;
    } catch (error) {
      console.error('載入草稿失敗:', error);
      return null;
    }
  }, [draftKey]);

  // 清除草稿
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.error('清除草稿失敗:', error);
    }
  }, [draftKey]);

  // 防抖的保存函數
  const debouncedSaveDraft = useMemo(
    () =>
      debounce((data: UserFormValues) => {
        saveDraft(data);
      }, 3000),
    [saveDraft]
  );

  // 監聽表單變化，自動保存草稿
  useEffect(() => {
    const subscription = form.watch((value) => {
      debouncedSaveDraft(value as UserFormValues);
    });
    return () => {
      subscription.unsubscribe();
      debouncedSaveDraft.cancel();
    };
  }, [form, debouncedSaveDraft]);

  // 當表單開啟時，重置表單並載入草稿
  useEffect(() => {
    if (open) {
      const draft = loadDraft();

      if (draft) {
        // 如果有草稿，優先使用草稿
        form.reset(draft);
      } else if (user) {
        // 沒有草稿但有使用者資料，使用使用者資料
        form.reset({
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          description: user.description
        });
      } else {
        // 新增使用者，使用預設值
        form.reset(defaultValues);
      }
    }
  }, [open, user, form, loadDraft, defaultValues]);

  const handleSubmit = (data: UserFormValues) => {
    // 提交表單前清除草稿
    clearDraft();
    onSubmit(data);
    if (!user) {
      form.reset(defaultValues);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{user ? '編輯使用者' : '新增使用者'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      姓名 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="請輸入姓名 (2-10 字元)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      電子郵件 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="請輸入電子郵件"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">帳號狀態</FormLabel>
                    <FormDescription>
                      {field.value ? '啟用中' : '已停用'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {field.value ? '啟用' : '停用'}
                      </span>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    描述 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="請輸入描述 (5-200 字元)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
              >
                {user ? '更新' : '新增'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
