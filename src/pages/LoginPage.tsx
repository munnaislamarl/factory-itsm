import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { AuthLayout } from '@/layouts/AuthLayout'
import { getErrorMessage } from '@/services/apiClient'
import { isDemoMode } from '@/services/datasource'

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'admin@factory.com', password: 'Admin@123' },
  { label: 'IT Manager', email: 'manager@factory.com', password: 'Manager@123' },
  { label: 'IT Officer', email: 'officer@factory.com', password: 'Officer@123' },
  { label: 'Employee', email: 'employee@factory.com', password: 'Employee@123' },
  { label: 'Viewer', email: 'viewer@factory.com', password: 'Viewer@123' },
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/app/dashboard'

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!identifier.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await login(identifier.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Access the Factory IT Service Management portal.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="identifier">Email or Employee ID</Label>
          <Input
            id="identifier"
            type="text"
            autoComplete="username"
            placeholder="you@factory.com"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        ) : null}

        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
      </form>

      {isDemoMode ? (
        <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            Demo accounts — click to autofill
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setIdentifier(account.email)
                  setPassword(account.password)
                  setError(null)
                }}
                className="rounded-lg border border-border bg-card px-3 py-2 text-left text-xs transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <span className="block font-medium text-foreground">{account.label}</span>
                <span className="block truncate text-muted-foreground">{account.email}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            These credentials exist only in local demo mode. Connect Google Sheets for real authentication.
          </p>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Connected to the live Google Sheets backend.
        </p>
      )}
    </AuthLayout>
  )
}
