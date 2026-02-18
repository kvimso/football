export function PlayerCardSkeleton() {
  return (
    <div className="bg-pitch-card border border-pitch-border rounded-xl overflow-hidden">
      <div className="h-48 skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 skeleton rounded" />
        <div className="h-3 w-1/2 skeleton rounded" />
        <div className="flex justify-between">
          <div className="h-3 w-1/3 skeleton rounded" />
          <div className="h-3 w-12 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="bg-pitch-card border border-pitch-border rounded-xl overflow-hidden">
      <div className="px-5 py-3">
        <div className="h-3 w-1/3 skeleton rounded" />
      </div>
      <div className="px-5 py-6">
        <div className="flex items-center justify-center gap-4">
          <div className="h-6 w-24 skeleton rounded" />
          <div className="h-8 w-16 skeleton rounded" />
          <div className="h-6 w-24 skeleton rounded" />
        </div>
      </div>
      <div className="px-5 pb-4">
        <div className="h-9 skeleton rounded-lg" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 pt-24 space-y-6">
      <div className="flex gap-6">
        <div className="w-32 h-32 skeleton rounded-xl" />
        <div className="flex-1 space-y-3">
          <div className="h-8 w-1/2 skeleton rounded" />
          <div className="h-4 w-1/3 skeleton rounded" />
          <div className="h-4 w-1/4 skeleton rounded" />
        </div>
      </div>
      <div className="h-40 skeleton rounded-xl" />
      <div className="h-60 skeleton rounded-xl" />
    </div>
  );
}
