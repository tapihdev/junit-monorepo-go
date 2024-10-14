import * as path from 'path'

export interface JUnitReport {
  readonly directory: string
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

export class TestCase {
  constructor(
    readonly moduleDir: string,
    readonly subDir: string,
    readonly file: string,
    readonly line: number,
    readonly test: string,
    readonly message: string
  ) {}

  get fullPath(): string {
    return path.join(this.moduleDir, this.subDir, this.file)
  }
}
