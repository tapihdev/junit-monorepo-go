export type AnyRecord =
  | ModuleTableRecord
  | FailedTestTableRecord
  | FailedLintTableRecord

export type ModuleTableRecord = {
  name: string
  version: string
  testResult: string
  testPassed: string
  testFailed: string
  testElapsed: string
  lintResult: string
}

export type FailedCaseTableRecord = {
  file: string
  test: string
  message: string
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

export enum Result {
  Passed = 'passed',
  Failed = 'failed',
  Skipped = 'skipped',
  Unknown = 'unknown'
}

export type AnnotationRecord = string
export enum ReporterType {
  GolangCILint = 'golangci-lint',
  Gotestsum = 'gotestsum'
}
