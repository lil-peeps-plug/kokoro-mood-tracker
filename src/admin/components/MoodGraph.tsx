import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import type {
  AdminMoodEntry,
  AdminUser,
} from '../hooks/useAdminData'
import { dailyAveragesByUser, pairSimilarity } from '../lib/similarity'

// ============================================================
//  MoodGraph — Obsidian-style force-directed user network
// ============================================================
//  Each Kokoro user becomes a node. Pairs whose daily mood
//  averages correlate above SIM_THRESHOLD over the last
//  30 days get connected by an edge whose weight = |r|.
//
//  Sim: classic n-body — coulomb-style repulsion between every
//  pair, Hookean springs along edges, a gentle pull toward the
//  centre, light damping. Runs forever, settling to a calm
//  drift. Hover over a node to highlight its neighbourhood.
// ============================================================

const SIM_THRESHOLD = 0.35
const REPULSION = 5800
const MIN_DIST_SQ = 80
const SPRING_K = 0.04
const SPRING_REST = 130
const CENTER_PULL = 0.012
const DAMPING = 0.86
const TIME_STEP_CAP = 0.04 // seconds — avoid huge jumps on tab refocus

interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  short: string
  full: string
  username: string | null
}

interface Edge {
  a: string
  b: string
  weight: number
}

interface Props {
  users: AdminUser[]
  entries: AdminMoodEntry[]
}

function display(u: AdminUser): { short: string; full: string } {
  const first = u.first_name?.trim() ?? ''
  const last = u.last_name?.trim() ?? ''
  const username = u.username?.trim() ?? ''
  const full = [first, last].filter(Boolean).join(' ').trim()
  const short = first || username || full || 'user'
  return {
    short,
    full: full || username || u.id.slice(0, 8),
  }
}

