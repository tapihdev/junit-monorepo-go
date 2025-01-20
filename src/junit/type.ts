import { Result } from '../type'

export enum ReporterType {
  GolangCILint = 'golangci-lint',
  Gotestsum = 'gotestsum'
}

export interface Reporter {
  readonly path: string
  readonly result: Result
  readonly tests: number
  readonly passed: number
  readonly failed: number
  readonly skipped: number
  readonly time?: number
  readonly version?: string
  readonly failures: Case[]
}

export type Case = {
  subDir: string
  file: string
  line: number
  test: string
  message: string
}

// Low level types to parse JUnit XML reports
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
