import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '../../app/AppShell'
import { BancoPage } from '../../pages/BancoPage'
import { BancoDetailPage } from '../../pages/BancoDetailPage'
import { useAppStore } from '../../store/useAppStore'
import { TestDatasetProvider } from '../fixtures/TestDatasetProvider'
import { makeDatasetWithMinimumSimulacro } from '../fixtures/makeDataset'

function TestRoutes() {
  return (
    <TestDatasetProvider dataset={makeDatasetWithMinimumSimulacro()}>
      <MemoryRouter initialEntries={['/banco']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/banco" element={<BancoPage />} />
            <Route path="/banco/:id" element={<BancoDetailPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </TestDatasetProvider>
  )
}

describe('UI: banco', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.setState({ settings: useAppStore.getState().settings, progressById: {}, activeSession: null })
  })

  it('filters by search query', async () => {
    const user = userEvent.setup()
    render(<TestRoutes />)

    expect(screen.getByText(/resultados/)).toBeInTheDocument()

    const input = screen.getByPlaceholderText('Buscar por ID o texto…')

    await user.type(input, '1001')

    // should show an item with 1001
    expect(await screen.findByText(/1001/)).toBeInTheDocument()

    // can also search within answer options (not only question text)
    await user.clear(input)
    await user.type(input, 'Verdadero')
    expect(await screen.findByText(/2001/)).toBeInTheDocument()
  })
})
