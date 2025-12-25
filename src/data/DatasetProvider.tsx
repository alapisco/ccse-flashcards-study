import { useEffect, useMemo, useState } from 'react'
import type { Dataset } from '../domain/types'
import type { DatasetValidationError } from '../domain/validateDataset'
import { loadDataset } from './loadDataset'
import { DatasetContext, type DatasetState } from './datasetContext'

export function DatasetProvider(props: {
  children: React.ReactNode
  dataset?: Dataset
  errors?: DatasetValidationError[]
}) {
  const [state, setState] = useState<DatasetState>(() => ({
    dataset: props.dataset ?? null,
    errors: props.errors ?? [],
    loading: !props.dataset,
  }))

  useEffect(() => {
    if (props.dataset) return
    let alive = true
    loadDataset()
      .then((result) => {
        if (!alive) return
        setState({ dataset: result.dataset, errors: result.errors, loading: false })
      })
      .catch((e) => {
        if (!alive) return
        setState({
          dataset: null,
          errors: [
            {
              code: 'missing_dataset_version',
              message: `Failed to load dataset: ${String(e)}`,
            },
          ],
          loading: false,
        })
      })

    return () => {
      alive = false
    }
  }, [props.dataset])

  const value = useMemo<DatasetState>(() => {
    if (props.dataset) {
      return { dataset: props.dataset, errors: props.errors ?? [], loading: false }
    }
    return state
  }, [props.dataset, props.errors, state])

  return <DatasetContext.Provider value={value}>{props.children}</DatasetContext.Provider>
}
