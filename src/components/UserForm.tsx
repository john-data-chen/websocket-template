import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { WEBSOCKET_URL } from '@/constants/websocket';
import { useIsMobileScreen } from '@/hooks/useIsMobileScreen';
import { useWebSocket } from '@/hooks/useWebSocket';
import { descriptionSchema, emailSchema, nameSchema } from '@/lib/validation';
import { useSessionStore } from '@/stores/useSessionStore';
import type { User } from '@/types/user';
import type { WebSocketMessage } from '@/types/websocket';
import { zodResolver } from '@hookform/resolvers/zod';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  isActive: z.boolean().default(true),
  description: descriptionSchema
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
  const { username } = useSessionStore();
  const [, setEditingUsers] = useState<string[]>([]);
  const toastIdRef = useRef<string | number | null>(null);
  const isMobile = useIsMobileScreen();

  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      console.log('Received WebSocket message:', message);

      if (
        message.type === 'editing_status_update' &&
        user?.id === message.payload.recordId
      ) {
        const otherUsers = message.payload.users.filter(
          (u: string) => u !== username
        );
        console.log('Other users editing:', otherUsers);

        setEditingUsers(otherUsers);

        // Show or update Toast notification
        if (otherUsers.length > 0) {
          const notificationMessage = `正在編輯的使⽤者：${otherUsers.join(', ')}`;
          console.log('Showing notification:', notificationMessage);

          if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
          }

          toastIdRef.current = toast(notificationMessage, {
            duration: Infinity,
            id: toastIdRef.current?.toString(),
            className: 'toast-error'
          });
        } else if (toastIdRef.current) {
          console.log('No other users editing, dismissing notification');
          toast.dismiss(toastIdRef.current);
          toastIdRef.current = null;
        }
      }
    },
    [user?.id, username]
  );

  // WebSocket 連接
  const { sendMessage } = useWebSocket(WEBSOCKET_URL, {
    onMessage: handleWebSocketMessage
  });
  const defaultValues = useMemo(
    () => ({
      name: '',
      email: '',
      isActive: true,
      description: ''
    }),
    []
  );

  // Generate draft key
  const draftKey = useMemo(
    () => (user ? `user_draft_${user.id}` : 'user_draft_new'),
    [user]
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues
  });

  // Save draft to localStorage
  const saveDraft = useCallback(
    (data: UserFormValues) => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    },
    [draftKey]
  );

  // Load draft from localStorage
  const loadDraft = useCallback(() => {
    try {
      const draft = localStorage.getItem(draftKey);
      return draft ? JSON.parse(draft) : null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [draftKey]);

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [draftKey]);

  // Debounced save function
  const debouncedSaveDraft = useMemo(
    () =>
      debounce((data: UserFormValues) => {
        saveDraft(data);
      }, 3000),
    [saveDraft]
  );

  // Listen to form changes and automatically save draft
  useEffect(() => {
    const subscription = form.watch((value) => {
      debouncedSaveDraft(value as UserFormValues);
    });
    return () => {
      subscription.unsubscribe();
      debouncedSaveDraft.cancel();
    };
  }, [form, debouncedSaveDraft]);

  // When the form opens/closes, send corresponding WebSocket messages
  useEffect(() => {
    if (!user?.id) return;

    if (open) {
      // Send start editing message
      sendMessage({
        type: 'start_editing',
        payload: {
          recordId: user.id,
          userName: username || 'anonymous'
        }
      });
    } else {
      // Send stop editing message
      sendMessage({
        type: 'stop_editing',
        payload: {
          recordId: user.id,
          userName: username || 'anonymous'
        }
      });

      // Clear editing users list
      setEditingUsers([]);

      // Close Toast notification
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    }

    return () => {
      // Send stop editing message when component unmounts
      if (user?.id) {
        sendMessage({
          type: 'stop_editing',
          payload: {
            recordId: user.id,
            userName: username || 'anonymous'
          }
        });
      }
    };
  }, [open, user?.id, username, sendMessage]);

  // When the form opens, reset the form and load the draft
  useEffect(() => {
    if (open) {
      const draft = loadDraft();

      if (draft) {
        // If there is a draft, use it first
        form.reset(draft);
      } else if (user) {
        // If there is no draft but there is user data, use user data
        form.reset({
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          description: user.description
        });
      } else {
        // If there is no user data, use default values
        form.reset(defaultValues);
      }
    }
  }, [open, user, form, loadDraft, defaultValues]);

  const handleSubmit = (data: UserFormValues) => {
    // Clear draft before submitting the form
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
          <DialogDescription>
            {user ? '編輯使用者資訊表單' : '新增使用者資訊表單'}
          </DialogDescription>
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
                      <Input
                        className="form-element"
                        placeholder={
                          isMobile ? '2-10 字元' : '請輸入姓名 (2-10 字元)'
                        }
                        {...field}
                      />
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
                        className="form-element"
                        placeholder={isMobile ? '電子郵件' : '請輸入電子郵件'}
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#cbd5e1] p-4">
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
                      className="form-element min-h-[120px]"
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
