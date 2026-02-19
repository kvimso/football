import { z } from 'zod'

export const contactRequestSchema = z.object({
  playerId: z.string().uuid(),
  message: z.string().min(10).max(1000),
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

export const inviteAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  clubId: z.string().uuid('Invalid club ID'),
})

export const clubFormSchema = z.object({
  name: z.string().min(1).max(100),
  name_ka: z.string().min(1).max(100),
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  description_ka: z.string().max(2000).optional(),
  website: z.string().url().max(200).optional().or(z.literal('')),
})

export const platformPlayerFormSchema = playerFormSchema.extend({
  club_id: z.string().uuid().optional().or(z.literal('')),
  status: z.enum(['active', 'free_agent']).optional(),
})
