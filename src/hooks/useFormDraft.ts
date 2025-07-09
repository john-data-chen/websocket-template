import { FORM_ATTRIBUTES } from '@/constants/formAttribute';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useMemo } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

interface UseFormDraftOptions<T extends FieldValues> {
  form: UseFormReturn<T>;
  key: string;
  debounceTime?: number;
}

export function useFormDraft<T extends FieldValues>({
  form,
  key,
  debounceTime = FORM_ATTRIBUTES.DEBOUNCE.DRAFT_SAVE
}: UseFormDraftOptions<T>) {
  // Save draft to localStorage
  const saveDraft = useCallback(
    (data: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    },
    [key]
  );

  // Load draft from localStorage
  const loadDraft = useCallback((): T | null => {
    try {
      const draft = localStorage.getItem(key);
      return draft ? JSON.parse(draft) : null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [key]);

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [key]);

  // Debounced save function
  const debouncedSaveDraft = useMemo(
    () =>
      debounce((data: T) => {
        saveDraft(data);
      }, debounceTime),
    [saveDraft, debounceTime]
  );

  // Listen to form changes and automatically save draft
  useEffect(() => {
    const subscription = form.watch((value) => {
      debouncedSaveDraft(value as T);
    });

    return () => {
      subscription.unsubscribe();
      debouncedSaveDraft.cancel();
    };
  }, [form, debouncedSaveDraft]);

  return {
    loadDraft,
    clearDraft,
    saveDraft,
    debouncedSaveDraft
  };
}
