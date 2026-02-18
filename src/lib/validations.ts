import { z } from 'zod'

export const contactRequestSchema = z.object({
  playerId: z.string().uuid(),
  message: z.string().min(10).max(1000),
})

export const playerSearchSchema = z.object({
  query: z.string().min(1).max(100),
})

export const playerFormSchema = z.object({
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  first_name_ka: z.string().min(1).max(50),
  last_name_ka: z.string().min(1).max(50),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  position: z.enum(['GK', 'DEF', 'MID', 'ATT', 'WNG', 'ST']),
  preferred_foot: z.enum(['Left', 'Right', 'Both']).optional(),
  height_cm: z.coerce.number().int().min(100).max(220).optional(),
  weight_kg: z.coerce.number().int().min(30).max(150).optional(),
  parent_guardian_contact: z.string().max(200).optional(),
})
