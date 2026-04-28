'use client'

import { useState, useEffect } from 'react'
import {
  formatBubbleTime,
  formatFileSize,
  isImageType,
  linkifyMessage,
  isEmojiOnly,
} from '@/lib/chat-utils'
import { PlayerRefCard } from '@/components/chat/PlayerRefCard'
import type { MessageWithSender } from '@/lib/types'

interface MessageBubbleProps {
  message: MessageWithSender
  isMine: boolean
  showSenderName: boolean
  showTimestamp: boolean
  onRetry?: () => void
  isNew?: boolean
}

export function MessageBubble({
  message,
  isMine,
  showSenderName,
  showTimestamp,
  onRetry,
  isNew,
}: MessageBubbleProps) {
  const [imageExpanded, setImageExpanded] = useState(false)

  // Escape key to close fullscreen image
  useEffect(() => {
    if (!imageExpanded) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setImageExpanded(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [imageExpanded])

  // System messages are always centered
  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-elevated px-3 py-1 text-xs text-foreground-muted">
          {renderSystemMessage(message.content)}
        </span>
      </div>
    )
  }

  const senderName = message.sender?.full_name ?? 'Unknown'
  const time = formatBubbleTime(message.created_at)

  const tightSpacing = !showSenderName && !showTimestamp

  return (
    <div
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${tightSpacing ? 'mt-0.5' : 'mt-2'} ${isNew ? 'animate-chat-fade-in' : ''}`}
    >
      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isMine && showSenderName && (
          <span className="mb-0.5 ml-3 text-[11px] font-medium text-foreground-muted">
            {senderName}
          </span>
        )}

        {showTimestamp && (
          <span
            className={`mb-0.5 text-[11px] text-foreground-muted ${isMine ? 'mr-3 text-right' : 'ml-3'}`}
          >
            {time}
          </span>
        )}

        {/* Message content — own-side and other-side both use surface tokens for less clinical feel */}
        <div
          className={
            isMine
              ? 'rounded-2xl rounded-br-sm bg-primary/95 text-background shadow-sm'
              : 'rounded-2xl rounded-bl-sm border border-border bg-surface text-foreground shadow-sm'
          }
        >
          {message.message_type === 'text' &&
            (() => {
              const emojiOnly = message.content ? isEmojiOnly(message.content) : false
              return (
                <div className="px-3.5 py-2">
                  <p
                    className={`whitespace-pre-wrap break-words ${emojiOnly ? 'text-2xl leading-relaxed' : 'text-sm leading-relaxed'}`}
                  >
                    {message.content
                      ? emojiOnly
                        ? message.content
                        : linkifyMessage(message.content).map((part, i) =>
                            typeof part === 'string' ? (
                              part
                            ) : (
                              <a
                                key={i}
                                href={part.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:opacity-80"
                              >
                                {part.url}
                              </a>
                            )
                          )
                      : null}
                  </p>
                </div>
              )
            })()}

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
                      alt={message.file_name ?? 'Image'}
                      className="max-h-[320px] max-w-[320px] rounded-xl object-cover"
                      loading="lazy"
                    />
                  </button>
                  {message.file_name && (
                    <p
                      className={`mt-1 truncate px-1 text-xs ${isMine ? 'text-background/70' : 'text-foreground-muted'}`}
                    >
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
                  aria-label="Download file"
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
                    isMine ? 'bg-white/15 hover:bg-white/25' : 'bg-elevated hover:bg-elevated/80'
                  } transition-colors`}
                >
                  <svg
                    className={`h-8 w-8 shrink-0 ${isMine ? 'text-background/80' : 'text-foreground-muted'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                    />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${isMine ? 'text-background' : 'text-foreground'}`}
                    >
                      {message.file_name ?? 'File'}
                    </p>
                    <p
                      className={`text-xs ${isMine ? 'text-background/60' : 'text-foreground-muted'}`}
                    >
                      {message.file_size_bytes ? formatFileSize(message.file_size_bytes) : ''}{' '}
                      &middot; Download
                    </p>
                  </div>
                </a>
              )}
            </div>
          )}

          {message.message_type === 'player_ref' && (
            <div className="p-2">
              <PlayerRefCard player={message.referenced_player ?? null} />
            </div>
          )}
        </div>

        {isMine && (
          <div className="mt-0.5 mr-1 flex items-center gap-1 self-end">
            {message._status === 'sending' && (
              <span className="text-[11px] text-foreground-muted">Sending…</span>
            )}
            {message._status === 'failed' && (
              <span className="flex items-center gap-1">
                <span className="text-[11px] text-danger">Failed to send</span>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    aria-label="Retry sending"
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    Retry
                  </button>
                )}
              </span>
            )}
            {(!message._status || message._status === 'sent') && (
              <span
                title={message.read_at ? `Read ${formatBubbleTime(message.read_at)}` : 'Delivered'}
              >
                {message.read_at ? (
                  <svg
                    className="h-3.5 w-3.5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2 12.5l5 5L12 12m4-4.5l5 5L16 17.5"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-3.5 w-3.5 text-foreground-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
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
            aria-label="Close image"
          >
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={message.file_url}
            alt={message.file_name ?? 'Image'}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </div>
      )}
    </div>
  )
}

// Translate legacy 'chat.foo' system message keys to English. New system messages
// should be sent as plain English from the server.
const SYSTEM_MESSAGE_LABELS: Record<string, string> = {
  'chat.conversationStarted': 'Conversation started',
}

function renderSystemMessage(content: string | null): string {
  if (!content) return ''
  if (content.startsWith('chat.')) return SYSTEM_MESSAGE_LABELS[content] ?? content
  return content
}
