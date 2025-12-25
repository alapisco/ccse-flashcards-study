import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataset } from '../data/datasetContext'
import { useAppStore } from '../store/useAppStore'
import { todayLocal } from '../srs/date'
import { buildStudySession, PRESET_SIZES } from '../study/buildSession'
import { Button } from '../ui/Button'
import { TAREA_IDS } from '../domain/types'

export function EstudiarPage() {
  const navigate = useNavigate()
  const { dataset } = useDataset()
  const settings = useAppStore((s) => s.settings)
  const setSettings = useAppStore((s) => s.setSettings)
  const progressById = useAppStore((s) => s.progressById)
  const startSession = useAppStore((s) => s.startSession)

  const today = todayLocal()
  const size = PRESET_SIZES[settings.defaultPreset]

  const built = useMemo(
    () =>
      dataset
        ? buildStudySession({
            dataset,
            progressById,
            today,
            size,
            focusTareaId: settings.focusTareaId,
            onlyThisTarea: settings.onlyThisTarea,
          })
        : { ids: [], breakdown: { due: 0, weak: 0, new: 0 } },
    [dataset, progressById, settings.focusTareaId, settings.onlyThisTarea, size, today],
  )

  const onStart = () => {
    if (built.ids.length === 0) return
    startSession('study', built.ids)
    navigate('/estudiar/sesion')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">Sesión</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <PresetButton
            label="Corta"
            count={10}
            selected={settings.defaultPreset === 'short'}
            onClick={() => setSettings({ defaultPreset: 'short' })}
          />
          <PresetButton
            label="Media"
            count={25}
            selected={settings.defaultPreset === 'medium'}
            onClick={() => setSettings({ defaultPreset: 'medium' })}
          />
          <PresetButton
            label="Larga"
            count={40}
            selected={settings.defaultPreset === 'long'}
            onClick={() => setSettings({ defaultPreset: 'long' })}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">Foco por tarea</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <ChipButton
            label="Todas"
            selected={settings.focusTareaId === 'all'}
            onClick={() => setSettings({ focusTareaId: 'all' })}
          />
          {TAREA_IDS.map((id) => (
            <ChipButton
              key={id}
              label={`T${id}`}
              selected={settings.focusTareaId === id}
              onClick={() => setSettings({ focusTareaId: id })}
            />
          ))}
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.onlyThisTarea}
            onChange={(e) => setSettings({ onlyThisTarea: e.target.checked })}
          />
          Solo esta tarea
        </label>

        <div className="mt-2 text-xs text-[var(--muted)]">
          Incluye: {built.breakdown.due} para repasar · {built.breakdown.weak} para reforzar · {built.breakdown.new} nuevas
        </div>
      </div>

      <Button variant="primary" onClick={onStart}>
        Empezar sesión — {PRESET_SIZES[settings.defaultPreset]} preguntas
      </Button>
    </div>
  )
}

function PresetButton(props: { label: string; count: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className={
        props.selected
          ? 'rounded-xl bg-white px-3 py-3 text-sm font-semibold ring-2 ring-[var(--ic-accent)]'
          : 'rounded-xl bg-white px-3 py-3 text-sm text-[var(--muted)]'
      }
    >
      <div>{props.label}</div>
      <div className="text-xs">{props.count}</div>
    </button>
  )
}

function ChipButton(props: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className={
        props.selected
          ? 'rounded-full bg-white px-3 py-2 text-sm font-semibold ring-2 ring-[var(--ic-accent)]'
          : 'rounded-full bg-white px-3 py-2 text-sm text-[var(--muted)]'
      }
    >
      {props.label}
    </button>
  )
}
