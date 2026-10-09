import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/services/apiClient'
import '@/styles/login.css'

interface Dot {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  r: number
  ox?: number
  oy?: number
  slowed?: boolean
}

interface Ripple {
  x: number
  y: number
  r: number
}

const MAXP = 600

function useParticleNetwork(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let dpr = 1
    let rafId = 0
    let pts: Dot[] = []
    const ripples: Ripple[] = []
    const mouse = { x: 0, y: 0, on: false }

    const rand = () => Math.random()

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // recreate base dots (keep any transient click dots)
      pts = pts.filter((p) => p.life !== Infinity)
      const base = Math.max(64, Math.min(208, Math.round((w * h) / 9375)))
      for (let i = 0; i < base; i += 1) {
        const ang = rand() * Math.PI * 2
        const spd = (0.35 + rand() * 0.75) * 0.168
        pts.push({
          x: rand() * w,
          y: rand() * h,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: Infinity,
          r: 1.7,
        })
      }
    }

    const spawn = (x: number, y: number) => {
      ripples.push({ x, y, r: 4 })
      if (ripples.length > 14) ripples.shift()

      for (let i = 0; i < 12; i += 1) {
        if (pts.length > MAXP) break
        const a = (Math.PI * 2 * i) / 12 + rand() * 0.5
        const sp = 2.5 + rand() * 4.5
        const off = rand() * 12
        pts.push({
          x: x + Math.cos(a) * off,
          y: y + Math.sin(a) * off,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
          r: 2.5,
          ox: x,
          oy: y,
          slowed: false,
        })
      }
    }

    const frame = () => {
      ctx.clearRect(0, 0, w, h)

      /* ---- update ---- */
      for (let i = pts.length - 1; i >= 0; i -= 1) {
        const p = pts[i]

        if (mouse.on) {
          const gx = p.x - mouse.x
          const gy = p.y - mouse.y
          const gd = Math.hypot(gx, gy)
          if (gd > 1 && gd < 150) {
            const f = 0.015 * (1 - gd / 150)
            p.vx += (gx / gd) * f
            p.vy += (gy / gd) * f
          }
        }

        p.x += p.vx
        p.y += p.vy

        if (p.life === Infinity) {
          const bv = Math.hypot(p.vx, p.vy)
          if (bv > 1.4) {
            p.vx *= 1.4 / bv
            p.vy *= 1.4 / bv
          }
        } else {
          p.life -= 0.0005
          const odx = p.x - (p.ox ?? p.x)
          const ody = p.y - (p.oy ?? p.y)
          if (!p.slowed && odx * odx + ody * ody >= 25600) {
            p.vx *= 0.1
            p.vy *= 0.1
            p.slowed = true
          }
          if (p.life <= 0) {
            pts.splice(i, 1)
            continue
          }
        }

        if (p.x < 0) p.x += w
        else if (p.x > w) p.x -= w
        if (p.y < 0) p.y += h
        else if (p.y > h) p.y -= h
      }

      /* ---- cursor glow ---- */
      if (mouse.on) {
        const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 170)
        g.addColorStop(0, 'rgba(120,145,255,0.22)')
        g.addColorStop(0.5, 'rgba(120,145,255,0.08)')
        g.addColorStop(1, 'rgba(120,145,255,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 170, 0, Math.PI * 2)
        ctx.fill()
      }

      /* ---- ripples ---- */
      ctx.lineWidth = 2
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const rp = ripples[i]
        rp.r += 3.0
        if (rp.r >= 160) {
          ripples.splice(i, 1)
          continue
        }
        ctx.strokeStyle = `rgba(180,200,255,${(0.6 * (1 - rp.r / 160)).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2)
        ctx.stroke()
      }

      /* ---- links between dots ---- */
      ctx.lineWidth = 1
      const halfW = w * 0.5
      const halfH = h * 0.5
      for (let i = 0; i < pts.length; i += 1) {
        const p1 = pts[i]
        for (let j = i + 1; j < pts.length; j += 1) {
          const p2 = pts[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          if (Math.abs(dx) > halfW || Math.abs(dy) > halfH) continue
          const d = Math.hypot(dx, dy)
          if (d >= 135) continue
          const lf1 = p1.life === Infinity ? 1 : p1.life
          const lf2 = p2.life === Infinity ? 1 : p2.life
          const a = 0.42 * (1 - d / 135) * (0.3 + 0.7 * Math.min(lf1, lf2))
          ctx.strokeStyle = `rgba(185,200,255,${a.toFixed(3)})`
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        }
      }

      /* ---- cursor links ---- */
      if (mouse.on) {
        for (let i = 0; i < pts.length; i += 1) {
          const p = pts[i]
          const md = Math.hypot(p.x - mouse.x, p.y - mouse.y)
          if (md < 210) {
            const a = 0.5 * (1 - md / 210)
            ctx.strokeStyle = `rgba(170,190,255,${a.toFixed(3)})`
            ctx.beginPath()
            ctx.moveTo(mouse.x, mouse.y)
            ctx.lineTo(p.x, p.y)
            ctx.stroke()
          }
        }
      }

      /* ---- nodes ---- */
      for (let i = 0; i < pts.length; i += 1) {
        const p = pts[i]
        const lf = p.life === Infinity ? 1 : p.life
        ctx.fillStyle = `rgba(228,234,255,${(0.5 + 0.4 * lf).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      rafId = requestAnimationFrame(frame)
    }

    let running = false
    const start = () => {
      if (running) return
      running = true
      rafId = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }
    }

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.on = true
    }
    const onLeave = () => {
      mouse.on = false
    }
    const onDown = (e: PointerEvent) => {
      if (e.button === 0) spawn(e.clientX, e.clientY)
    }
    const onVisibility = () => {
      if (document.hidden) stop()
      else start()
    }

    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)

    resize()
    start()

    return () => {
      stop()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [canvasRef])
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/app/dashboard'

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  useParticleNetwork(canvasRef)

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!identifier.trim() || !password) {
      setError('Please enter your username and password.')
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
    <div className="login-root">
      <div className="login-orb" aria-hidden="true" />
      <canvas className="login-fx" ref={canvasRef} aria-hidden="true" />

      <div className="login-wrap">
        <div className="login-card">
          <div className="login-top" />
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-logo" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>

            <div className="login-head">
              <h1>Factory ITSM</h1>
              <p>Sign in to your account</p>
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="identifier">Username</label>
              <input
                id="identifier"
                className="login-input"
                type="text"
                placeholder="Username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">Password</label>
              <div className="login-pass">
                <input
                  id="password"
                  className="login-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="login-error" role="alert" aria-live="polite">{error}</div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <p className="login-hint">প্রথমবার ডিফল্ট — admin@factory.com / Admin@123</p>
          </form>
        </div>

        <p className="login-footer">
          Factory ITSM<br />
          <span>&copy; 2026 Factory ITSM. All Rights Reserved.</span>
        </p>
      </div>
    </div>
  )
}
