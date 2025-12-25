import { Button } from './Button'
import { useOverlayEffects } from './useOverlayEffects'
import { ModalPortal } from './ModalPortal'

export function ConfirmSheet(props: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  useOverlayEffects(props.open)

  if (!props.open) return null

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999]">
        <button
          type="button"
          className="absolute inset-0 bg-black/40"
          aria-label={props.cancelLabel ?? 'Cancelar'}
          onClick={props.onCancel}
        />
        <div
          className="absolute bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl bg-[var(--bg)] p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">{props.title}</div>
            <button type="button" className="text-sm text-[var(--ic-accent)]" onClick={props.onCancel}>
              {props.cancelLabel ?? 'Cancelar'}
            </button>
          </div>

          <div className="mt-3 text-sm text-[var(--muted)]">{props.description}</div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" className="w-full" onClick={props.onCancel}>
              {props.cancelLabel ?? 'Cancelar'}
            </Button>
            <Button variant="primary" className="w-full" onClick={props.onConfirm}>
              {props.confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
