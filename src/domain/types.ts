export type TareaId = 1 | 2 | 3 | 4 | 5

export type QuestionType = 'mcq' | 'tf'

export type OptionLetter = string

export type Tarea = {
  id: TareaId
  name: string
}

export type Option = {
  letter: OptionLetter
  text: string
}

export type Question = {
  id: string
  tareaId: TareaId
  question: string
  options: Option[]
  answer: OptionLetter
  type?: QuestionType
}

export type Dataset = {
  datasetVersion: 'ccse-2-26'
  tareas: Tarea[]
  questions: Question[]
}

export const TAREA_IDS: readonly TareaId[] = [1, 2, 3, 4, 5] as const

export const SIMULACRO_DISTRIBUTION: Readonly<Record<TareaId, number>> = {
  1: 10,
  2: 3,
  3: 2,
  4: 3,
  5: 7,
} as const
