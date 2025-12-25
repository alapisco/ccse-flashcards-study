import type { Dataset } from '../../domain/types'
import { DatasetProvider } from '../../data/DatasetProvider'

export function TestDatasetProvider(props: { dataset: Dataset; children: React.ReactNode }) {
  return <DatasetProvider dataset={props.dataset}>{props.children}</DatasetProvider>
}
