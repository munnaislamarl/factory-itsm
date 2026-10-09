import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/services/apiClient'
import { isDemoMode } from '@/services/datasource'
import '@/styles/login.css'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  alpha: number
  burst: boolean
  t: number
  max: number
}

/* Same particle-network engine as the Fair Shop login page. */
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
    let particles: Particle[] = []
    const mouse = { x: -9999, y: -9999, active: false }

    const CONNECT = 150
    const DENSITY = 8500
    const MAX_BASE = 220
    const MAX_TOTAL = 340
    const BURST_COUNT = 30
    const BURST_LIFE = 4

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rnd = (min: number, max: number) => min + Math.random() * (max - min)

    const makeBase = (): Particle => {
      const speed = reduceMotion ? 0 : rnd(0.1, 0.35)
      const angle = rnd(0, Math.PI * 2)
      return {
        x: rnd(0, W),
        y: rnd(0, H),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: rnd(1, 2.2),
        alpha: rnd(0.35, 0.8),
        burst: false,
        t: 0,
        max: 0,
      }
    }

    const resetBase = () => {
      particles = particles.filter((p) => p.burst)
      const n = Math.min(Math.round((W * H) / DENSITY), MAX_BASE)
      for (let i = 0; i < n; i += 1) particles.push(makeBase())
    }

    const capTotal = () => {
      if (particles.length <= MAX_TOTAL) return
      let excess = particles.length - MAX_TOTAL
      for (let i = 0; i < particles.length && excess > 0; i += 1) {
        if (!particles[i].burst) {
          particles.splice(i, 1)
          i -= 1
          excess -= 1
        }
      }
    }

    const burst = (x: number, y: number) => {
      for (let i = 0; i < BURST_COUNT; i += 1) {
        const angle = rnd(0, Math.PI * 2)
        const speed = rnd(0.7, 2.8)
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: rnd(1.2, 2.6),
          alpha: 1,
          burst: true,
          t: 0,
          max: rnd(BURST_LIFE - 1, BURST_LIFE),
        })
      }
      capTotal()
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
      resetBase()
    }

    const frame = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016
      last = now

      ctx.clearRect(0, 0, W, H)

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i]
        p.x += p.vx * (dt * 60)
        p.y += p.vy * (dt * 60)
        if (p.burst) {
          p.vx *= 0.985
          p.vy *= 0.985
          p.t += dt
          if (p.t >= p.max) particles.splice(i, 1)
        } else {
          if (p.x < -20) p.x = W + 20
          else if (p.x > W + 20) p.x = -20
          if (p.y < -20) p.y = H + 20
          else if (p.y > H + 20) p.y = -20
        }
      }

      if (mouse.active) {
        const glow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 170)
        glow.addColorStop(0, 'rgba(120,145,255,0.22)')
        glow.addColorStop(1, 'rgba(120,145,255,0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 170, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.lineWidth = 1
      const connect2 = CONNECT * CONNECT
      for (let a = 0; a < particles.length; a += 1) {
        const pa = particles[a]
        for (let b = a + 1; b < particles.length; b += 1) {
          const pb = particles[b]
          const dx = pa.x - pb.x
          const dy = pa.y - pb.y
          const d2 = dx * dx + dy * dy
          if (d2 >= connect2) continue
          const d = Math.sqrt(d2)
          let alpha = (1 - d / CONNECT) * 0.35
          if (pa.burst || pb.burst) {
            const fa = pa.burst ? 1 - pa.t / pa.max : 1
            const fb = pb.burst ? 1 - pb.t / pb.max : 1
            alpha *= Math.max(fa, fb)
            ctx.strokeStyle = `rgba(150,170,255,${alpha.toFixed(3)})`
          } else {
            ctx.strokeStyle = `rgba(190,205,255,${alpha.toFixed(3)})`
          }
          ctx.beginPath()
          ctx.moveTo(pa.x, pa.y)
          ctx.lineTo(pb.x, pb.y)
          ctx.stroke()
        }
      }

      if (mouse.active) {
        for (let c = 0; c < particles.length; c += 1) {
          const pc = particles[c]
          const mx = pc.x - mouse.x
          const my = pc.y - mouse.y
          const md2 = mx * mx + my * my
          if (md2 < connect2) {
            const md = Math.sqrt(md2)
            const ma = (1 - md / CONNECT) * 0.5
            ctx.strokeStyle = `rgba(120,145,255,${ma.toFixed(3)})`
            ctx.beginPath()
            ctx.moveTo(mouse.x, mouse.y)
            ctx.lineTo(pc.x, pc.y)
            ctx.stroke()
          }
        }
      }

      for (let n = 0; n < particles.length; n += 1) {
        const pn = particles[n]
        const life = pn.burst ? Math.max(0, 1 - pn.t / pn.max) : pn.alpha
        ctx.beginPath()
        ctx.arc(pn.x, pn.y, pn.r, 0, Math.PI * 2)
        if (pn.burst) {
          ctx.fillStyle = `rgba(200,215,255,${life.toFixed(3)})`
          ctx.shadowColor = 'rgba(120,145,255,0.9)'
          ctx.shadowBlur = 12
        } else {
          ctx.fillStyle = `rgba(255,255,255,${(life * 0.9).toFixed(3)})`
          ctx.shadowBlur = 0
        }
        ctx.fill()
      }
      ctx.shadowBlur = 0

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
      if (e.button === 0) burst(e.clientX, e.clientY)
    }
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) burst(t.clientX, t.clientY)
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
    if (reduceMotion) frame(0)
    else start()

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
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>

            <h1 className="login-title" id="itsmTitle">Factory ITSM</h1>
            <p className="login-subtitle">Sign in to your account &middot; লগইন করুন</p>

            <div className="login-field">
              <label className="login-label" htmlFor="identifier">Username</label>
              <input
                id="identifier"
                className="login-input"
                type="text"
                placeholder="username"
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

        <p className="login-foot">
          Factory ITSM &mdash; IT Service Management<br />
          <span>&copy; 2026 Factory ITSM. All Rights Reserved.</span>
        </p>
      </main>
    </div>
  )
}
