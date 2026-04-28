'use client'

import { useActionState, useRef, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import type { Database } from '@/lib/database.types'
import { ClubSilhouette } from '@/components/ui/ClubSilhouette'
import { uploadClubAsset, type ClubAssetKind } from '@/lib/storage'
import { updateMyClub } from '@/app/actions/admin-club'

type ClubRow = Database['public']['Tables']['clubs']['Row']

export type ClubProfileInitial = Pick<
  ClubRow,
  | 'id'
  | 'slug'
  | 'name'
  | 'city'
  | 'region'
  | 'logo_url'
  | 'hero_photo_url'
  | 'history_text'
  | 'gallery_urls'
>

interface Props {
  initialClub: ClubProfileInitial
}

const HISTORY_MAX = 4000
const GALLERY_MAX = 12

export function ClubProfileForm({ initialClub }: Props) {
  const [logoUrl, setLogoUrl] = useState(initialClub.logo_url ?? '')
  const [heroUrl, setHeroUrl] = useState(initialClub.hero_photo_url ?? '')
  const [historyText, setHistoryText] = useState(initialClub.history_text ?? '')
  const [galleryUrls, setGalleryUrls] = useState<string[]>(initialClub.gallery_urls ?? [])

  const [state, formAction] = useActionState(updateMyClub, null)

  const cityLine = [initialClub.city, initialClub.region].filter(Boolean).join(', ')
  const overLimit = historyText.length > HISTORY_MAX

  return (
    <form action={formAction} className="space-y-8">
      {/* Read-only header */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground-faint">
              Editing
            </p>
            <h2 className="mt-1 truncate font-serif text-2xl font-semibold tracking-tight text-foreground">
              {initialClub.name}
            </h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              {cityLine || 'Region not set'} · /clubs/{initialClub.slug}
            </p>
          </div>
          <Link
            href={`/clubs/${initialClub.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground-secondary transition-colors hover:bg-elevated hover:text-foreground"
          >
            View public page ↗
          </Link>
        </div>
        <p className="mt-4 text-xs text-foreground-faint">
          Identity fields (name, slug, city, region) are managed by the platform team. Reach out if
          they need to change.
        </p>
      </section>

      {/* Status banner */}
      {state && !state.ok && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          {state.error}
          {state.issues && (
            <ul className="mt-2 list-disc pl-5 text-xs">
              {Object.entries(state.issues).map(([k, v]) => (
                <li key={k}>
                  <strong>{k}:</strong> {(v as string[]).join(', ')}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {state && state.ok && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
          Saved. Public page reflects your changes.
        </div>
      )}

      {/* Logo */}
      <Section title="Logo" hint="Square image, ≥256px. JPG, PNG or WebP. Max 2MB.">
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background">
            {logoUrl ? (
              <Image src={logoUrl} alt="Logo preview" fill sizes="96px" className="object-cover" />
            ) : (
              <ClubSilhouette className="h-12 w-12 text-primary/40" />
            )}
          </div>
          <SingleAssetButton
            kind="logo"
            slug={initialClub.slug}
            currentUrl={logoUrl}
            onUploaded={(url) => setLogoUrl(url)}
            onClear={() => setLogoUrl('')}
            label="logo"
          />
        </div>
        <input type="hidden" name="logo_url" value={logoUrl} />
      </Section>

      {/* Hero photo */}
      <Section
        title="Hero photo"
        hint="Wide image, ≥1600×900 recommended. JPG, PNG or WebP. Max 5MB."
      >
        <div className="space-y-4">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-elevated">
            {heroUrl ? (
              <Image
                src={heroUrl}
                alt="Hero preview"
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-foreground-faint">
                No hero photo set.
              </div>
            )}
          </div>
          <SingleAssetButton
            kind="hero"
            slug={initialClub.slug}
            currentUrl={heroUrl}
            onUploaded={(url) => setHeroUrl(url)}
            onClear={() => setHeroUrl('')}
            label="hero photo"
          />
        </div>
        <input type="hidden" name="hero_photo_url" value={heroUrl} />
      </Section>

      {/* History */}
      <Section
        title="History"
        hint="Tell scouts about your club's history, philosophy, and what makes you distinct."
      >
        <textarea
          name="history_text"
          rows={8}
          value={historyText}
          onChange={(e) => setHistoryText(e.target.value)}
          placeholder="Founded in 1996, our academy has produced…"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground placeholder-foreground-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div
          className={`mt-2 text-xs ${overLimit ? 'text-danger' : 'text-foreground-faint'}`}
          aria-live="polite"
        >
          {historyText.length.toLocaleString()} / {HISTORY_MAX.toLocaleString()}
        </div>
      </Section>

      {/* Gallery */}
      <Section
        title="Gallery"
        hint={`Up to ${GALLERY_MAX} photos. JPG, PNG or WebP. Max 5MB each.`}
      >
        <GalleryEditor slug={initialClub.slug} urls={galleryUrls} onChange={setGalleryUrls} />
        <input type="hidden" name="gallery_urls" value={JSON.stringify(galleryUrls)} />
      </Section>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
        <DiscardButton
          onClick={() => {
            setLogoUrl(initialClub.logo_url ?? '')
            setHeroUrl(initialClub.hero_photo_url ?? '')
            setHistoryText(initialClub.history_text ?? '')
            setGalleryUrls(initialClub.gallery_urls ?? [])
          }}
        />
        <SubmitButton disabled={overLimit} />
      </div>
    </form>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <header className="mb-4">
        <h3 className="font-serif text-lg font-semibold tracking-tight text-foreground">{title}</h3>
        {hint && <p className="mt-1 text-xs text-foreground-faint">{hint}</p>}
      </header>
      {children}
    </section>
  )
}

function SingleAssetButton({
  kind,
  slug,
  currentUrl,
  onUploaded,
  onClear,
  label,
}: {
  kind: Exclude<ClubAssetKind, 'gallery'>
  slug: string
  currentUrl: string
  onUploaded: (url: string) => void
  onClear: () => void
  label: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    const result = await uploadClubAsset(file, slug, kind)
    setUploading(false)
    if (e.target) e.target.value = ''
    if (!result.ok) {
      setError(result.error)
      return
    }
    onUploaded(result.data.url)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : currentUrl ? `Replace ${label}` : `Upload ${label}`}
      </button>
      {currentUrl && !uploading && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-transparent px-3 py-2 text-xs font-medium text-foreground-secondary transition-colors hover:text-danger"
        >
          Remove
        </button>
      )}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}

function GalleryEditor({
  slug,
  urls,
  onChange,
}: {
  slug: string
  urls: string[]
  onChange: (next: string[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setError(null)
    if (e.target) e.target.value = ''

    const remaining = GALLERY_MAX - urls.length
    if (remaining <= 0) {
      setError(`Gallery is full (${GALLERY_MAX} max).`)
      return
    }
    const slice = files.slice(0, remaining)

    setUploading(true)
    const results = await Promise.all(slice.map((f) => uploadClubAsset(f, slug, 'gallery')))
    setUploading(false)

    const uploaded: string[] = []
    const errors: string[] = []
    for (const r of results) {
      if (r.ok) uploaded.push(r.data.url)
      else errors.push(r.error)
    }
    if (errors.length > 0) setError(errors[0]!)
    if (uploaded.length > 0) onChange([...urls, ...uploaded])
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...urls]
    const swap = index + direction
    if (swap < 0 || swap >= next.length) return
    ;[next[index], next[swap]] = [next[swap]!, next[index]!]
    startTransition(() => onChange(next))
  }

  function remove(index: number) {
    const next = urls.filter((_, i) => i !== index)
    startTransition(() => onChange(next))
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || urls.length >= GALLERY_MAX}
          className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Add photos'}
        </button>
        <span className="text-xs text-foreground-faint">
          {urls.length} / {GALLERY_MAX}
        </span>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>

      {urls.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-elevated px-6 py-10 text-center text-sm text-foreground-faint">
          No photos yet. Add up to {GALLERY_MAX} to showcase your facilities and matches.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {urls.map((url, idx) => (
            <li
              key={url}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-elevated"
            >
              <Image
                src={url}
                alt={`Gallery ${idx + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-between text-xs opacity-0 transition-opacity group-hover:opacity-100">
                <div className="pointer-events-auto flex gap-1">
                  <IconButton
                    label="Move left"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0 || pending}
                  >
                    ←
                  </IconButton>
                  <IconButton
                    label="Move right"
                    onClick={() => move(idx, 1)}
                    disabled={idx === urls.length - 1 || pending}
                  >
                    →
                  </IconButton>
                </div>
                <IconButton
                  label="Remove"
                  onClick={() => remove(idx)}
                  disabled={pending}
                  variant="danger"
                >
                  ×
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  variant = 'default',
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'danger'
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold backdrop-blur transition-colors disabled:opacity-40 ${
        variant === 'danger'
          ? 'bg-danger/85 text-white hover:bg-danger'
          : 'bg-white/85 text-foreground hover:bg-white'
      }`}
    >
      {children}
    </button>
  )
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-btn-primary-text transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  )
}

function DiscardButton({ onClick }: { onClick: () => void }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground-secondary transition-colors hover:text-foreground disabled:opacity-50"
    >
      Discard changes
    </button>
  )
}
