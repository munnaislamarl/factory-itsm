import { Ghost } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Ghost className="h-8 w-8" />
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-semibold tracking-tight">404</p>
        <p className="text-sm text-muted-foreground">The page you are looking for does not exist.</p>
      </div>
      <Button asChild>
        <Link to="/app/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  )
}
