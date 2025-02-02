import {
  ReportableGotestsumSummary,
  ReportableGolangCILintSummary,
  ReportableFailure,
  ReportableSummary
} from '../report/type'
import { Result } from '../common/type'

export interface Parsable<T extends ReportableSummary> {
  readonly path: string
  readonly result: Result
  readonly summary: T
  readonly failures: ReportableFailure[]
}

export type AnyParsable = ParsableGotestsum | ParsableGolangCILint

export type ParsableGotestsum = Parsable<ReportableGotestsumSummary>
export type ParsableGolangCILint = Parsable<ReportableGolangCILintSummary>

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
