import type { ReactNode } from 'react'

import { Logo } from '@/components/common/Logo'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10" />
        <div className="relative">
          <Logo variant="inverse" />
        </div>
        <div className="relative space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">
            Run your IT department from one place.
          </h2>
          <p className="max-w-md text-sm text-white/80">
            Service desk tickets, IT assets, network and servers, software licenses,
            maintenance, spare parts and vendors — all tracked with full audit history.
          </p>
          <ul className="grid grid-cols-2 gap-2 text-sm text-white/90">
            <li>• IT Service Desk</li>
            <li>• Asset Lifecycle</li>
            <li>• SLA Tracking</li>
            <li>• Reports & Exports</li>
          </ul>
        </div>
        <p className="relative text-xs text-white/60">
          Built for factory IT operations · multi-building, multi-department
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
