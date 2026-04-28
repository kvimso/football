// Legacy chat URL — redirected from page.tsx. Layout left intact so nested
// routes resolve before redirect fires. Whole tree is removed in Track 6.
export default function LegacyScoutMessagesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
