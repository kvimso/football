import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClubSilhouette } from '@/components/ui/ClubSilhouette'
import { MessageAcademyButton } from '@/components/chat/MessageAcademyButton'
import { ClubAnnouncements } from '@/components/club/ClubAnnouncements'
import { ClubRosterFilter, type RosterPlayer } from '@/components/club/ClubRosterFilter'

interface ClubPageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 30

export async function generateMetadata({ params }: ClubPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: club } = await supabase
    .from('clubs')
    .select('name, city, region, description')
    .eq('slug', slug)
    .single()

  if (!club) return { title: 'Club Not Found · Binocly' }

  return {
    title: `${club.name} · Binocly`,
    description:
      club.description ??
      `${club.name} — academy in ${[club.city, club.region].filter(Boolean).join(', ') || 'Georgia'}. Browse the roster and message the academy.`,
  }
}

export default async function ClubPage({ params }: ClubPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const [clubResult, userResult] = await Promise.all([
    supabase
      .from('clubs')
      .select(
        `
        id, slug, name, logo_url, hero_photo_url, city, region,
        description, history_text, gallery_urls, website,
        players(id, slug, name, position, date_of_birth, photo_url, jersey_number, status),
        academy_announcements(id, content, created_at)
        `
      )
      .eq('slug', slug)
      .single(),
    supabase.auth.getUser(),
  ])

  const { data: club, error } = clubResult
  if (error || !club) notFound()

  const { user } = userResult.data
  let userRole: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role ?? null
  }

  const players: RosterPlayer[] = (club.players ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    position: p.position,
    date_of_birth: p.date_of_birth,
    photo_url: p.photo_url,
    jersey_number: p.jersey_number,
    status: p.status,
  }))

  const announcements = (club.academy_announcements ?? [])
    .slice(0, 5)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  const cityLine = [club.city, club.region]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(', ')

  const activeRoster = players.filter((p) => p.status !== 'free_agent')
  const historyParagraphs = club.history_text
    ? club.history_text
        .split(/\n\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : []
  const gallery = (club.gallery_urls ?? []).filter(Boolean)

  return (
    <div>
      {/* Hero band */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10">
          {club.hero_photo_url ? (
            <Image
              src={club.hero_photo_url}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(135deg,var(--surface-alt,var(--surface))_0%,var(--background)_60%,color-mix(in_oklab,var(--primary)_8%,var(--background))_100%)]" />
          )}
          {club.hero_photo_url && (
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background" />
          )}
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:pb-16 sm:pt-14">
          <Link
            href="/clubs"
            className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.16em] text-foreground-faint transition-colors hover:text-foreground"
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All clubs
          </Link>

          <div className="mt-8 flex flex-wrap items-end gap-6">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
              {club.logo_url ? (
                <Image
                  src={club.logo_url}
                  alt={`${club.name} logo`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <ClubSilhouette className="h-14 w-14 text-primary/40" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-4xl leading-[1.05] font-semibold tracking-tight text-foreground sm:text-5xl">
                {club.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-foreground-secondary">
                {cityLine && <span>{cityLine}</span>}
                {cityLine && club.website && <span aria-hidden>·</span>}
                {club.website && (
                  <a
                    href={club.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Website ↗
                  </a>
                )}
              </div>
              {user && userRole === 'scout' && (
                <div className="mt-5">
                  <MessageAcademyButton clubId={club.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        {/* Info row */}
        <div className="mb-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          <Stat label="Squad size" value={`${activeRoster.length}`} />
          <Stat label="Region" value={cityLine || '—'} />
          <Stat label="Founded" value="—" hint="TBD" />
        </div>

        {/* About + history */}
        {(club.description || historyParagraphs.length > 0) && (
          <section className="mb-14 grid gap-8 lg:grid-cols-[1fr_2fr]">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              About
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-foreground-secondary">
              {club.description && <p className="text-lg text-foreground">{club.description}</p>}
              {historyParagraphs.length > 0
                ? historyParagraphs.map((para, idx) => (
                    <p
                      key={idx}
                      className={
                        idx === 0
                          ? 'first-letter:font-serif first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-5xl first-letter:font-semibold first-letter:leading-none first-letter:text-primary'
                          : ''
                      }
                    >
                      {para}
                    </p>
                  ))
                : !club.description && (
                    <p className="text-foreground-faint">
                      This academy hasn't shared its story yet.
                    </p>
                  )}
            </div>
          </section>
        )}

        {/* Photo gallery */}
        {gallery.length > 0 && (
          <section className="mb-14">
            <h2 className="mb-6 font-serif text-2xl font-semibold tracking-tight text-foreground">
              Gallery
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {gallery.map((url, idx) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-elevated"
                >
                  <Image
                    src={url}
                    alt={`${club.name} photo ${idx + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Roster */}
        <ClubRosterFilter players={players} />

        {/* Announcements */}
        <ClubAnnouncements announcements={announcements} />
      </div>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-surface p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground-faint">
        {label}
      </p>
      <p className="mt-2 font-serif text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-foreground-faint">{hint}</p>}
    </div>
  )
}
