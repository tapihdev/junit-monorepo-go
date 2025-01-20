import { Result } from '../type'

export enum ReporterType {
  GolangCILint = 'golangci-lint',
  Gotestsum = 'gotestsum'
}

// Reportable represents a JUnit report with a summary and a list of failed cases
export interface Reportable<T extends Summary> {
  readonly path: string
  readonly summary: T
  readonly failures: Case[]
}

export type Reporter = GotestsumReport | GolangCILintReport
export type GotestsumReport = Reportable<GotestsumSummary>
export type GolangCILintReport = Reportable<GolangCILintSummary>

// Summary represents a summary of a JUnit report
export type Summary = GotestsumSummary | GolangCILintSummary
export type GotestsumSummary = {
  result: Result
  passed: number
  failed: number
  time?: number
  version?: string
}
export type GolangCILintSummary = {
  result: Result
}

// Case represents a failed test case
export type Case = {
  subDir: string
  file: string
  line: number
  test: string
  message: string
}

// Raw schema of a JUnit report
export type JUnitReport = {
  testsuites: TestSuites
}

export type TestSuites = {
  $?: {
    tests: string
    errors: string
    failures: string
    skipped?: string
    time: string
  }
  testsuite?: TestSuite[]
}

type TestSuite = {
  $: {
    name: string
    tests: string
    errors?: string
    failures: string
    skipped?: string
    time?: string
    timestamp?: string
  }
  testcase?: TestCase[]
  properties?: Property[]
}

type Property = {
  property: [
    {
      $: {
        name: string
        value: string
      }
    }
  ]
}

type TestCase = {
  $: {
    classname: string
    file?: string
    name: string
    time?: string
  }
  failure?: Test[]
  skipped?: Test[]
}

type Test = {
  $: {
    message: string
    type: string
  }
  _?: string
}
