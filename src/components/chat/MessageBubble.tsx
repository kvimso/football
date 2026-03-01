'use client'

import Image from 'next/image'
import { useState } from 'react'
import { formatBubbleTime, formatFileSize, isImageType } from '@/lib/chat-utils'
import { PlayerRefCard } from '@/components/chat/PlayerRefCard'
import type { MessageWithSender } from '@/lib/types'
import type { Lang } from '@/lib/translations'

interface MessageBubbleProps {
  message: MessageWithSender
  isMine: boolean
  showSenderName: boolean
  showTimestamp: boolean
  lang: Lang
  t: (key: string) => string
  onRetry?: () => void
}

export function MessageBubble({
  message,
  isMine,
  showSenderName,
  showTimestamp,
  lang,
  t,
  onRetry,
}: MessageBubbleProps) {
  const [imageExpanded, setImageExpanded] = useState(false)

  // System messages are always centered
  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-background-secondary px-3 py-1 text-xs text-foreground-muted">
          {message.content?.startsWith('chat.') ? t(message.content) : message.content}
        </span>
      </div>
    )
  }

  const senderName = message.sender?.full_name ?? t('common.unknown')
  const time = formatBubbleTime(message.created_at, lang)

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Sender name for received messages */}
        {!isMine && showSenderName && (
          <span className="mb-0.5 ml-1 text-[11px] font-medium text-foreground-muted">
            {senderName}
          </span>
        )}

        {/* Timestamp */}
        {showTimestamp && (
          <span className={`mb-0.5 text-[11px] text-foreground-muted ${isMine ? 'mr-1 text-right' : 'ml-1'}`}>
            {time}
          </span>
        )}

        {/* Message content */}
        <div
          className={`rounded-2xl ${
            isMine
              ? 'rounded-br-md bg-accent text-white'
              : 'rounded-bl-md bg-background-secondary text-foreground'
          }`}
        >
          {message.message_type === 'text' && (
            <div className="px-3 py-2">
              <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
            </div>
          )}

          {message.message_type === 'file' && (
            <div className="p-2">
              {isImageType(message.file_type) ? (
                <>
                  <button
                    onClick={() => setImageExpanded(true)}
                    className="block overflow-hidden rounded-xl"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={message.file_url ?? ''}
                      alt={message.file_name ?? t('chat.unnamedImage')}
                      className="max-h-[300px] max-w-[300px] rounded-xl object-cover"
                      loading="lazy"
                    />
                  </button>
                  {message.file_name && (
                    <p className={`mt-1 truncate px-1 text-xs ${isMine ? 'text-white/70' : 'text-foreground-muted'}`}>
                      {message.file_name}
                    </p>
                  )}
                </>
              ) : (
                <a
                  href={message.file_url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={message.file_name ?? undefined}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
                    isMine ? 'bg-white/10 hover:bg-white/20' : 'bg-background hover:bg-background/80'
                  } transition-colors`}
                >
                  <svg className={`h-8 w-8 shrink-0 ${isMine ? 'text-white/70' : 'text-foreground-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${isMine ? 'text-white' : 'text-foreground'}`}>
                      {message.file_name ?? t('chat.unnamedFile')}
                    </p>
                    <p className={`text-xs ${isMine ? 'text-white/60' : 'text-foreground-muted'}`}>
                      {message.file_size_bytes ? formatFileSize(message.file_size_bytes) : ''}
                      {' '}&middot;{' '}{t('chat.downloadFile')}
                    </p>
                  </div>
                </a>
              )}
            </div>
          )}

          {message.message_type === 'player_ref' && (
            <div className="p-2">
              <PlayerRefCard
                player={message.referenced_player ?? null}
                lang={lang}
                t={t}
              />
            </div>
          )}
        </div>

        {/* Status indicators for sent messages */}
        {isMine && (
          <div className="mt-0.5 mr-1 flex items-center gap-1 self-end">
            {message._status === 'sending' && (
              <span className="text-[11px] text-foreground-muted">{t('chat.sending')}</span>
            )}
            {message._status === 'failed' && (
              <span className="flex items-center gap-1">
                <span className="text-[11px] text-red-400">{t('chat.failedToSend')}</span>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="text-[11px] font-medium text-accent hover:underline"
                  >
                    {t('chat.retry')}
                  </button>
                )}
              </span>
            )}
            {(!message._status || message._status === 'sent') && (
              <span title={message.read_at ? `${t('chat.read')} ${formatBubbleTime(message.read_at, lang)}` : t('chat.delivered')}>
                {message.read_at ? (
                  // Double check — read
                  <svg className="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12.5l5 5L12 12m4-4.5l5 5L16 17.5" />
                  </svg>
                ) : (
                  // Single check — delivered
                  <svg className="h-3.5 w-3.5 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen image overlay */}
      {imageExpanded && message.file_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setImageExpanded(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setImageExpanded(false)}
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={message.file_url}
            alt={message.file_name ?? t('chat.unnamedImage')}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </div>
      )}
    </div>
  )
}
