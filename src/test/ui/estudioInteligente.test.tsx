import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '../../app/AppShell'
import { EstudioSesionPage } from '../../pages/EstudioSesionPage'
import { useAppStore } from '../../store/useAppStore'
import { TestDatasetProvider } from '../fixtures/TestDatasetProvider'
import { makeDatasetWithMinimumSimulacro } from '../fixtures/makeDataset'

function TestRoutes() {
  return (
    <TestDatasetProvider dataset={makeDatasetWithMinimumSimulacro()}>
      <MemoryRouter initialEntries={['/estudio/sesion']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/estudio/sesion" element={<EstudioSesionPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </TestDatasetProvider>
  )
}

describe('UI: estudio inteligente', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.setState({
      settings: useAppStore.getState().settings,
      progressById: {},
      activeSession: null,
      intelligent: useAppStore.getState().intelligent,
    })
  })

  it('lets you answer and requires confidence when correct', async () => {
    const user = userEvent.setup()
    render(<TestRoutes />)

    expect(await screen.findByText('Estudio inteligente')).toBeInTheDocument()

    const firstId = (
      await screen.findAllByText((_, node) => {
        const txt = node?.textContent?.replace(/\s+/g, '') ?? ''
        return /^#[1-5]\d{3}$/.test(txt)
      })
    )[0]?.textContent
      ?.replace(/\s+/g, '')
      .replace('#', '')

    // choose a) and respond (fixture answers are always 'a')
    await user.click(screen.getByText(/a\)/))
    await user.click(screen.getByRole('button', { name: 'Responder' }))

    expect(await screen.findByText(/Respuesta correcta/)).toBeInTheDocument()
    const next = screen.getByRole('button', { name: 'Siguiente' })
    expect(next).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Lo sabía' }))
    expect(next).not.toBeDisabled()

    await user.click(next)

    expect(await screen.findByText(/\b1 respondidas\b/)).toBeInTheDocument()

    const secondId = (
      await screen.findAllByText((_, node) => {
        const txt = node?.textContent?.replace(/\s+/g, '') ?? ''
        return /^#[1-5]\d{3}$/.test(txt)
      })
    )[0]?.textContent
      ?.replace(/\s+/g, '')
      .replace('#', '')
    expect(secondId).not.toEqual(firstId)
  })

  it('does not get stuck on the same question after a wrong answer', async () => {
    const user = userEvent.setup()
    render(<TestRoutes />)

    const firstId = (
      await screen.findAllByText((_, node) => {
        const txt = node?.textContent?.replace(/\s+/g, '') ?? ''
        return /^#[1-5]\d{3}$/.test(txt)
      })
    )[0]?.textContent
      ?.replace(/\s+/g, '')
      .replace('#', '')

    // choose b) to force a wrong answer (correct is always 'a')
    await user.click(screen.getAllByText(/b\)/)[0]!)

    const responderButtons = screen.getAllByRole('button', { name: 'Responder' })
    const responder = responderButtons.find((b) => !b.hasAttribute('disabled')) ?? responderButtons[0]!
    await user.click(responder)

    // Wrong: no confidence required.
    const next = await screen.findByRole('button', { name: 'Siguiente' })
    expect(next).not.toBeDisabled()

    await user.click(next)
    const secondId = (
      await screen.findAllByText((_, node) => {
        const txt = node?.textContent?.replace(/\s+/g, '') ?? ''
        return /^#[1-5]\d{3}$/.test(txt)
      })
    )[0]?.textContent
      ?.replace(/\s+/g, '')
      .replace('#', '')
    expect(secondId).not.toEqual(firstId)
  })
})
