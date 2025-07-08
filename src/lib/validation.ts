import { FORM_ATTRIBUTES } from '@/constants/formAttribute';
import { z } from 'zod';

export const nameSchema = z
  .string()
  .min(2, { message: FORM_ATTRIBUTES.FIELDS.NAME.REMINDER })
  .max(10, { message: FORM_ATTRIBUTES.FIELDS.NAME.REMINDER });

export const emailSchema = z
  .string()
  .min(1, { message: FORM_ATTRIBUTES.FIELDS.EMAIL.REMINDER })
  .email({ message: FORM_ATTRIBUTES.FIELDS.EMAIL.REMINDER });

export const descriptionSchema = z
  .string()
  .min(5, { message: FORM_ATTRIBUTES.FIELDS.DESCRIPTION.REMINDER })
  .max(200, { message: FORM_ATTRIBUTES.FIELDS.DESCRIPTION.REMINDER });
