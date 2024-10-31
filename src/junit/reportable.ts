export interface Reportable {
  readonly result: TestResult
  readonly tests: number
  readonly passed: number
  readonly failed: number
  readonly skipped: number
  readonly time?: number
  readonly version?: string
  readonly failures: TestCase[]
}

export enum TestResult {
  Passed = 'passed',
  Failed = 'failed',
  Skipped = 'skipped',
  Unknown = 'unknown'
}

export type TestCase = {
  subDir: string
  file: string
  line: number
  test: string
  message: string
}
