'use client';

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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onUsernameSet?: (username: string) => void;
}

export function UsernameDialog({
  open: controlledOpen,
  onOpenChange,
  onUsernameSet
}: UsernameDialogProps) {
  const { username, setUsername } = useSessionStore();
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
    if (!isControlled && !username) {
      handleOpenChange(true);
    } else if (username && onUsernameSet) {
      onUsernameSet(username);
    }
  }, [username, onUsernameSet, isControlled, handleOpenChange]);

  const onSubmit = (values: FormValues) => {
    const trimmedUsername = values.username.trim();
    setUsername(trimmedUsername);
    handleOpenChange(false);
    onUsernameSet?.(trimmedUsername);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-6 rounded-2xl w-full max-w-[90vw]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">歡迎使用</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                請輸入您的名字以繼續使用系統
              </DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">名字</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="請輸入您的名字"
                      autoComplete="off"
                      {...field}
                      className="form-element"
                    />
                  </FormControl>
                  <FormMessage className="text-xs sm:text-sm" />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" className="w-full sm:w-auto">
                確認
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