export default function MoodGraph({ users, entries }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 480 })
  const [hover, setHover] = useState<{
    id: string
    px: number
    py: number
  } | null>(null)

  const [, forceUpdate] = useReducer((c: number) => c + 1, 0)

  // Build the initial node/edge graph once per (users, entries) tuple.
  const { initialNodes, edges } = useMemo(() => {
    const dailies = dailyAveragesByUser(entries)
    const cx = size.w / 2
    const cy = size.h / 2
    const r0 = Math.min(size.w, size.h) * 0.32

    const nodes: Node[] = users.map((u, i) => {
      const d = display(u)
      const angle = (i / Math.max(1, users.length)) * Math.PI * 2
      return {
        id: u.id,
        x: cx + Math.cos(angle) * r0,
        y: cy + Math.sin(angle) * r0,
        vx: 0,
        vy: 0,
        short: d.short,
        full: d.full,
        username: u.username?.trim() || null,
      }
    })

    const es: Edge[] = []
    for (let i = 0; i < users.length; i++) {
      const ui = users[i]
      if (!ui) continue
      for (let j = i + 1; j < users.length; j++) {
        const uj = users[j]
        if (!uj) continue
        const a = dailies.get(ui.id)
        const b = dailies.get(uj.id)
        if (!a || !b) continue
        const { weight } = pairSimilarity(a, b)
        if (Math.abs(weight) >= SIM_THRESHOLD) {
          es.push({ a: ui.id, b: uj.id, weight: Math.abs(weight) })
        }
      }
    }
    return { initialNodes: nodes, edges: es }
    // size intentionally NOT in deps — we only seed positions once;
    // resize doesn't restart the sim. Container scales the SVG.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, entries])

  const nodesRef = useRef<Node[]>([])
  useEffect(() => {
    nodesRef.current = initialNodes.map((n) => ({ ...n }))
    forceUpdate()
  }, [initialNodes])

  // Container size tracking.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize({
        w: Math.max(320, Math.round(width)),
        h: Math.max(280, Math.round(height)),
      })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Force-sim loop. Mutates nodesRef in place and pokes React to redraw.
  useEffect(() => {
    let last = performance.now()
    let raf = 0
    let alive = true

    function tick() {
      if (!alive) return
      const now = performance.now()
      const dt = Math.min(TIME_STEP_CAP, (now - last) / 1000)
      last = now

      const ns = nodesRef.current
      const es = edges
      const cx = size.w / 2
      const cy = size.h / 2

      // Pair-wise repulsion.
      for (let i = 0; i < ns.length; i++) {
        const a = ns[i]
        if (!a) continue
        for (let j = i + 1; j < ns.length; j++) {
          const b = ns[j]
          if (!b) continue
          let dx = b.x - a.x
          let dy = b.y - a.y
          let d2 = dx * dx + dy * dy
          if (d2 < MIN_DIST_SQ) {
            // Inject jitter so coincident nodes don't divide by zero.
            d2 = MIN_DIST_SQ
            dx = (Math.random() - 0.5) * 2
            dy = (Math.random() - 0.5) * 2
          }
          const d = Math.sqrt(d2)
          const f = REPULSION / d2
          const fx = (dx / d) * f
          const fy = (dy / d) * f
          a.vx -= fx
          a.vy -= fy
          b.vx += fx
          b.vy += fy
        }
      }

      // Spring attraction along edges.
      const byId = new Map<string, Node>()
      for (const n of ns) byId.set(n.id, n)
      for (const e of es) {
        const a = byId.get(e.a)
        const b = byId.get(e.b)
        if (!a || !b) continue
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.sqrt(dx * dx + dy * dy) || 1
        const stretch = d - SPRING_REST
        const k = SPRING_K * (0.35 + 0.65 * e.weight)
        const fx = (dx / d) * stretch * k
        const fy = (dy / d) * stretch * k
        a.vx += fx
        a.vy += fy
        b.vx -= fx
        b.vy -= fy
      }

      // Centering + damping + integration.
      for (const n of ns) {
        n.vx += (cx - n.x) * CENTER_PULL
        n.vy += (cy - n.y) * CENTER_PULL
        n.vx *= DAMPING
        n.vy *= DAMPING
        n.x += n.vx * dt * 60
        n.y += n.vy * dt * 60
      }

      forceUpdate()
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [size, edges])

  // Set of nodes connected to the currently-hovered node (incl. itself).
  const connected = useMemo(() => {
    if (!hover) return null
    const set = new Set<string>([hover.id])
    for (const e of edges) {
      if (e.a === hover.id) set.add(e.b)
      if (e.b === hover.id) set.add(e.a)
    }
    return set
  }, [hover, edges])

  function onEnter(e: ReactMouseEvent<SVGGElement>, id: string) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setHover({
      id,
      px: e.clientX - rect.left,
      py: e.clientY - rect.top,
    })
  }

  function onMove(e: ReactMouseEvent<SVGGElement>) {
    if (!hover) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setHover({
      ...hover,
      px: e.clientX - rect.left,
      py: e.clientY - rect.top,
    })
  }

  function onLeave() {
    setHover(null)
  }

  const nodes = nodesRef.current
  const hoveredNode = hover ? nodes.find((n) => n.id === hover.id) : null

  if (users.length === 0) {
    return (
      <div className="mood-graph" ref={containerRef}>
        <div className="mood-graph__empty">No users logged in yet.</div>
      </div>
    )
  }

  return (
    <div className="mood-graph" ref={containerRef}>
      <svg
        className="mood-graph__svg"
        viewBox={`0 0 ${size.w} ${size.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="kokoroNodeHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.76 0.10 12)" stopOpacity="0.55" />
            <stop offset="60%" stopColor="oklch(0.62 0.08 12)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="oklch(0.55 0.07 12)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Edges (rendered first so they sit under nodes) */}
        {edges.map((e) => {
          const a = nodes.find((n) => n.id === e.a)
          const b = nodes.find((n) => n.id === e.b)
          if (!a || !b) return null
          const lit = !connected || (connected.has(e.a) && connected.has(e.b))
          return (
            <line
              key={`${e.a}-${e.b}`}
              className={`mood-graph__edge${lit ? ' is-lit' : ' is-dim'}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              strokeWidth={0.5 + e.weight * 1.4}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map((n) => {
          const isHover = hover?.id === n.id
          const lit = !connected || connected.has(n.id)
          return (
            <g
              key={n.id}
              className={
                'mood-graph__node' +
                (isHover ? ' is-hover' : '') +
                (lit ? ' is-lit' : ' is-dim')
              }
              onMouseEnter={(e) => onEnter(e, n.id)}
              onMouseMove={onMove}
              onMouseLeave={onLeave}
            >
              <circle
                className="mood-graph__node-halo"
                cx={n.x}
                cy={n.y}
                r={isHover ? 18 : 14}
                fill="url(#kokoroNodeHalo)"
              />
              <circle
                className="mood-graph__node-core"
                cx={n.x}
                cy={n.y}
                r={isHover ? 5.5 : 4.2}
              />
              <text
                className="mood-graph__node-label"
                x={n.x}
                y={n.y + 18}
                textAnchor="middle"
              >
                {n.short}
              </text>
            </g>
          )
        })}
      </svg>

      {hover && hoveredNode && (
        <div
          className="mood-graph__tooltip"
          style={{ left: hover.px, top: hover.py - 14 }}
          role="tooltip"
        >
          <div className="mood-graph__tooltip-name">{hoveredNode.full}</div>
          {hoveredNode.username && (
            <div className="mood-graph__tooltip-handle">
              @{hoveredNode.username}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
