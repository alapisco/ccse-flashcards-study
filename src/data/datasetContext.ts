import { createContext, useContext } from 'react'
import type { Dataset } from '../domain/types'
import type { DatasetValidationError } from '../domain/validateDataset'

export type DatasetState = {
  dataset: Dataset | null
  errors: DatasetValidationError[]
  loading: boolean
}

export const DatasetContext = createContext<DatasetState | null>(null)

export function useDataset(): DatasetState {
  const ctx = useContext(DatasetContext)
  if (!ctx) {
    throw new Error('useDataset must be used within DatasetProvider')
  }
  return ctx
}
