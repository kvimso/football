import { z } from 'zod'
import { AGE_GROUPS, DEMO_ROLES } from '@/lib/constants'

export const uuidSchema = z.string().uuid()

export const contactRequestSchema = z.object({
  playerId: z.string().uuid(),
  message: z.string().min(10).max(1000),
})

export const responseMessageSchema = z.string().max(500).optional()

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

export const leagueFormSchema = z.object({
  name: z.string().min(1).max(200),
  name_ka: z.string().min(1).max(200),
  age_group: z.enum(AGE_GROUPS),
  season: z
    .string()
    .min(1)
    .max(20)
    .regex(/^\d{4}-\d{2}$/, 'Must be YYYY-YY format'),
  starlive_url: z
    .string()
    .url()
    .max(500)
    .refine((url) => url.startsWith('https://'), 'URL must use HTTPS'),
  description: z.string().max(2000).optional().or(z.literal('')),
  description_ka: z.string().max(2000).optional().or(z.literal('')),
  logo_url: z.string().url().max(500).optional().or(z.literal('')),
  is_active: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
})

export const demoRequestFormSchema = z.object({
  full_name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  organization: z.string().min(1).max(200),
  role: z.enum(DEMO_ROLES),
  country: z.string().min(1).max(100),
  message: z.string().max(2000).optional().or(z.literal('')),
})

export const contactMessageSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
})

export const platformPlayerFormSchema = playerFormSchema.extend({
  club_id: z.string().uuid().optional().or(z.literal('')),
  status: z.enum(['active', 'free_agent']).optional(),
})

// Chat system validations
export const createConversationSchema = z.object({
  club_id: z.string().uuid(),
})

export const sendMessageSchema = z
  .object({
    conversation_id: z.string().uuid(),
    content: z.string().min(1).max(5000).optional(),
    message_type: z.enum(['text', 'file', 'player_ref']),
    file_url: z
      .string()
      .min(1)
      .refine(
        (val) => val.startsWith('chat-attachments/') || val.includes('.supabase.co/storage/'),
        'File URL must be a valid storage path'
      )
      .optional(),
    file_name: z.string().max(255).optional(),
    file_type: z.string().max(100).optional(),
    file_size_bytes: z
      .number()
      .int()
      .positive()
      .max(10 * 1024 * 1024)
      .optional(),
    referenced_player_id: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      if (data.message_type === 'text') return !!data.content
      if (data.message_type === 'file') return !!data.file_url && !!data.file_name
      if (data.message_type === 'player_ref') return !!data.referenced_player_id
      return false
    },
    { message: 'Missing required fields for message type' }
  )

// Validate Realtime payload from Supabase (untrusted data)
export const realtimeMessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  sender_id: z.string().uuid().nullable(),
  content: z.string().nullable(),
  message_type: z.enum(['text', 'file', 'player_ref', 'system']),
  file_url: z.string().nullable(),
  file_name: z.string().nullable(),
  file_size_bytes: z.number().nullable(),
  file_type: z.string().nullable(),
  referenced_player_id: z.string().uuid().nullable(),
  read_at: z.string().nullable(),
  created_at: z.string(),
})

// Validate Realtime UPDATE payload (e.g. read_at changes)
export const realtimeMessageUpdateSchema = z.object({
  id: z.string().uuid(),
  read_at: z.string().nullable(),
})

export const loadMessagesSchema = z.object({
  conversation_id: z.string().uuid(),
  before: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

// Camera integration - mapping schemas
export const playerMappingSchema = z.object({
  player_id: z.string().uuid('Invalid player ID'),
  starlive_player_id: z.coerce
    .number()
    .int()
    .positive('Starlive player ID must be a positive integer')
    .max(2147483647),
  starlive_team_id: z.coerce.number().int().positive().max(2147483647).optional().nullable(),
  club_id: z.string().uuid().optional().nullable(),
  jersey_number: z
    .string()
    .max(10)
    .regex(/^[0-9A-Za-z-]*$/, 'Alphanumeric only')
    .optional()
    .nullable(),
})

export const clubMappingSchema = z.object({
  club_id: z.string().uuid('Invalid club ID'),
  starlive_team_name: z.string().min(1, 'Team name is required').max(200).trim(),
  starlive_team_id: z.coerce.number().int().positive().max(2147483647).optional().nullable(),
})
