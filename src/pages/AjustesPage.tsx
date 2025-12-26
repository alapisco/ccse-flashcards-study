import { useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../ui/Button'
import { ConfirmSheet } from '../ui/ConfirmSheet'

export function AjustesPage() {
  const exportPayload = useAppStore((s) => s.exportPayload)
  const importPayload = useAppStore((s) => s.importPayload)
  const resetProgress = useAppStore((s) => s.resetProgress)

  const fileInput = useRef<HTMLInputElement | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const onExport = () => {
    const payload = exportPayload()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const ts = new Date()
      .toISOString()
      .replace('T', '_')
      .replace('Z', 'Z')
      .replace(/[:.]/g, '-')

    const a = document.createElement('a')
    a.href = url
    a.download = `ccse-flashcards-export-${ts}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onImport = async (file: File) => {
    const text = await file.text()
    try {
      const json = JSON.parse(text)
      const result = importPayload(json)
      setMessage(result.ok ? 'Importación correcta.' : `Error: ${result.reason}`)
    } catch {
      setMessage('Error: JSON inválido.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">Mi progreso</div>
        <div className="mt-1 text-xs text-[var(--muted)]">Exporta, importa o reinicia tu progreso.</div>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-white p-4">
            <div className="text-sm font-semibold">Exportar</div>
            <div className="mt-1 text-xs text-[var(--muted)]">Descarga un archivo con tu progreso actual.</div>
            <div className="mt-3">
              <Button variant="primary" onClick={onExport}>
                Exportar progreso
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4">
            <div className="text-sm font-semibold">Importar</div>
            <div className="mt-1 text-xs text-[var(--muted)]">Carga un archivo exportado anteriormente (sobrescribe tu progreso).</div>
            <div className="mt-3">
              <Button variant="secondary" onClick={() => fileInput.current?.click()}>
                Importar progreso
              </Button>
            </div>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onImport(f)
            }}
          />

          <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <div className="text-sm font-semibold text-[var(--ic-accent)]">Reiniciar</div>
            <div className="mt-1 text-xs text-[var(--muted)]">Acción destructiva: borra tu progreso y sesiones en este dispositivo.</div>
            <div className="mt-3">
              <Button variant="danger" onClick={() => setConfirmReset(true)}>
                Reiniciar progreso
              </Button>
            </div>
          </div>
        </div>
      </div>

      {message ? <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">{message}</div> : null}

      <ConfirmSheet
        open={confirmReset}
        title="¿Reiniciar progreso?"
        description="Se borrarán tus preguntas vistas, repasos, sesiones y resultados de simulacros en este dispositivo."
        confirmLabel="Reiniciar"
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false)
          resetProgress()
          setMessage('Progreso reiniciado.')
        }}
      />
    </div>
  )
}
