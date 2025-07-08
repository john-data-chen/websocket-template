import { FORM_TEXTS } from '@/constants/formTexts';
import { z } from 'zod';

export const nameSchema = z
  .string()
  .min(2, { message: FORM_TEXTS.FIELDS.NAME.REMINDER })
  .max(10, { message: FORM_TEXTS.FIELDS.NAME.REMINDER });

export const emailSchema = z
  .string()
  .min(1, { message: FORM_TEXTS.FIELDS.EMAIL.REMINDER })
  .email({ message: FORM_TEXTS.FIELDS.EMAIL.REMINDER });

export const descriptionSchema = z
  .string()
  .min(5, { message: FORM_TEXTS.FIELDS.DESCRIPTION.REMINDER })
  .max(200, { message: FORM_TEXTS.FIELDS.DESCRIPTION.REMINDER });
