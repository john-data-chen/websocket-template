'use client';

import { DIALOG_TEXTS } from '@/constants/dialogTexts';
import { usernameSchema } from '@/lib/validation';
import { useSessionStore } from '@/stores/useSessionStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from './ui/form';
import { Input } from './ui/input';

const formSchema = z.object({
  username: usernameSchema
});

type FormValues = z.infer<typeof formSchema>;

interface UsernameDialogProps {
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onUsernameSet?: (username: string) => void;
}

export function UsernameDialog({
  open: controlledOpen,
  onOpenChange,
  onUsernameSet
}: Readonly<UsernameDialogProps>) {
  const { user, login } = useSessionStore();
  const [isControlled] = useState(controlledOpen !== undefined);
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: ''
    }
  });

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!isControlled) {
        setInternalOpen(open);
      }
      onOpenChange?.(open);
    },
    [isControlled, onOpenChange]
  );

  useEffect(() => {
    if (!isControlled && !user?.name) {
      handleOpenChange(true);
    } else if (user?.name && onUsernameSet) {
      onUsernameSet(user.name);
    }
  }, [user?.name, onUsernameSet, isControlled, handleOpenChange]);

  const onSubmit = (values: FormValues) => {
    const trimmedUsername = values.username.trim();
    login(trimmedUsername);
    handleOpenChange(false);
    onUsernameSet?.(trimmedUsername);
  };

  return (
    <div data-testid="username-dialog">
      <Dialog
        open={isOpen}
        onOpenChange={handleOpenChange}
        aria-label="Username dialog"
      >
        <DialogContent className="sm:max-w-[425px] p-6 rounded-2xl w-full max-w-[90vw]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  {DIALOG_TEXTS.WELCOME.TITLE}
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  {DIALOG_TEXTS.WELCOME.DESCRIPTION}
                </DialogDescription>
              </DialogHeader>

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">
                      {DIALOG_TEXTS.WELCOME.LABEL}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={DIALOG_TEXTS.WELCOME.PLACEHOLDER}
                        autoComplete="username"
                        {...field}
                        className="form-element"
                        data-testid="username-input"
                        aria-required="true"
                        aria-label="Enter your username"
                      />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  data-testid="confirm-username-button"
                  aria-label="Confirm username"
                >
                  {DIALOG_TEXTS.WELCOME.BUTTON}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
