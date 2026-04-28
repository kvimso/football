'use client'

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'
import { PlayerSearchModal } from '@/components/chat/PlayerSearchModal'
import { CHAT_LIMITS, ALLOWED_CHAT_FILE_EXTENSIONS } from '@/lib/constants'
import type { PlayerSearchResult } from '@/lib/types'

interface ChatInputProps {
  conversationId: string
  onSendText: (content: string) => Promise<void>
  onSendFile: (data: {
    storage_path: string
    file_url: string
    file_name: string
    file_type: string
    file_size_bytes: number
  }) => Promise<void>
  onSendPlayerRef: (player: PlayerSearchResult) => Promise<void>
  isBlocked: boolean
  blockedByMe: boolean
}

const ERROR_LABELS: Record<string, string> = {
  'errors.fileTooLarge': 'File is too large. Maximum size is 10MB.',
  'errors.fileTypeNotAllowed': 'This file type is not allowed.',
  'errors.failedToSend': 'Failed to send. Please try again.',
  'chat.failedToSend': 'Failed to send. Please try again.',
}

function labelForError(key: string | undefined | null): string {
  if (!key) return 'Failed to send. Please try again.'
  return ERROR_LABELS[key] ?? key
}

export function ChatInput({
  conversationId,
  onSendText,
  onSendFile,
  onSendPlayerRef,
  isBlocked,
  blockedByMe,
}: ChatInputProps) {
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPlayerSearch, setShowPlayerSearch] = useState(false)
  const [pastedPreview, setPastedPreview] = useState<{ file: File; previewUrl: string } | null>(
    null
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(timer)
  }, [error])

  useEffect(() => {
    return () => {
      if (pastedPreview) URL.revokeObjectURL(pastedPreview.previewUrl)
    }
  }, [pastedPreview])

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
      setError('Failed to send. Please try again.')
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }, [canSend, text, resetTextarea, onSendText])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleTextChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    setError(null)
    const el = e.target
    el.style.height = 'auto'
    const lineHeight = 20
    const maxHeight = lineHeight * 4 + 16
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }, [])

  const uploadAndSendFile = useCallback(
    async (file: File) => {
      setIsUploading(true)
      setError(null)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('conversation_id', conversationId)

        const res = await fetch('/api/chat-upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const data = await res.json()
          setError(labelForError(data.error))
          return
        }

        const { storage_path, file_url, file_name, file_type, file_size_bytes } = await res.json()
        await onSendFile({ storage_path, file_url, file_name, file_type, file_size_bytes })
      } catch {
        setError('Failed to send. Please try again.')
      } finally {
        setIsUploading(false)
      }
    },
    [conversationId, onSendFile]
  )

  const handleFileSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      e.target.value = ''

      if (file.size > CHAT_LIMITS.MAX_FILE_SIZE_BYTES) {
        setError('File is too large. Maximum size is 10MB.')
        return
      }

      if (!ALLOWED_CHAT_FILE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
        setError('This file type is not allowed.')
        return
      }

      await uploadAndSendFile(file)
    },
    [uploadAndSendFile]
  )

  const handlePlayerSelect = useCallback(
    async (player: PlayerSearchResult) => {
      try {
        await onSendPlayerRef(player)
      } catch {
        setError('Failed to send. Please try again.')
      }
    },
    [onSendPlayerRef]
  )

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (!file) return

        if (file.size > CHAT_LIMITS.MAX_FILE_SIZE_BYTES) {
          setError('File is too large. Maximum size is 10MB.')
          return
        }

        const previewUrl = URL.createObjectURL(file)
        const ext = file.type.split('/')[1] || 'png'
        const namedFile = new File([file], `pasted-image-${Date.now()}.${ext}`, {
          type: file.type,
        })
        setPastedPreview({ file: namedFile, previewUrl })
        return
      }
    }
  }, [])

  const handleSendPastedImage = useCallback(async () => {
    if (!pastedPreview) return
    URL.revokeObjectURL(pastedPreview.previewUrl)
    const file = pastedPreview.file
    setPastedPreview(null)
    await uploadAndSendFile(file)
  }, [pastedPreview, uploadAndSendFile])

  if (isBlocked) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl bg-danger-muted px-3 py-2 text-sm text-danger">
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <span>
            {blockedByMe
              ? 'You blocked this scout. Unblock to continue.'
              : 'This conversation has been closed by the academy.'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="px-3 py-3">
        {error && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-danger-muted px-3 py-1.5 text-xs text-danger animate-slide-in-down">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="shrink-0 hover:text-danger"
              aria-label="Dismiss"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {isUploading && (
          <div className="mb-2 flex items-center gap-2 text-xs text-foreground-muted">
            <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
            Uploading file…
          </div>
        )}

        {pastedPreview && (
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 animate-slide-in-down">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pastedPreview.previewUrl}
              alt="Pasted image"
              className="h-16 w-16 rounded-lg object-cover"
            />
            <div className="flex-1 text-xs text-foreground-muted">Image ready to send</div>
            <button
              onClick={() => {
                URL.revokeObjectURL(pastedPreview.previewUrl)
                setPastedPreview(null)
              }}
              className="rounded px-2 py-1 text-xs text-danger hover:bg-danger-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSendPastedImage}
              disabled={isUploading}
              className="rounded bg-primary px-3 py-1 text-xs font-medium text-background hover:bg-primary/90 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex shrink-0 items-center pb-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground disabled:opacity-50"
              aria-label="Attach file"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                />
              </svg>
            </button>

            <button
              onClick={() => setShowPlayerSearch(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground"
              aria-label="Reference a player"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ALLOWED_CHAT_FILE_EXTENSIONS.join(',')}
            onChange={handleFileSelect}
          />

          <div className="relative min-w-0 flex-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Write a message…"
              rows={1}
              disabled={isSending}
              className="max-h-[120px] min-h-[44px] w-full resize-none overflow-hidden rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-background shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:opacity-40 disabled:shadow-none disabled:hover:bg-primary"
            aria-label="Send message"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </div>

        {showCharCount && (
          <div
            className={`mt-1 text-right text-[11px] ${isOverLimit ? 'text-danger' : 'text-foreground-muted'}`}
          >
            {CHAT_LIMITS.MAX_MESSAGE_LENGTH - charCount} characters remaining
          </div>
        )}
      </div>

      <PlayerSearchModal
        isOpen={showPlayerSearch}
        onClose={() => setShowPlayerSearch(false)}
        onSelect={handlePlayerSelect}
      />
    </>
  )
}
