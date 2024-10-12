import { TestCase } from './gotestsum'

export enum TestResult {
  Passed = 'passed',
  Failed = 'failed',
  Skipped = 'skipped',
  Unknown = 'unknown'
}

export interface Reportable {
  readonly directory: string
  readonly result: TestResult
  readonly tests: number
  readonly passed: number
  readonly failed: number
  readonly skipped: number
  readonly time: number
  readonly version: string | undefined
  readonly failures: TestCase[]
}
