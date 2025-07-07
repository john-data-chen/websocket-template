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
import { FORM_TEXTS } from '@/constants/formTexts';
import { WEBSOCKET_URL, type WebSocketMessage } from '@/constants/websocket';
import { useIsMobileScreen } from '@/hooks/useIsMobileScreen';
import { useWebSocket } from '@/hooks/useWebSocket';
import { descriptionSchema, emailSchema, nameSchema } from '@/lib/validation';
import { useSessionStore } from '@/stores/useSessionStore';
import type { User } from '@/types/user';
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
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly user: User | null;
  readonly onSubmit: (data: UserFormValues) => void;
}

export default function UserForm({
  open,
  onOpenChange,
  user,
  onSubmit
}: UserFormProps) {
  const { user: currentUser } = useSessionStore();
  // Track other users who are editing
  const [editingUsers, setEditingUsers] = useState<readonly string[]>([]);
  // Currently only used for WebSocket updates, the variable itself is not used directly
  void editingUsers;
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
          (u: string) => u !== currentUser?.name
        );
        console.log('Other users editing:', otherUsers);

        setEditingUsers(otherUsers);

        // Show or update Toast notification
        if (otherUsers.length > 0) {
          const notificationMessage = `${FORM_TEXTS.NOTIFICATIONS.EDITING_USERS}${otherUsers.join(', ')}`;
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
    [user?.id, currentUser?.name]
  );

  // WebSocket connection
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
          userName: currentUser?.name ?? FORM_TEXTS.DEFAULTS.ANONYMOUS
        }
      });
    } else {
      // Send stop editing message
      sendMessage({
        type: 'stop_editing',
        payload: {
          recordId: user.id,
          userName: currentUser?.name ?? FORM_TEXTS.DEFAULTS.ANONYMOUS
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
            userName: currentUser?.name ?? FORM_TEXTS.DEFAULTS.ANONYMOUS
          }
        });
      }
    };
  }, [open, user?.id, currentUser?.name, sendMessage]);

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
          <DialogTitle>
            {user ? FORM_TEXTS.EDIT_USER_TITLE : FORM_TEXTS.ADD_USER_TITLE}
          </DialogTitle>
          <DialogDescription>
            {user
              ? FORM_TEXTS.EDIT_USER_DESCRIPTION
              : FORM_TEXTS.ADD_USER_DESCRIPTION}
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
                      {FORM_TEXTS.FIELDS.NAME.LABEL}{' '}
                      <span className="text-red-500">
                        {FORM_TEXTS.FIELDS.NAME.REQUIRED}
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="form-element"
                        placeholder={
                          isMobile
                            ? FORM_TEXTS.FIELDS.NAME.MOBILE_PLACEHOLDER
                            : FORM_TEXTS.FIELDS.NAME.PLACEHOLDER
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
                      {FORM_TEXTS.FIELDS.EMAIL.LABEL}{' '}
                      <span className="text-red-500">
                        {FORM_TEXTS.FIELDS.EMAIL.REQUIRED}
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="form-element"
                        placeholder={
                          isMobile
                            ? FORM_TEXTS.FIELDS.EMAIL.MOBILE_PLACEHOLDER
                            : FORM_TEXTS.FIELDS.EMAIL.PLACEHOLDER
                        }
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
                    <FormLabel className="text-base">
                      {FORM_TEXTS.FIELDS.STATUS.LABEL}
                    </FormLabel>
                    <FormDescription>
                      {field.value
                        ? FORM_TEXTS.FIELDS.STATUS.ACTIVE_DESCRIPTION
                        : FORM_TEXTS.FIELDS.STATUS.INACTIVE_DESCRIPTION}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {field.value
                          ? FORM_TEXTS.FIELDS.STATUS.ACTIVE
                          : FORM_TEXTS.FIELDS.STATUS.INACTIVE}
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
                    {FORM_TEXTS.FIELDS.DESCRIPTION.LABEL}{' '}
                    <span className="text-red-500">
                      {FORM_TEXTS.FIELDS.DESCRIPTION.REQUIRED}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={FORM_TEXTS.FIELDS.DESCRIPTION.PLACEHOLDER}
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
                data-testid="cancel-button"
                onClick={() => onOpenChange(false)}
              >
                {FORM_TEXTS.BUTTONS.CANCEL}
              </Button>
              <Button
                type="submit"
                data-testid="submit-button"
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
              >
                {user ? FORM_TEXTS.BUTTONS.UPDATE : FORM_TEXTS.BUTTONS.SUBMIT}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
