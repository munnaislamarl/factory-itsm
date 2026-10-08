import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/services/apiClient'
import { isDemoMode } from '@/services/datasource'
import '@/styles/login.css'

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'admin@factory.com', password: 'Admin@123' },
  { label: 'IT Manager', email: 'manager@factory.com', password: 'Manager@123' },
  { label: 'IT Officer', email: 'officer@factory.com', password: 'Officer@123' },
  { label: 'Employee', email: 'employee@factory.com', password: 'Employee@123' },
  { label: 'Viewer', email: 'viewer@factory.com', password: 'Viewer@123' },
]

interface Dot {
  x: number
  y: number
  bx: number
  by: number
  ex: number
  ey: number
  r: number
  a: number
}

interface Shot {
  x: number
  y: number
  vx: number
  vy: number
  ox: number
  oy: number
  slowed: boolean
  a: number
  r: number
}

interface Ripple {
  x: number
  y: number
  r: number
}

/* ---- tuning constants (per the spec) ---- */
const DENSITY = 9375
const MIN_DOTS = 64
const MAX_DOTS = 208
const DOT_RADIUS = 1.7
const LINK_DIST = 135
const REPEL_DIST = 150
const REPEL_FORCE = 0.015
const GLOW_RADIUS = 170
const CURSOR_LINK_DIST = 210
const SHOT_COUNT = 12
const SHOT_SLOW_DIST = 160
const FADE_SECONDS = 30
const RIPPLE_MAX = 160

