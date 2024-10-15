export interface Table<R> {
  header: R
  sperator: R
  records: R[]
}

export type ModuleTable = Table<ModuleTableRecord>
export type FailedTestTable = Table<FailedTestTableRecord>
export type FailedLintTable = Table<FailedLintTableRecord>

export interface ModuleTableRecord {
  link: string
  version: string
  result: string
  passed: string
  failed: string
  skipped: string
  time: string
}

export interface FailedTestTableRecord {
  fileColumn: string
  test: string
  message: string
}

export interface FailedLintTableRecord {
  fileColumn: string
  message: string
}

export interface AnnotationMessage {
  fullPath: string
  line: number
  message: string
}