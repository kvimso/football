const SIZES = {
  sm: 'h-12 w-12',
  md: 'h-44 w-44',
  lg: 'h-56 w-56',
} as const

interface PlayerSilhouetteProps {
  size?: keyof typeof SIZES
  className?: string
}

export function PlayerSilhouette({ size = 'md', className = '' }: PlayerSilhouetteProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="currentColor"
      className={`${SIZES[size]} ${className}`}
      aria-hidden="true"
    >
      {/* Head */}
      <circle cx="60" cy="32" r="16" />
      {/* Body */}
      <path d="M38 58c0-4 4-10 22-10s22 6 22 10v6c0 2-1 4-3 5l-4 2v14l8 18c1 2 0 4-2 5h-10c-2 0-3-1-4-3l-7-16-7 16c-1 2-2 3-4 3H39c-2-1-3-3-2-5l8-18V71l-4-2c-2-1-3-3-3-5v-6Z" />
    </svg>
  )
}
