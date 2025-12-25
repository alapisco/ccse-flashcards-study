import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { cn } from '../ui/cn'

export function PracticarPage() {
  const location = useLocation()
  const isTareas = location.pathname.startsWith('/practicar/tareas')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Practicar</div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[var(--surface)] p-2">
        <Segment to="/practicar/tareas" label="Por tarea" />
        <Segment to="/practicar/banco" label="Todas las preguntas" />
      </div>

      <div className="text-xs text-[var(--muted)]">
        {isTareas
          ? 'Practica solo una tarea (útil si quieres reforzar un tema).'
          : 'Busca por ID o texto y consulta el banco completo.'}
      </div>

      <Outlet />
    </div>
  )
}

function Segment(props: { to: string; label: string }) {
  return (
    <NavLink
      to={props.to}
      className={({ isActive }) =>
        cn(
          'rounded-xl px-3 py-2 text-center text-sm',
          isActive ? 'bg-white font-semibold' : 'text-[var(--muted)]',
        )
      }
    >
      {props.label}
    </NavLink>
  )
}
