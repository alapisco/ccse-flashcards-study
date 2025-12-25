import { normalizeDataset, validateDataset, type DatasetValidationError } from '../domain/validateDataset'
import type { Dataset, Question, Tarea } from '../domain/types'
import { asTareaId } from '../domain/validateDataset'

// Vite will emit this JSON as an asset and give us its URL.
import questionsUrl from '../../questions.json?url'

type RawTask = { id: number; name: string }

type RawQuestion = Omit<Question, 'tareaId'> & {
  taskId?: number
  tareaId?: number
}

type RawDump = {
  datasetVersion?: string
  questions: RawQuestion[]
  tasks?: RawTask[]
  tareas?: RawTask[]
}

function toCanonical(raw: RawDump): Dataset {
  const tasks = raw.tareas ?? raw.tasks ?? []

  const tareas: Tarea[] = tasks
    .map((t) => {
      const tareaId = asTareaId(t.id)
      if (!tareaId) return null
      return { id: tareaId, name: t.name }
    })
    .filter((x): x is Tarea => x !== null)

  const questions: Question[] = raw.questions.map((q) => {
    const { taskId, tareaId: tareaIdFromDump, ...rest } = q

    const tareaId = asTareaId(Number(tareaIdFromDump ?? taskId))
    // Keep a safe default; validation will surface the issue.
    return {
      ...rest,
      tareaId: tareaId ?? 1,
    }
  })

  return normalizeDataset({
    datasetVersion: 'ccse-2-26',
    tareas,
    questions,
  })
}

export async function loadDataset(): Promise<{ dataset: Dataset; errors: DatasetValidationError[] }> {
  const res = await fetch(questionsUrl)
  if (!res.ok) {
    return {
      dataset: normalizeDataset({ datasetVersion: 'ccse-2-26', tareas: [], questions: [] }),
      errors: [
        {
          code: 'missing_dataset_version',
          message: `Failed to load questions.json (${res.status})`,
        },
      ],
    }
  }

  const raw = (await res.json()) as RawDump
  const dataset = toCanonical(raw)
  const errors: DatasetValidationError[] = validateDataset(dataset)

  if (raw.datasetVersion && raw.datasetVersion !== 'ccse-2-26') {
    errors.push({
      code: 'missing_dataset_version',
      message: `datasetVersion must be ccse-2-26 (got '${raw.datasetVersion}')`,
    })
  }
  return { dataset, errors }
}
