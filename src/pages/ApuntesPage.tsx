import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useDataset } from '../data/datasetContext'

import bokMd from '../../bok.md?raw'

type BokSection = { title: string; body: string }
type BokTarea = { tareaId: number; mdName: string; sections: BokSection[] }

function parseBok(markdown: string): BokTarea[] {
  const reTarea = /^###\s+\*\*Tarea\s+(\d+):\s*(.+?)\*\*\s*$/gm

  const matches: Array<{ tareaId: number; name: string; index: number; raw: string }> = []
  for (;;) {
    const m = reTarea.exec(markdown)
    if (!m) break
    matches.push({ tareaId: Number(m[1]), name: m[2] ?? '', index: m.index, raw: m[0] })
  }

  const tareas: BokTarea[] = []

  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i]!
    const next = matches[i + 1]

    const start = current.index + current.raw.length
    const end = next ? next.index : markdown.length
    const tareaBody = markdown.slice(start, end).trim()

    // Split by standalone bold headings: **Title** on its own line.
    const reSection = /^\*\*(.+?)\*\*\s*$/gm
    const secMatches: Array<{ title: string; index: number; raw: string }> = []
    for (;;) {
      const m = reSection.exec(tareaBody)
      if (!m) break
      secMatches.push({ title: m[1] ?? '', index: m.index, raw: m[0] })
    }

    const sections: BokSection[] = []
    if (secMatches.length === 0) {
      sections.push({ title: 'Resumen', body: tareaBody })
    } else {
      for (let s = 0; s < secMatches.length; s += 1) {
        const cur = secMatches[s]!
        const nxt = secMatches[s + 1]
        const secStart = cur.index + cur.raw.length
        const secEnd = nxt ? nxt.index : tareaBody.length
        const rawBody = tareaBody.slice(secStart, secEnd).trim()
        const cleaned = rawBody
          .split('\n')
          .filter((line) => line.trim() !== '---')
          .join('\n')
          .trim()
        sections.push({ title: cur.title.trim(), body: cleaned })
      }
    }

    tareas.push({ tareaId: current.tareaId, mdName: current.name.trim(), sections })
  }

  return tareas.sort((a, b) => a.tareaId - b.tareaId)
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

export function ApuntesPage() {
  const { dataset } = useDataset()
  const [openTareaId, setOpenTareaId] = useState<number | null>(null)
  const [openSectionKey, setOpenSectionKey] = useState<string | null>(null)
  const [readingPct, setReadingPct] = useState(0)

  const tareas = dataset?.tareas ?? []

  const bok = useMemo(() => parseBok(bokMd), [])

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const max = Math.max(1, doc.scrollHeight - window.innerHeight)
      setReadingPct(clamp01(window.scrollY / max))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleTarea = (tareaId: number) => {
    setOpenTareaId((prev) => {
      const next = prev === tareaId ? null : tareaId
      return next
    })
    setOpenSectionKey(null)
  }

  const toggleSection = (key: string) => setOpenSectionKey((prev) => (prev === key ? null : key))

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-4 bg-[var(--bg)] px-4 pt-2">
        <div className="h-1 w-full bg-[var(--surface)]">
          <div className="h-1 bg-[var(--muted)]" style={{ width: `${Math.round(readingPct * 100)}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <Link className="text-sm text-[var(--ic-accent)]" to="/estudio">
            ← Estudio
          </Link>
          <div className="text-sm font-semibold">Apuntes CCSE</div>
          <div className="w-16" />
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">Resumen para el examen</div>
        <div className="mt-2 text-sm text-[var(--muted)]">
          Apuntes resumidos: solo la información imprescindible para responder las 300 preguntas.
        </div>

        <div className="mt-3 text-xs text-[var(--muted)]">Todas las tareas</div>
      </div>

      <div className="space-y-3">
        {bok.map((t) => {
          const tareaName = tareas.find((x) => x.id === t.tareaId)?.name ?? t.mdName
          const openTarea = openTareaId === t.tareaId
          return (
            <div key={t.tareaId} className="space-y-3">
              <button
                type="button"
                className={
                  openTarea
                    ? 'w-full rounded-2xl px-4 py-4 text-left ring-2 ring-black/40'
                    : 'w-full rounded-2xl px-4 py-4 text-left'
                }
                style={{
                  backgroundColor: `color-mix(in srgb, var(--t${t.tareaId}) 16%, white)`,
                  border: `1px solid color-mix(in srgb, var(--t${t.tareaId}) 30%, white)`,
                  color: 'var(--text)',
                }}
                onClick={() => toggleTarea(t.tareaId)}
                aria-expanded={openTarea}
                aria-label={`Tarea ${t.tareaId}: ${tareaName}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-[var(--muted)]">Tarea {t.tareaId}</div>
                    <div className="mt-1 text-base font-semibold text-[var(--text)]">
                      {tareaName}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">{openTarea ? '—' : '+'}</div>
                </div>
              </button>

              {openTarea ? (
                <div className="space-y-2">
                  {t.sections.map((s, idx) => {
                    const key = `${t.tareaId}:${idx}`
                    const open = openSectionKey === key

                    return (
                      <div key={key} className="rounded-2xl bg-[var(--surface)] p-4">
                        <button
                          type="button"
                          className="flex w-full min-h-11 items-center justify-between gap-3 text-left"
                          onClick={() => toggleSection(key)}
                          aria-expanded={open}
                        >
                          <div className="text-sm font-semibold text-[var(--text)]">{s.title}</div>
                          <div className="text-xs text-[var(--muted)]">{open ? '—' : '+'}</div>
                        </button>

                        {open ? (
                          <div className="mt-3 rounded-2xl bg-white p-4">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => (
                                  <p className="mt-4 text-base leading-7 text-[var(--text)] text-justify">{children}</p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="mt-3 space-y-2 text-base leading-7 text-[var(--text)] text-left list-disc list-inside">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="mt-3 space-y-2 text-base leading-7 text-[var(--text)] text-left list-decimal list-inside">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => <li className="leading-7">{children}</li>,
                                hr: () => <hr className="my-4 border-black/10" />,
                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                em: ({ children }) => <em className="italic">{children}</em>,
                              }}
                            >
                              {s.body}
                            </ReactMarkdown>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
