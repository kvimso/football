'use client'

import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react'
import { PlayerSearchModal } from '@/components/chat/PlayerSearchModal'
import { CHAT_LIMITS, ALLOWED_CHAT_FILE_EXTENSIONS } from '@/lib/constants'
import type { PlayerSearchResult } from '@/lib/types'
import type { Lang } from '@/lib/translations'

interface ChatInputProps {
  conversationId: string
  onSendText: (content: string) => Promise<void>
  onSendFile: (data: { storage_path: string; file_name: string; file_type: string; file_size_bytes: number }) => Promise<void>
  onSendPlayerRef: (playerId: string) => Promise<void>
  isBlocked: boolean
  blockedByMe: boolean
  lang: Lang
  t: (key: string) => string
}

export function ChatInput({
  conversationId,
  onSendText,
  onSendFile,
  onSendPlayerRef,
  isBlocked,
  blockedByMe,
  lang,
  t,
}: ChatInputProps) {
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPlayerSearch, setShowPlayerSearch] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const charCount = text.length
  const showCharCount = charCount >= 4500
  const isOverLimit = charCount > CHAT_LIMITS.MAX_MESSAGE_LENGTH
  const canSend = text.trim().length > 0 && !isSending && !isOverLimit

  const resetTextarea = useCallback(() => {
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [])

  const handleSend = useCallback(async () => {
    if (!canSend) return
    setIsSending(true)
    setError(null)
    const content = text.trim()
    resetTextarea()
    try {
      await onSendText(content)
    } catch {
      setError(t('chat.failedToSend'))
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }, [canSend, text, resetTextarea, onSendText, t])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleTextChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    setError(null)
    // Auto-grow textarea up to 4 lines
    const el = e.target
    el.style.height = 'auto'
    const lineHeight = 20
    const maxHeight = lineHeight * 4 + 16 // 4 lines + padding
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }, [])

  const handleFileSelect = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset file input
    e.target.value = ''

    if (file.size > CHAT_LIMITS.MAX_FILE_SIZE_BYTES) {
      setError(t('errors.fileTooLarge'))
      return
    }

    if (!ALLOWED_CHAT_FILE_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) {
      setError(t('errors.fileTypeNotAllowed'))
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('conversation_id', conversationId)

      const res = await fetch('/api/chat-upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        setError(t(data.error ?? 'chat.failedToSend'))
        return
      }

      const { storage_path, file_name, file_type, file_size_bytes } = await res.json()
      await onSendFile({ storage_path, file_name, file_type, file_size_bytes })
    } catch {
      setError(t('chat.failedToSend'))
    } finally {
      setIsUploading(false)
    }
  }, [conversationId, onSendFile, t])

  const handlePlayerSelect = useCallback(async (player: PlayerSearchResult) => {
    try {
      await onSendPlayerRef(player.id)
    } catch {
      setError(t('chat.failedToSend'))
    }
  }, [onSendPlayerRef, t])

  // Blocked state
  if (isBlocked) {
    return (
      <div className="border-t border-border bg-background px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span>{blockedByMe ? t('chat.blockedByYou') : t('chat.closedByAcademy')}</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="border-t border-border bg-background px-3 py-2">
        {/* Error */}
        {error && (
          <div className="mb-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Uploading indicator */}
        {isUploading && (
          <div className="mb-2 flex items-center gap-2 text-xs text-foreground-muted">
            <div className="h-3 w-3 animate-spin rounded-full border border-accent border-t-transparent" />
            {t('chat.uploadingFile')}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground disabled:opacity-50"
            title={t('chat.attachFile')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
            </svg>
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ALLOWED_CHAT_FILE_EXTENSIONS.join(',')}
            onChange={handleFileSelect}
          />

          {/* Textarea */}
          <div className="relative min-w-0 flex-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.typeMessage')}
              rows={1}
              disabled={isSending}
              className="input max-h-[96px] min-h-[36px] w-full resize-none py-2 pr-2 text-sm"
            />
          </div>

          {/* Player ref button */}
          <button
            onClick={() => setShowPlayerSearch(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
            title={t('chat.addPlayerRef')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent"
            title={t('chat.send')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>

        {/* Character counter */}
        {showCharCount && (
          <div className={`mt-1 text-right text-[11px] ${isOverLimit ? 'text-red-400' : 'text-foreground-muted'}`}>
            {CHAT_LIMITS.MAX_MESSAGE_LENGTH - charCount} {t('chat.charCount')}
          </div>
        )}
      </div>

      {/* Player search modal */}
      <PlayerSearchModal
        isOpen={showPlayerSearch}
        onClose={() => setShowPlayerSearch(false)}
        onSelect={handlePlayerSelect}
        lang={lang}
        t={t}
      />
    </>
  )
}
