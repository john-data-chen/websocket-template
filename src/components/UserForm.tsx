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
import { FORM_ATTRIBUTES } from '@/constants/formAttribute';
import { WEBSOCKET_URL } from '@/constants/websocket';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useIsMobileScreen } from '@/hooks/useIsMobileScreen';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  descriptionSchema,
  emailSchema,
  isActiveSchema,
  nameSchema
} from '@/lib/validation';
import { useSessionStore } from '@/stores/useSessionStore';
import type { User } from '@/types/user';
import type { WebSocketMessage } from '@/types/websocket';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  isActive: isActiveSchema,
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
        // Ensure unique user names and exclude current user
        const uniqueUsers = Array.from(new Set(message.payload.users));
        const otherUsers = uniqueUsers.filter(
          (userName: string) =>
            userName !== currentUser?.name && userName.trim() !== ''
        );

        console.log('Other users editing (unique):', otherUsers);

        // Ensure no duplicate keys by using index as part of the key if needed
        setEditingUsers(otherUsers);

        // Show or update Toast notification
        if (otherUsers.length > 0) {
          const notificationMessage = `${FORM_ATTRIBUTES.NOTIFICATIONS.EDITING_USERS}${otherUsers.join(', ')}`;
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

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues
  });

  // Use form draft hook
  const { loadDraft, clearDraft, debouncedSaveDraft } = useFormDraft({
    form,
    key: user ? `user_draft_${user.id}` : 'user_draft_new'
  });

  // Track if we've sent a stop_editing message to prevent duplicates
  const hasSentStopMessage = useRef(false);

  // When the form opens/closes, send corresponding WebSocket messages
  useEffect(() => {
    if (!user?.id) return;

    if (open) {
      // Reset the flag when opening the form
      hasSentStopMessage.current = false;

      const message = {
        type: 'start_editing' as const,
        payload: {
          recordId: user.id,
          userName: currentUser?.name ?? FORM_ATTRIBUTES.DEFAULTS.ANONYMOUS
        }
      };

      console.log(
        '[WebSocket] Sending message:',
        JSON.stringify(message, null, 2)
      );

      sendMessage(message);
    } else if (!hasSentStopMessage.current) {
      // Only send stop_editing if we haven't sent it yet
      hasSentStopMessage.current = true;

      const message = {
        type: 'stop_editing' as const,
        payload: {
          recordId: user.id,
          userName: currentUser?.name ?? FORM_ATTRIBUTES.DEFAULTS.ANONYMOUS
        }
      };

      console.log(
        '[WebSocket] Sending message:',
        JSON.stringify(message, null, 2)
      );

      sendMessage(message);
      setEditingUsers([]);
    }

    // Cleanup function to send stop_editing when component unmounts
    return () => {
      if (open && user?.id && !hasSentStopMessage.current) {
        hasSentStopMessage.current = true;
        const message = {
          type: 'stop_editing' as const,
          payload: {
            recordId: user.id,
            userName: currentUser?.name ?? FORM_ATTRIBUTES.DEFAULTS.ANONYMOUS
          }
        };

        console.log(
          '[WebSocket] Cleanup - Sending message:',
          JSON.stringify(message, null, 2)
        );

        sendMessage(message);
      }

      // Clear any pending draft saves
      debouncedSaveDraft.cancel();

      // Dismiss any active toast notifications
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, [open, user?.id, currentUser?.name, sendMessage, debouncedSaveDraft]);

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
            {user
              ? FORM_ATTRIBUTES.EDIT_USER_TITLE
              : FORM_ATTRIBUTES.ADD_USER_TITLE}
          </DialogTitle>
          <DialogDescription>
            {user
              ? FORM_ATTRIBUTES.EDIT_USER_DESCRIPTION
              : FORM_ATTRIBUTES.ADD_USER_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
            data-testid="user-form"
            aria-label="User form"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                data-testid="user-form-name"
                aria-label="User name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {FORM_ATTRIBUTES.FIELDS.NAME.LABEL}{' '}
                      <span className="text-red-500">
                        {FORM_ATTRIBUTES.FIELDS.NAME.REQUIRED}
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        className={`form-element ${
                          form.formState.errors.name ? 'border-red-500' : ''
                        }`}
                        placeholder={
                          isMobile
                            ? FORM_ATTRIBUTES.FIELDS.NAME.MOBILE_PLACEHOLDER
                            : FORM_ATTRIBUTES.FIELDS.NAME.PLACEHOLDER
                        }
                        aria-invalid={!!form.formState.errors.name}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage data-testid="name-error" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                data-testid="user-form-email"
                aria-label="User email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {FORM_ATTRIBUTES.FIELDS.EMAIL.LABEL}{' '}
                      <span className="text-red-500">
                        {FORM_ATTRIBUTES.FIELDS.EMAIL.REQUIRED}
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        className={`form-element ${
                          form.formState.errors.email ? 'border-red-500' : ''
                        }`}
                        placeholder={
                          isMobile
                            ? FORM_ATTRIBUTES.FIELDS.EMAIL.MOBILE_PLACEHOLDER
                            : FORM_ATTRIBUTES.FIELDS.EMAIL.PLACEHOLDER
                        }
                        type="email"
                        aria-invalid={!!form.formState.errors.email}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage data-testid="email-error" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              data-testid="user-form-is-active"
              aria-label="User is active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#cbd5e1] p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {FORM_ATTRIBUTES.FIELDS.STATUS.LABEL}
                    </FormLabel>
                    <FormDescription>
                      {field.value
                        ? FORM_ATTRIBUTES.FIELDS.STATUS.ACTIVE_DESCRIPTION
                        : FORM_ATTRIBUTES.FIELDS.STATUS.INACTIVE_DESCRIPTION}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {field.value
                          ? FORM_ATTRIBUTES.FIELDS.STATUS.ACTIVE
                          : FORM_ATTRIBUTES.FIELDS.STATUS.INACTIVE}
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
              data-testid="user-form-description"
              aria-label="User description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {FORM_ATTRIBUTES.FIELDS.DESCRIPTION.LABEL}{' '}
                    <span className="text-red-500">
                      {FORM_ATTRIBUTES.FIELDS.DESCRIPTION.REQUIRED}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        FORM_ATTRIBUTES.FIELDS.DESCRIPTION.PLACEHOLDER
                      }
                      className={`form-element min-h-[120px] ${
                        form.formState.errors.description
                          ? 'border-red-500'
                          : ''
                      }`}
                      aria-invalid={!!form.formState.errors.description}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage data-testid="description-error" />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                data-testid="cancel-button"
                aria-label="Cancel"
                onClick={() => onOpenChange(false)}
              >
                {FORM_ATTRIBUTES.BUTTONS.CANCEL}
              </Button>
              <Button
                type="submit"
                data-testid="submit-button"
                aria-label="Submit"
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
              >
                {user
                  ? FORM_ATTRIBUTES.BUTTONS.UPDATE
                  : FORM_ATTRIBUTES.BUTTONS.SUBMIT}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
