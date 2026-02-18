import { z } from 'zod'

export const contactRequestSchema = z.object({
  playerId: z.string().uuid(),
  message: z.string().min(10).max(1000),
})

export const playerSearchSchema = z.object({
  query: z.string().min(1).max(100),
})

export const playerFormSchema = z.object({
  name: z.string().min(2).max(100),
  name_ka: z.string().min(2).max(100),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  position: z.enum(['GK', 'DEF', 'MID', 'ATT', 'WNG', 'ST']),
  preferred_foot: z.enum(['Left', 'Right', 'Both']).optional(),
  height_cm: z.coerce.number().int().min(100).max(220).optional(),
  weight_kg: z.coerce.number().int().min(30).max(150).optional(),
  jersey_number: z.coerce.number().int().min(1).max(99).optional(),
  status: z.enum(['active', 'injured', 'transferred', 'inactive']).default('active'),
  scouting_report: z.string().max(5000).optional(),
  scouting_report_ka: z.string().max(5000).optional(),
  is_featured: z.boolean().default(false),
})

export const playerSkillsSchema = z.object({
  pace: z.coerce.number().int().min(1).max(100),
  shooting: z.coerce.number().int().min(1).max(100),
  passing: z.coerce.number().int().min(1).max(100),
  dribbling: z.coerce.number().int().min(1).max(100),
  defending: z.coerce.number().int().min(1).max(100),
  physical: z.coerce.number().int().min(1).max(100),
})

export const matchFormSchema = z.object({
  home_club_id: z.string().uuid(),
  away_club_id: z.string().uuid(),
  match_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  competition: z.string().min(1).max(200).optional(),
  venue: z.string().max(200).optional(),
  home_score: z.coerce.number().int().min(0).optional(),
  away_score: z.coerce.number().int().min(0).optional(),
  video_url: z.string().url().optional().or(z.literal('')),
  highlights_url: z.string().url().optional().or(z.literal('')),
  match_report: z.string().max(5000).optional(),
  match_report_ka: z.string().max(5000).optional(),
})

export const matchPlayerStatsSchema = z.object({
  player_id: z.string().uuid(),
  minutes_played: z.coerce.number().int().min(0).max(120).optional(),
  goals: z.coerce.number().int().min(0).default(0),
  assists: z.coerce.number().int().min(0).default(0),
  rating: z.coerce.number().min(1).max(10).optional(),
  pass_accuracy: z.coerce.number().min(0).max(100).optional(),
  shots: z.coerce.number().int().min(0).optional(),
  shots_on_target: z.coerce.number().int().min(0).optional(),
  tackles: z.coerce.number().int().min(0).optional(),
  interceptions: z.coerce.number().int().min(0).optional(),
  distance_km: z.coerce.number().min(0).max(20).optional(),
  sprints: z.coerce.number().int().min(0).optional(),
  top_speed_kmh: z.coerce.number().min(0).max(40).optional(),
})
