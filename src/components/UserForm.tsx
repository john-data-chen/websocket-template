import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
import { Textarea } from '@/components/ui/textarea';
import { FORM_ATTRIBUTES } from '@/constants/formAttribute';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useIsMobileScreen } from '@/hooks/useIsMobileScreen';
import { useWebSocketEditing } from '@/hooks/useWebSocketEditing';
import {
  descriptionSchema,
  emailSchema,
  isActiveSchema,
  nameSchema
} from '@/lib/validation';
import { useSessionStore } from '@/stores/useSessionStore';
import type { User } from '@/types/user';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckIcon } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
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
  const isMobile = useIsMobileScreen();

  // WebSocket connection for editing status
  const { sendMessage, clearEditingNotification, hideToast } =
    useWebSocketEditing({
      recordId: user?.id?.toString() || null,
      currentUserName: currentUser?.name || null,
      onEditingUsersChange: () => {}
    });

  // Hide toast when the form is closed
  useEffect(() => {
    if (!open) {
      hideToast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Track if we've sent a stop_editing message to prevent duplicates
  const hasSentStopMessage = useRef(false);
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
      sendMessage(message);
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
        sendMessage(message);
      } else if (!user?.id) {
        // console.log('[UserForm] No user ID available, skipping stop_editing');
      } else if (hasSentStopMessage.current) {
        // console.log('[UserForm] stop_editing already sent, skipping');
      }

      // Clear any pending draft saves
      debouncedSaveDraft.cancel();

      // Clear any active notifications
      clearEditingNotification?.();
    };
  }, [
    open,
    user?.id,
    currentUser?.name,
    sendMessage,
    debouncedSaveDraft,
    clearEditingNotification
  ]);

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
              data-testid="user-form-status"
              aria-label="User status"
              render={({ field }) => (
                <FormItem className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div className="space-y-1 sm:col-span-1">
                    <FormLabel className="text-base font-medium text-foreground">
                      {FORM_ATTRIBUTES.FIELDS.STATUS.LABEL}
                    </FormLabel>
                    <FormDescription className="text-sm text-muted-foreground">
                      {field.value
                        ? FORM_ATTRIBUTES.FIELDS.STATUS.ACTIVE_DESCRIPTION
                        : FORM_ATTRIBUTES.FIELDS.STATUS.INACTIVE_DESCRIPTION}
                    </FormDescription>
                  </div>
                  <div className="sm:col-span-3">
                    <FormControl>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="form-element min-h-[44px] flex w-full items-center justify-between text-left text-foreground"
                            type="button"
                            aria-haspopup="true"
                            aria-expanded={open}
                          >
                            <span className="truncate">
                              {field.value
                                ? FORM_ATTRIBUTES.FIELDS.STATUS.ACTIVE
                                : FORM_ATTRIBUTES.FIELDS.STATUS.INACTIVE}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="ml-2 flex-shrink-0 text-muted-foreground"
                              aria-hidden="true"
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="w-[--radix-dropdown-menu-trigger-width] p-1.5 bg-background rounded-lg border border-border shadow-md font-sans text-base"
                          align="start"
                          sideOffset={4}
                        >
                          <DropdownMenuItem
                            className="flex items-center justify-between px-4 py-2.5 text-base text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors font-sans"
                            onClick={(e) => {
                              e.preventDefault();
                              field.onChange(true);
                            }}
                          >
                            <span className="truncate">
                              {FORM_ATTRIBUTES.FIELDS.STATUS.ACTIVE}
                            </span>
                            {field.value && (
                              <CheckIcon className="h-4 w-4 ml-2 flex-shrink-0 text-primary" />
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center justify-between px-4 py-2.5 text-base text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors font-sans"
                            onClick={(e) => {
                              e.preventDefault();
                              field.onChange(false);
                            }}
                          >
                            <span className="truncate">
                              {FORM_ATTRIBUTES.FIELDS.STATUS.INACTIVE}
                            </span>
                            {!field.value && (
                              <CheckIcon className="h-4 w-4 ml-2 flex-shrink-0 text-primary" />
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            <FormField
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
                {FORM_ATTRIBUTES.BUTTONS.SAVE}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
