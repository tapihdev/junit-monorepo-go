export interface Reportable {
  readonly result: Result
  readonly tests: number
  readonly passed: number
  readonly failed: number
  readonly skipped: number
  readonly time?: number
  readonly version?: string
  readonly failures: Case[]
}

export enum Result {
  Passed = 'passed',
  Failed = 'failed',
  Skipped = 'skipped',
  Unknown = 'unknown'
}

export type Case = {
  subDir: string
  file: string
  line: number
  test: string
  message: string
}
