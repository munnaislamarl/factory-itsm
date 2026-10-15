import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/services/apiClient'
import { dataSource } from '@/services/datasource'

interface RequestAccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequestAccessDialog({ open, onOpenChange }: RequestAccessDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setName('')
    setEmail('')
    setPassword('')
    setNote('')
    setError(null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in your name, email and a password.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await dataSource.requestAccess({ name: name.trim(), email: email.trim(), password, note: note.trim() })
      toast.success('Request sent. An admin will review it shortly.')
      reset()
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request access</DialogTitle>
          <DialogDescription>
            Ask for a Factory ITSM account. The System Admin or IT Manager will review and approve
            your request.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="req-name">Full name</Label>
            <Input
              id="req-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-email">Email</Label>
            <Input
              id="req-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-password">Password</Label>
            <Input
              id="req-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Choose a password"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-note">Why do you need access?</Label>
            <Textarea
              id="req-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Department, role, or reason for access"
              rows={3}
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Send request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