function useParticleNetwork(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0
    let dpr = 1
    let rafId = 0
    let last = 0
    let dots: Dot[] = []
    const shots: Shot[] = []
    const ripples: Ripple[] = []
    const mouse = { x: -9999, y: -9999, active: false }

    const rnd = (min: number, max: number) => min + Math.random() * (max - min)

    const dotTarget = () =>
      Math.max(MIN_DOTS, Math.min(MAX_DOTS, Math.round((W * H) / DENSITY)))

    const makeDot = (): Dot => {
      const speed = (0.35 + Math.random() * 0.75) * 0.168
      const angle = Math.random() * Math.PI * 2
      return {
        x: rnd(0, W),
        y: rnd(0, H),
        bx: Math.cos(angle) * speed,
        by: Math.sin(angle) * speed,
        ex: 0,
        ey: 0,
        r: DOT_RADIUS,
        a: 0.6 + Math.random() * 0.3,
      }
    }

    const seed = () => {
      dots = []
      const n = dotTarget()
      for (let i = 0; i < n; i += 1) dots.push(makeDot())
    }

    const spawnClick = (x: number, y: number) => {
      for (let i = 0; i < SHOT_COUNT; i += 1) {
        const angle = rnd(0, Math.PI * 2)
        const speed = rnd(2.5, 7)
        shots.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          ox: x,
          oy: y,
          slowed: false,
          a: 1,
          r: DOT_RADIUS,
        })
      }
      ripples.push({ x, y, r: 0 })
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = Math.floor(W * dpr)
      canvas.height = Math.floor(H * dpr)
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    const link2 = LINK_DIST * LINK_DIST
    const cursor2 = CURSOR_LINK_DIST * CURSOR_LINK_DIST

    const frame = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016
      last = now
      const fs = dt * 60 // normalise "per frame" speeds to the real frame rate

      ctx.clearRect(0, 0, W, H)

      /* --- update base dots --- */
      for (let i = 0; i < dots.length; i += 1) {
        const d = dots[i]

        if (mouse.active) {
          const dx = d.x - mouse.x
          const dy = d.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 0.001 && dist < REPEL_DIST) {
            const f = REPEL_FORCE * (1 - dist / REPEL_DIST)
            d.ex += (dx / dist) * f
            d.ey += (dy / dist) * f
          }
        }

        d.x += (d.bx + d.ex) * fs
        d.y += (d.by + d.ey) * fs
        if (d.x < 0) { d.x = 0; d.bx = Math.abs(d.bx) } else if (d.x > W) { d.x = W; d.bx = -Math.abs(d.bx) }
        if (d.y < 0) { d.y = 0; d.by = Math.abs(d.by) } else if (d.y > H) { d.y = H; d.by = -Math.abs(d.by) }

        d.ex *= 0.94
        d.ey *= 0.94
      }

      /* --- cursor glow --- */
      if (mouse.active) {
        const glow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, GLOW_RADIUS)
        glow.addColorStop(0, 'rgba(120,145,255,0.22)')
        glow.addColorStop(1, 'rgba(120,145,255,0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, GLOW_RADIUS, 0, Math.PI * 2)
        ctx.fill()
      }

      /* --- links between dots --- */
      ctx.lineWidth = 1
      for (let i = 0; i < dots.length; i += 1) {
        const a = dots[i]
        for (let j = i + 1; j < dots.length; j += 1) {
          const b = dots[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 >= link2) continue
          const dist = Math.sqrt(d2)
          const alpha = 0.42 * (1 - dist / LINK_DIST)
          ctx.strokeStyle = `rgba(185,200,255,${alpha.toFixed(3)})`
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      /* --- cursor links --- */
      if (mouse.active) {
        for (let i = 0; i < dots.length; i += 1) {
          const d = dots[i]
          const dx = d.x - mouse.x
          const dy = d.y - mouse.y
          const d2 = dx * dx + dy * dy
          if (d2 >= cursor2) continue
          const dist = Math.sqrt(d2)
          const alpha = 0.5 * (1 - dist / CURSOR_LINK_DIST)
          ctx.strokeStyle = `rgba(170,190,255,${alpha.toFixed(3)})`
          ctx.beginPath()
          ctx.moveTo(mouse.x, mouse.y)
          ctx.lineTo(d.x, d.y)
          ctx.stroke()
        }
      }

      /* --- base dots --- */
      for (let i = 0; i < dots.length; i += 1) {
        const d = dots[i]
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(228,234,255,${d.a.toFixed(3)})`
        ctx.fill()
      }

      /* --- click shots --- */
      for (let i = shots.length - 1; i >= 0; i -= 1) {
        const s = shots[i]
        s.x += s.vx * fs
        s.y += s.vy * fs

        if (!s.slowed) {
          const dx = s.x - s.ox
          const dy = s.y - s.oy
          if (dx * dx + dy * dy >= SHOT_SLOW_DIST * SHOT_SLOW_DIST) {
            s.vx *= 0.1
            s.vy *= 0.1
            s.slowed = true
          }
        } else {
          s.a -= fs / (FADE_SECONDS * 60)
        }

        if (s.a <= 0) {
          shots.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(228,234,255,${Math.max(0, s.a).toFixed(3)})`
        ctx.shadowColor = 'rgba(140,165,255,0.8)'
        ctx.shadowBlur = 8
        ctx.fill()
      }
      ctx.shadowBlur = 0

      /* --- click ripples --- */
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const rp = ripples[i]
        rp.r += 5.5 * fs
        if (rp.r >= RIPPLE_MAX) {
          ripples.splice(i, 1)
          continue
        }
        const alpha = 0.6 * (1 - rp.r / RIPPLE_MAX)
        ctx.beginPath()
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(150,170,255,${alpha.toFixed(3)})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
      ctx.lineWidth = 1

      rafId = requestAnimationFrame(frame)
    }

    const start = () => {
      if (rafId) return
      last = 0
      rafId = requestAnimationFrame(frame)
    }
    const stop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }
    }

    const onResize = () => resize()
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }
    const onLeave = () => {
      mouse.active = false
    }
    const onDown = (e: PointerEvent) => {
      if (e.button === 0) spawnClick(e.clientX, e.clientY)
    }
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) spawnClick(t.clientX, t.clientY)
    }
    const onVisibility = () => {
      if (document.hidden) stop()
      else start()
    }

    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseleave', onLeave)
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('touchstart', onTouch, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)

    resize()
    start()

    return () => {
      stop()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('touchstart', onTouch)
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
    <div className="login-root">
      <canvas id="login-fx" ref={canvasRef} aria-hidden="true" />
      <div className="login-orb" aria-hidden="true" />

      <main className="login-wrap">
        <section className="login-card" aria-labelledby="itsmTitle">
          <div className="login-card-top" />
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-badge" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="7" rx="2" />
                <rect x="3" y="13" width="18" height="7" rx="2" />
                <line x1="7" y1="7.5" x2="7.01" y2="7.5" />
                <line x1="7" y1="16.5" x2="7.01" y2="16.5" />
              </svg>
            </div>

            <h1 className="login-title" id="itsmTitle">Factory ITSM</h1>
            <p className="login-subtitle">Sign in to the IT Service Management portal &middot; লগইন করুন</p>

            <div className="login-field">
              <label className="login-label" htmlFor="identifier">Username / Email</label>
              <input
                id="identifier"
                className="login-input"
                type="text"
                placeholder="you@factory.com"
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
            <p className="login-hint">
              {isDemoMode ? 'Demo: admin@factory.com / Admin@123' : 'Use your company account to sign in'}
            </p>
          </form>
        </section>

        {isDemoMode ? (
          <div className="login-demo">
            <p className="login-demo-title">Demo accounts — click to autofill</p>
            <div className="login-demo-grid">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  className="login-demo-btn"
                  onClick={() => {
                    setIdentifier(account.email)
                    setPassword(account.password)
                    setError(null)
                  }}
                >
                  <b>{account.label}</b>
                  <span>{account.email}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <p className="login-foot">
          Factory ITSM &mdash; IT Service Management<br />
          <span>&copy; 2026 Factory ITSM. All Rights Reserved.</span>
        </p>
      </main>
    </div>
  )
}
