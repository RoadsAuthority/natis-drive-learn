import { z } from "zod";

export const idNumberSchema = z.string().trim().regex(/^[0-9]{1,32}$/);

export const passwordSchema = z
  .string()
  .min(12)
  .max(72)
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72);

const personNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[\p{L}\p{M}][\p{L}\p{M} .'\-\u2019]*$/u);

export const registrationSchema = z
  .object({
    email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
    password: passwordSchema,
    first_name: personNameSchema,
    surname: personNameSchema,
    id_number: idNumberSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    idNumber: idNumberSchema,
    password: z.string().min(1).max(72).refine((value) => Buffer.byteLength(value, "utf8") <= 72),
  })
  .strict();