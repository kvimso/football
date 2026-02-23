interface ClubSilhouetteProps {
  className?: string
}

export function ClubSilhouette({ className = 'h-12 w-12' }: ClubSilhouetteProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Shield outline */}
      <path d="M60 8L16 28v32c0 28 18 44 44 52 26-8 44-24 44-52V28L60 8Zm0 8l36 16v28c0 24-14 38-36 44-22-6-36-20-36-44V32l36-16Z" />
      {/* Football icon inside */}
      <circle cx="60" cy="62" r="16" opacity="0.3" />
      <path d="M60 50l4 7h8l-4 7 4 7h-8l-4 7-4-7h-8l4-7-4-7h8l4-7Z" opacity="0.3" />
    </svg>
  )
}
