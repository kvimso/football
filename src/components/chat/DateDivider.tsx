import { formatDateDivider } from '@/lib/chat-utils'
import type { Lang } from '@/lib/translations'

interface DateDividerProps {
  date: string
  lang: Lang
}

export function DateDivider({ date, lang }: DateDividerProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-px flex-1 bg-border" />
      <span className="shrink-0 text-xs font-medium text-foreground-muted">
        {formatDateDivider(date, lang)}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}
