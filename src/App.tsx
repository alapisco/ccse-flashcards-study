import './App.css'

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { DatasetProvider } from './data/DatasetProvider'
import { useDataset } from './data/datasetContext'
import { AjustesPage } from './pages/AjustesPage'
import { ApuntesPage } from './pages/ApuntesPage'
import { BancoDetailPage } from './pages/BancoDetailPage'
import { BancoPage } from './pages/BancoPage'
import { AyudaPage } from './pages/AyudaPage'
import { EstudioPage } from './pages/EstudioPage'
import { EstudioSesionPage } from './pages/EstudioSesionPage'
import { EstudioTareasPage } from './pages/EstudioTareasPage'
import { EstadisticasPage } from './pages/EstadisticasPage'
import { InicioPage } from './pages/InicioPage'
import { PracticarTareasPage } from './pages/PracticarTareasPage'
import { SimulacroPage } from './pages/SimulacroPage'
import { SimulacroResultadosPage, SimulacroRunnerPage } from './pages/SimulacroRunnerPage'

export default function App() {
  return (
    <DatasetProvider>
      <AppRoutes />
    </DatasetProvider>
  )
}

function AppRoutes() {
  const { loading, errors } = useDataset()

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route
            path="/"
            element={
              <div className="space-y-3">
                {loading ? (
                  <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
                    Cargando preguntas…
                  </div>
                ) : null}

                {!loading && errors.length > 0 ? (
                  <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">
                    <div className="font-semibold">Dataset inválido</div>
                    <div className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                      {errors.slice(0, 6).map((e, idx) => (
                        <div key={idx}>{e.message}</div>
                      ))}
                      {errors.length > 6 ? <div>… ({errors.length} errores)</div> : null}
                    </div>
                  </div>
                ) : null}

                <InicioPage />
              </div>
            }
          />
          {/* vNext */}
          <Route path="/estudio" element={<EstudioPage />} />
          <Route path="/estudio/sesion" element={<EstudioSesionPage />} />
          <Route path="/estudio/tareas" element={<EstudioTareasPage />} />
          <Route path="/practicar" element={<BancoPage />} />
          <Route path="/practicar/tareas" element={<PracticarTareasPage />} />
          <Route path="/practicar/banco" element={<Navigate to="/practicar" replace />} />
          <Route path="/practicar/banco/:id" element={<BancoDetailPage />} />
          <Route path="/ajustes" element={<AjustesPage />} />
          <Route path="/estadisticas" element={<EstadisticasPage />} />
          <Route path="/ayuda" element={<AyudaPage />} />
          <Route path="/apuntes" element={<ApuntesPage />} />

          {/* Legacy */}
          <Route path="/estudiar" element={<Navigate to="/estudio" replace />} />
          <Route path="/estudiar/sesion" element={<Navigate to="/estudio/sesion" replace />} />
          <Route path="/estudiar/resumen" element={<Navigate to="/" replace />} />

          <Route path="/simulacro" element={<SimulacroPage />} />
          <Route path="/simulacro/run" element={<SimulacroRunnerPage />} />
          <Route path="/simulacro/result" element={<SimulacroResultadosPage />} />

          <Route path="/simulacro/sesion" element={<Navigate to="/simulacro/run" replace />} />
          <Route path="/simulacro/resultados" element={<Navigate to="/simulacro/result" replace />} />

          <Route path="/banco" element={<Navigate to="/practicar" replace />} />
          <Route path="/banco/:id" element={<BancoDetailPage />} />

          <Route path="/mas" element={<Navigate to="/ajustes" replace />} />
          <Route path="/mas/ajustes" element={<Navigate to="/ajustes" replace />} />
          <Route path="/mas/estadisticas" element={<Navigate to="/ajustes" replace />} />
          <Route path="/mas/ayuda" element={<Navigate to="/ayuda" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
