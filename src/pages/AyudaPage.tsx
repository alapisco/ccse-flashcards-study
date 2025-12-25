export function AyudaPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">Ayuda</div>
        <div className="mt-2 space-y-3 text-sm text-[var(--muted)]">
          <div>
            <div className="font-semibold text-[var(--text)]">¿Qué es “estudio inteligente”?</div>
            <div>Un modo que te muestra automáticamente lo más importante: para repasar, para reforzar y nuevas.</div>
          </div>
          <div>
            <div className="font-semibold text-[var(--text)]">Cómo funciona el estudio inteligente</div>
            <div>
              Mezcla repasos y preguntas nuevas según tu progreso. Cuando aciertas, te pedimos “Lo sabía” o “Adiviné”
              para ajustar mejor los siguientes repasos.
            </div>
          </div>
          <div>
            <div className="font-semibold text-[var(--text)]">¿Cómo funcionan los repasos?</div>
            <div>El sistema programa tus repasos automáticamente según tu rendimiento.</div>
          </div>
          <div>
            <div className="font-semibold text-[var(--text)]">¿Qué significa “bien aprendidas”?</div>
            <div>Preguntas que ya recuerdas con facilidad y no necesitas ver tan a menudo.</div>
          </div>
          <div>
            <div className="font-semibold text-[var(--text)]">¿Qué es un simulacro oficial?</div>
            <div>25 preguntas con el reparto oficial por tareas.</div>
          </div>
          <div>
            <div className="font-semibold text-[var(--text)]">¿Cómo exporto mi progreso?</div>
            <div>En Más → Ajustes puedes exportar e importar tu progreso.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
