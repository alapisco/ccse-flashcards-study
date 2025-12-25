import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BookOpen, Home, Settings, Target, ClipboardList } from 'lucide-react'
import { cn } from '../ui/cn'
import { useAppStore } from '../store/useAppStore'

export function AppShell() {
  const location = useLocation()
  const activeSession = useAppStore((s) => s.activeSession)

  const hideBottomNav = activeSession?.kind === 'simulacro' && location.pathname === '/simulacro/run'

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col">
        <header className="px-4 pb-3 pt-4 text-center">
          <div className="text-sm font-semibold tracking-tight">Preparación CCSE 2026</div>
        </header>

        <main className={cn('flex-1 px-4', hideBottomNav ? 'pb-6' : 'pb-24')}>
          <Outlet />
        </main>

        {!hideBottomNav ? (
          <nav className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-[var(--bg)]">
            <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-2">
              <NavItem to="/" label="Inicio" icon={<Home className="h-5 w-5" />} />
              <NavItem to="/estudio" label="Estudio" icon={<BookOpen className="h-5 w-5" />} />
              <NavItem to="/practicar" label="Preguntas" icon={<Target className="h-5 w-5" />} />
              <NavItem to="/simulacro" label="Simulacro" icon={<ClipboardList className="h-5 w-5" />} />
              <NavItem to="/ajustes" label="Ajustes" icon={<Settings className="h-5 w-5" />} />
            </div>
          </nav>
        ) : null}
      </div>
    </div>
  )
}

function NavItem(props: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <NavLink
      to={props.to}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs',
          isActive ? 'text-[var(--ic-accent)]' : 'text-[var(--muted)]',
        )
      }
    >
      {props.icon}
      <span>{props.label}</span>
    </NavLink>
  )
}
