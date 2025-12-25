import { TAREA_IDS, type Dataset, type Question, type TareaId } from './types'

export type DatasetValidationError = {
  code:
    | 'missing_dataset_version'
    | 'duplicate_question_id'
    | 'invalid_tarea_id'
    | 'answer_not_in_options'
    | 'missing_tarea_definition'
  message: string
  questionId?: string
}

function inferType(question: Question): 'mcq' | 'tf' {
  return question.options.length === 2 ? 'tf' : 'mcq'
}

export function normalizeDataset(dataset: Dataset): Dataset {
  return {
    ...dataset,
    questions: dataset.questions.map((q) => ({
      ...q,
      type: q.type ?? inferType(q),
    })),
  }
}

export function validateDataset(dataset: Dataset): DatasetValidationError[] {
  const errors: DatasetValidationError[] = []

  if (dataset.datasetVersion !== 'ccse-2-26') {
    errors.push({
      code: 'missing_dataset_version',
      message: 'datasetVersion must be ccse-2-26',
    })
  }

  const tareaIdsInDataset = new Set<number>(dataset.tareas.map((t) => t.id))
  const seen = new Set<string>()

  for (const q of dataset.questions) {
    if (seen.has(q.id)) {
      errors.push({
        code: 'duplicate_question_id',
        message: `Duplicate question id: ${q.id}`,
        questionId: q.id,
      })
    }
    seen.add(q.id)

    if (!TAREA_IDS.includes(q.tareaId)) {
      errors.push({
        code: 'invalid_tarea_id',
        message: `Invalid tareaId for question ${q.id}: ${q.tareaId}`,
        questionId: q.id,
      })
    }

    if (!tareaIdsInDataset.has(q.tareaId)) {
      errors.push({
        code: 'missing_tarea_definition',
        message: `Missing tarea definition for tareaId ${q.tareaId} (question ${q.id})`,
        questionId: q.id,
      })
    }

    const letters = new Set(q.options.map((o) => o.letter))
    if (!letters.has(q.answer)) {
      errors.push({
        code: 'answer_not_in_options',
        message: `Answer '${q.answer}' not found in options for question ${q.id}`,
        questionId: q.id,
      })
    }
  }

  // Ensure tareas cover 1..5 at least once (soft check: only if any question references them)
  for (const tareaId of TAREA_IDS) {
    const referenced = dataset.questions.some((q) => q.tareaId === tareaId)
    if (referenced && !tareaIdsInDataset.has(tareaId)) {
      errors.push({
        code: 'missing_tarea_definition',
        message: `Missing tarea definition for tareaId ${tareaId}`,
      })
    }
  }

  return errors
}

export function asTareaId(value: number): TareaId | null {
  return (TAREA_IDS as readonly number[]).includes(value) ? (value as TareaId) : null
}
