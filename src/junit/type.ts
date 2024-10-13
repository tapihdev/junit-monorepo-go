import * as path from 'path'

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
  readonly time: number | undefined
  readonly version: string | undefined
  readonly failures: TestCase[]
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
