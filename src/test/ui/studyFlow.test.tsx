import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '../../app/AppShell'
import { EstudiarPage } from '../../pages/EstudiarPage'
import { SessionRunnerPage } from '../../pages/SessionRunnerPage'
import { StudySummaryPage } from '../../pages/StudySummaryPage'
import { useAppStore } from '../../store/useAppStore'
import { TestDatasetProvider } from '../fixtures/TestDatasetProvider'
import { makeDatasetWithMinimumSimulacro } from '../fixtures/makeDataset'

function TestRoutes() {
  return (
    <TestDatasetProvider dataset={makeDatasetWithMinimumSimulacro()}>
      <MemoryRouter initialEntries={['/estudiar']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/estudiar" element={<EstudiarPage />} />
            <Route path="/estudiar/sesion" element={<SessionRunnerPage />} />
            <Route path="/estudiar/resumen" element={<StudySummaryPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </TestDatasetProvider>
  )
}

describe('UI: study flow', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.setState({ settings: useAppStore.getState().settings, progressById: {}, activeSession: null })
  })

  it('can start a short session and answer one question', async () => {
    const user = userEvent.setup()
    render(<TestRoutes />)

    await user.click(screen.getByText('Corta'))
    await user.click(screen.getByRole('button', { name: 'Empezar sesión — 10 preguntas' }))

    expect(await screen.findByText(/Pregunta 1\/10/)).toBeInTheDocument()

    // pick option a) then respond
    await user.click(screen.getByText(/a\)/))
    await user.click(screen.getByRole('button', { name: 'Responder' }))

    // should require confidence before next when correct
    expect(await screen.findByText(/Respuesta correcta/)).toBeInTheDocument()
    const next = screen.getByRole('button', { name: 'Siguiente' })
    expect(next).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'La sabía' }))
    expect(next).not.toBeDisabled()
  })
})
