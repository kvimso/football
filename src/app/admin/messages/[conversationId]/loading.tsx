export default function ConversationLoading() {
  return (
    <div className="flex h-[calc(100vh-64px)] flex-col animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="h-8 w-8 rounded-full bg-background-secondary" />
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-background-secondary" />
          <div className="h-4 w-32 rounded bg-background-secondary" />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 space-y-3 overflow-hidden px-4 py-6">
        <div className="flex items-center gap-3 py-2">
          <div className="h-px flex-1 bg-background-secondary" />
          <div className="h-3 w-16 rounded bg-background-secondary" />
          <div className="h-px flex-1 bg-background-secondary" />
        </div>

        <div className="flex justify-start">
          <div className="max-w-[65%]">
            <div className="h-3 w-16 mb-1 rounded bg-background-secondary" />
            <div className="h-12 w-48 rounded-2xl rounded-bl-md bg-background-secondary" />
          </div>
        </div>

        <div className="flex justify-end">
          <div className="h-10 w-56 rounded-2xl rounded-br-md bg-accent/20" />
        </div>

        <div className="flex justify-start">
          <div className="h-16 w-64 rounded-2xl rounded-bl-md bg-background-secondary" />
        </div>

        <div className="flex justify-end">
          <div className="h-10 w-40 rounded-2xl rounded-br-md bg-accent/20" />
        </div>
      </div>

      {/* Input skeleton */}
      <div className="border-t border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-background-secondary" />
          <div className="h-9 flex-1 rounded-lg bg-background-secondary" />
          <div className="h-9 w-9 rounded-full bg-background-secondary" />
          <div className="h-9 w-9 rounded-full bg-accent/20" />
        </div>
      </div>
    </div>
  )
}
