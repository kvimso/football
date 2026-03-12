'use client'

import { useState } from 'react'
import { useLang } from '@/hooks/useLang'
import { TransferCard } from './TransferCard'

interface TransferItem {
  id: string
  status: string
  requested_at: string | null
  playerName: string
  position: string | null
  platformId: string | null
  clubName: string
}

interface TransferTabsProps {
  incoming: TransferItem[]
  outgoing: TransferItem[]
  pendingIncoming: number
  pendingOutgoing: number
}

export function TransferTabs({
  incoming,
  outgoing,
  pendingIncoming,
  pendingOutgoing,
}: TransferTabsProps) {
  const { t } = useLang()
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming')

  const items = activeTab === 'incoming' ? incoming : outgoing

  return (
    <div>
      {/* Segment control */}
      <div className="inline-flex rounded-xl border border-border bg-background-secondary p-1">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === 'incoming'
              ? 'bg-accent/15 text-accent shadow-sm'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
            />
          </svg>
          {t('admin.transfers.incoming')}
          {pendingIncoming > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-500/15 px-1 text-[10px] font-bold text-yellow-500">
              {pendingIncoming}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === 'outgoing'
              ? 'bg-accent/15 text-accent shadow-sm'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
            />
          </svg>
          {t('admin.transfers.outgoing')}
          {pendingOutgoing > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-500/15 px-1 text-[10px] font-bold text-yellow-500">
              {pendingOutgoing}
            </span>
          )}
        </button>
      </div>

      {/* Transfer cards */}
      <div className="mt-4 space-y-2">
        {items.length > 0 ? (
          items.map((item, i) => (
            <TransferCard
              key={item.id}
              requestId={item.id}
              playerName={item.playerName}
              position={item.position}
              platformId={item.platformId}
              clubName={item.clubName}
              direction={activeTab}
              status={item.status}
              requestedAt={item.requested_at}
              index={i}
              t={t}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background-secondary">
              <svg
                className="h-6 w-6 text-foreground-muted/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                />
              </svg>
            </div>
            <p className="mt-3 text-sm text-foreground-muted/50">
              {activeTab === 'incoming'
                ? t('admin.transfers.noIncoming')
                : t('admin.transfers.noOutgoing')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
