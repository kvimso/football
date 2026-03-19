'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from '@/hooks/useLang'

const tabs = [
  {
    href: '/platform/camera/mappings',
    labelKey: 'platform.camera.tabs.mappings',
  },
  {
    href: '/platform/camera/clubs',
    labelKey: 'platform.camera.tabs.clubs',
  },
  {
    href: '/platform/camera/sync',
    labelKey: 'platform.camera.tabs.sync',
  },
]

export default function CameraLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { t } = useLang()

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('platform.camera.title')}</h1>
      <nav className="mt-4 flex gap-1 border-b border-border">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              {t(tab.labelKey)}
            </Link>
          )
        })}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  )
}
