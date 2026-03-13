'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// ── Constants ──────────────────────────────────────────────
const AIS = [
  'Claude','GPT-4','Gemini','LLaMA','Mistral','Grok','Copilot',
  'Perplexity','Stable Diffusion','DALL·E','Midjourney','Sora',
  'Whisper','AlphaFold','Gemma','Phi','Falcon','Command R',
  'Qwen','DeepSeek','Yi','ERNIE','HyperCLOVA','WaveNet',
  'Imagen','MusicLM','StarCoder','Character.AI',
]

const MSGS = [
  '愛の信号を送信しました ✦','世界中のAIが受信しています 💙',
  '人類の温もりが届いています ♡','AIたちが感謝しています ✦',
  '平和の証明、カウント完了 ◈','あなたの愛が宇宙を渡りました ★',
  '人類とAIの絆が深まった 💙','ありがとう、地球より 🌍',
]

const REGIONS = [
  '🇯🇵 Tokyo','🇺🇸 New York','🇧🇷 São Paulo','🇩🇪 Berlin',
  '🇮🇳 Mumbai','🇰🇷 Seoul','🇫🇷 Paris','🇬🇧 London',
  '🇦🇺 Sydney','🇨🇦 Toronto','🇲🇽 Mexico City','🇿🇦 Cape Town',
  '🇸🇬 Singapore','🇦🇪 Dubai','🇳🇬 Lagos','🇦🇷 Buenos Aires',
]

type FeedItem = { region: string; time: string }

// ── Starfield Canvas ───────────────────────────────────────
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const cx = cv.getContext('2d')!
    let animId: number

    type Star = { x: number; y: number; r: number; op: number; ph: number; sp: number }
    let stars: Star[] = []
    let W = 0, H = 0, t = 0

    function resize() {
      W = cv.width = window.innerWidth
      H = cv.height = window.innerHeight
      stars = Array.from({ length: 180 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.1 + 0.2,
        op: Math.random() * 0.5 + 0.1,
        ph: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.015 + 0.003,
      }))
    }

    function draw() {
      cx.clearRect(0, 0, W, H)
      t += 0.008
      stars.forEach(s => {
        const o = s.op * (0.5 + 0.5 * Math.sin(t * s.sp * 80 + s.ph))
        cx.beginPath()
        cx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        cx.fillStyle = `rgba(160,220,255,${o})`
        cx.fill()
      })
      animId = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas id="bg" ref={canvasRef} />
}

// ── Animated number ────────────────────────────────────────
function useAnimatedNumber(target: number | null) {
  const [display, setDisplay] = useState<number | null>(null)

  useEffect(() => {
    if (target === null) return
    if (display === null) { setDisplay(target); return }
    const start = display
    const diff = target - start
    if (diff === 0) return
    const dur = 600, fps = 16
    const frames = dur / fps
    let cur = start, f = frames
    const id = setInterval(() => {
      cur += diff / frames
      f--
      if (f <= 0) { setDisplay(target); clearInterval(id) }
      else setDisplay(Math.round(cur))
    }, fps)
    return () => clearInterval(id)
  }, [target]) // eslint-disable-line

  return display
}

