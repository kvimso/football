export interface FeaturedPlayer {
  id: string
  name: string
  name_ka: string
  position: string
  date_of_birth: string
  photo_url: string | null
  club: { name: string; name_ka: string } | null
}

export interface FeaturedClub {
  id: string
  name: string
  name_ka: string
  slug: string
  logo_url: string | null
}
