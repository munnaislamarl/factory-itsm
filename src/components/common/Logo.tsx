import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
  variant?: 'default' | 'inverse'
}

export function Logo({ className, showText = true, variant = 'default' }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-soft">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-foreground" fill="none">
          <path
            d="M14.7 6.3a4 4 0 0 1-5.4 5.4L6 15l-1.5-1.5 3.3-3.3a4 4 0 0 1 5.4-5.4l-2.2 2.2 1.7 1.7 2.2-2.2Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="m4.5 18 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="18" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </div>
      {showText ? (
        <div className="leading-tight">
          <p
            className={cn(
              'text-sm font-semibold tracking-tight',
              variant === 'inverse' ? 'text-white' : 'text-foreground',
            )}
          >
            Factory ITSM
          </p>
          <p
            className={cn(
              'text-[11px]',
              variant === 'inverse' ? 'text-white/70' : 'text-muted-foreground',
            )}
          >
            IT Service Management
          </p>
        </div>
      ) : null}
    </div>
  )
}
