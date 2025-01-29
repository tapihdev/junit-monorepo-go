import {
  GotestsumSummaryReport,
  GolangCILintSummaryReport,
  FailureReport,
  SummaryReport
} from '../report/type'
import { Result } from '../type'

export interface Reportable<T extends SummaryReport> {
  readonly result: Result
  readonly path: string
  readonly summary: T
  readonly failures: FailureReport[]
}

export type AnyReporter = GotestsumReporter | GolangCILintReporter

export type GotestsumReporter = Reportable<GotestsumSummaryReport>
export type GolangCILintReporter = Reportable<GolangCILintSummaryReport>

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