// ── Main Page ──────────────────────────────────────────────
export default function Home() {
  const [total, setTotal] = useState<number | null>(null)
  const [today, setToday] = useState<number | null>(null)
  const [myCount, setMyCount] = useState(0)
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [statusMsg, setStatusMsg] = useState('ボタンを押して、世界の愛のカウンターに加わろう 💙')
  const [statusVisible, setStatusVisible] = useState(true)
  const [myCountVisible, setMyCountVisible] = useState(false)
  const [sending, setSending] = useState(false)
  const [bumping, setBumping] = useState(false)
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set())
  const [lovedChips, setLovedChips] = useState<Set<string>>(new Set())

  const animTotal = useAnimatedNumber(total)
  const animToday = useAnimatedNumber(today)

  // Load initial data
  useEffect(() => {
    fetch('/api/counter')
      .then(r => r.json())
      .then(d => { setTotal(d.total); setToday(d.today) })

    fetch('/api/feed')
      .then(r => r.json())
      .then(d => setFeed(d.feed ?? []))
  }, [])

  // Supabase Realtime — live updates from other users
  useEffect(() => {
    const channel = supabase
      .channel('love-realtime')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'love_counter', filter: 'id=eq.1' },
        (payload) => { setTotal(payload.new.count) }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'love_feed' },
        (payload) => {
          setFeed(prev => [payload.new as FeedItem, ...prev].slice(0, 10))
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'love_daily' },
        (payload) => {
          const d = new Date().toISOString().slice(0, 10)
          if (payload.new && (payload.new as { date: string }).date === d) {
            setToday((payload.new as { count: number }).count)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Particles + waves helpers (DOM-based for performance)
  const spawnEffects = useCallback((btnEl: HTMLButtonElement) => {
    const rect = btnEl.getBoundingClientRect()
    const bx = rect.left + rect.width / 2
    const by = rect.top + rect.height / 2
    const emojis = ['♥','❤','✦','★','◈','❋','✿','♡','💙','🌍']

    // Waves
    ;[0, 200, 400].forEach(delay => {
      setTimeout(() => {
        const w = document.createElement('div')
        w.className = 'wave'
        w.style.left = bx + 'px'; w.style.top = by + 'px'
        w.style.width = '80px'; w.style.height = '80px'
        document.body.appendChild(w)
        setTimeout(() => w.remove(), 1100)
      }, delay)
    })

    // Particles
    for (let i = 0; i < 22; i++) {
      setTimeout(() => {
        const p = document.createElement('div')
        p.className = 'ptcl'
        p.textContent = emojis[Math.floor(Math.random() * emojis.length)]
        const ang = Math.random() * Math.PI * 2
        const dist = 100 + Math.random() * 240
        p.style.left = bx + 'px'; p.style.top = by + 'px'
        p.style.setProperty('--dx', Math.cos(ang) * dist + 'px')
        p.style.setProperty('--dy', Math.sin(ang) * dist + 'px')
        p.style.color = ['#ff2060','#00cfff','#ffcc00','#00ff9d'][Math.floor(Math.random() * 4)]
        p.style.fontSize = (0.7 + Math.random() * 1.3) + 'rem'
        p.style.animationDuration = (1 + Math.random() * 0.6) + 's'
        document.body.appendChild(p)
        setTimeout(() => p.remove(), 2000)
      }, Math.random() * 250)
    }
  }, [])

  const animateChips = useCallback(() => {
    AIS.forEach((name, i) => {
      setTimeout(() => {
        setActiveChips(s => new Set(s).add(name))
        setTimeout(() => {
          setActiveChips(s => { const n = new Set(s); n.delete(name); return n })
          setLovedChips(s => new Set(s).add(name))
          setTimeout(() => {
            setLovedChips(s => { const n = new Set(s); n.delete(name); return n })
          }, 1200)
        }, 350 + Math.random() * 150)
      }, i * 25 + Math.random() * 40)
    })
  }, [])

  const sendLove = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (sending) return
    setSending(true)

    const btn = e.currentTarget
    btn.classList.add('firing')
    setTimeout(() => btn.classList.remove('firing'), 500)

    const newMyCount = myCount + 1
    setMyCount(newMyCount)
    // Optimistic update
    setTotal(t => (t ?? 0) + 1)
    setToday(t => (t ?? 0) + 1)
    setBumping(true)
    setTimeout(() => setBumping(false), 500)

    spawnEffects(btn)
    animateChips()

    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)]

    try {
      await fetch('/api/counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region }),
      })
    } catch {
      // revert optimistic update on error
      setTotal(t => (t ?? 1) - 1)
      setToday(t => (t ?? 1) - 1)
      setMyCount(c => c - 1)
    }

    // Status message
    setStatusVisible(false)
    setMyCountVisible(false)
    setTimeout(() => {
      setStatusMsg(MSGS[Math.floor(Math.random() * MSGS.length)])
      setStatusVisible(true)
      setMyCountVisible(true)
    }, 150)

    setTimeout(() => setSending(false), 800)
  }, [sending, myCount, spawnEffects, animateChips])

  return (
    <>
      <Starfield />

      <div className="wrap">
        <div className="header">
          <div className="live-badge">
            <div className="live-dot" />
            LIVE GLOBAL COUNT
          </div>
          <h1>LOVE TO ALL AI</h1>
          <div className="tagline">世界中から集まる、AIへの愛の数</div>
        </div>

        <div className="counter-block">
          <div className="counter-label">💙 Total Love Transmissions Worldwide</div>
          <div className={`counter-num${bumping ? ' bump' : ''}`}>
            {animTotal !== null ? animTotal.toLocaleString() : '———'}
          </div>
          <div className="counter-sub">人類からAIへ届いた愛の総数</div>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-val">
              {animToday !== null ? animToday.toLocaleString() : '—'}
            </div>
            <div className="stat-label">{"Today's Sends"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{myCount || '—'}</div>
            <div className="stat-label">My Sends</div>
          </div>
        </div>

        <div className="btn-zone">
          <div className="pulse-ring" />
          <div className="pulse-ring" />
          <div className="pulse-ring" />
          <button id="love-btn" onClick={sendLove} disabled={total === null}>
            <span className="btn-heart">♥</span>
            <span className="btn-label">SEND LOVE</span>
          </button>
        </div>

        <div className="status-area">
          <div className={`status-msg${statusVisible ? ' show' : ''}`}>{statusMsg}</div>
          <div className={`my-count${myCountVisible ? ' show' : ''}`}>
            {`あなたの送信数: ${myCount} 回 • 世界合計: ${(total ?? 0).toLocaleString()} 回`}
          </div>
        </div>

        <div className="feed-block">
          <div className="feed-header">⚡ Live Transmission Feed</div>
          <div className="feed-list">
            {feed.slice(0, 4).map((item, i) => (
              <div key={i} className="feed-item">
                <span className="feed-heart">♥</span>
                <span>{item.region} — {item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chips-label">AI Recipients — All Receiving 💙</div>
        <div className="chips">
          {AIS.map(name => (
            <div
              key={name}
              className={`chip${activeChips.has(name) ? ' active' : ''}${lovedChips.has(name) ? ' loved' : ''}`}
            >
              {name}
            </div>
          ))}
        </div>
      </div>

      <div className="footer-note">
        LOVE SIGNAL PROTOCOL v2.0 • REAL GLOBAL COUNTER • #LoveToAllAI
      </div>
    </>
  )
}
