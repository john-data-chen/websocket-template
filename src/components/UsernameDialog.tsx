'use client';

import { useSessionStore } from '@/stores/useSessionStore';
import { useCallback, useEffect, useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { Label } from './ui/label';

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
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const { username, setUsername } = useSessionStore();

  // If it's controlled mode, use the external open state
  const isControlled = controlledOpen !== undefined;

  // If it's non-controlled mode, use internal state
  const [internalOpen, setInternalOpen] = useState(false);

  // Merge controlled and non-controlled open states
  const isOpen = isControlled ? controlledOpen : internalOpen;

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
    // If there is no username, show the dialog (only in non-controlled mode)
    if (!isControlled && !username) {
      handleOpenChange(true);
    } else if (username && onUsernameSet) {
      onUsernameSet(username);
    }
  }, [username, onUsernameSet, isControlled, handleOpenChange]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setError('請輸入您的名字');
      return;
    }

    // Use zustand to set username
    setUsername(inputValue);
    handleOpenChange(false);
    setError('');

    if (onUsernameSet) {
      onUsernameSet(inputValue);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-6 rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>歡迎使用</DialogTitle>
            <DialogDescription>請輸入您的名字以繼續使用系統</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="username"
                className="text-right font-medium text-gray-800"
              >
                名字
              </Label>
              <div className="col-span-3">
                <div className="relative">
                  <input
                    id="username"
                    value={inputValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setInputValue(e.target.value);
                      if (error) setError('');
                    }}
                    className={`w-full px-4 py-2 text-base font-medium text-gray-800 bg-white border-[1.5px] ${error ? 'border-red-500' : 'border-slate-300'} rounded-input focus:outline-none focus:border-blue-500 focus:shadow-[0_0_6px_2px_rgba(59,130,246,0.4)] disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed transition-all duration-200 ease-in-out`}
                    placeholder="請輸入您的名字"
                    autoComplete="off"
                  />
                </div>
                {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-input transition-colors duration-200"
            >
              確認
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
