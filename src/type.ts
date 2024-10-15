export type AnyRecord =
  | ModuleTableRecord
  | FailedTestTableRecord
  | FailedLintTableRecord

export type ModuleTableRecord = {
  name: string
  version: string
  result: string
  passed: string
  failed: string
  skipped: string
  time: string
}

export type FailedTestTableRecord = {
  file: string
  test: string
  message: string
}

export type FailedLintTableRecord = {
  file: string
  test: string
  message: string
}
