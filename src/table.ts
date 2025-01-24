import fs from 'fs'

import { Result, AnyRecord, ModuleTableRecord } from './type'

import { SingleJUnitReporterFactoryImpl } from './junit/factory'
import {
  GotestsumSummaryViewImpl,
  GolangCILintSummaryViewImpl
} from './data/summary'
import { FailureSummaryViewImpl } from './data/failure'
import { AnnotationViewImpl } from './data/annotation'
import { GolangCILintReport, GotestsumReport } from './junit/type'

const undefinedString = '-'

export type GitHubContext = {
  owner: string
  repo: string
  sha: string
}

// NOTE: This is a temporary implementation
type Output = {
  result: Result
  moduleTable: string
  failedTestTable: string
  failedLintTable: string
  annotations: string[]
}

export async function report(
  context: GitHubContext,
  tests: GotestsumReport[],
  lints: GolangCILintReport[],
  failedTestLimit: number,
  failedLintLimit: number
): Promise<Output> {
  const { owner, repo, sha } = context

  // result
  const result = [tests, lints]
    .flat()
    .some(m => m.summary.result === Result.Failed)
    ? Result.Failed
    : Result.Passed

  // NOTE: concat(Table[], axis=0)
  const testSummaryRecords = tests.map(d => {
    const summaryView = new GotestsumSummaryViewImpl(d.path, d.summary)
    return summaryView.render(owner, repo, sha)
  })
  const lintSummaryRecords = lints.map(d => {
    const summaryView = new GolangCILintSummaryViewImpl(d.path, d.summary)
    return summaryView.render(owner, repo, sha)
  })
  const summaryRecords = new Map<string, ModuleTableRecord>()
  testSummaryRecords.forEach(r =>
    summaryRecords.set(r.path, {
      name: r.path,
      version: r.version,
      testResult: r.result,
      testPassed: r.passed,
      testFailed: r.failed,
      testElapsed: r.time,
      lintResult: undefinedString
    })
  )
  lintSummaryRecords.forEach(r => {
    const v = summaryRecords.get(r.path)
    if (v !== undefined) {
      summaryRecords.set(r.path, {
        ...v,
        lintResult: r.result
      })
    } else {
      summaryRecords.set(r.path, {
        name: r.path,
        version: undefinedString,
        testResult: undefinedString,
        testPassed: undefinedString,
        testFailed: undefinedString,
        testElapsed: undefinedString,
        lintResult: r.result
      })
    }
  })

  const moduleTable = new Table(
    {
      name: 'Module',
      version: 'Version',
      testResult: 'Test',
      testPassed: 'Passed',
      testFailed: 'Failed',
      testElapsed: 'Time',
      lintResult: 'Lint'
    },
    {
      name: ':-----',
      version: '------:',
      testResult: ':---',
      testPassed: '-----:',
      testFailed: '-----:',
      testElapsed: '---:',
      lintResult: ':---'
    },
    Array.from(summaryRecords.values())
  ).render()

  // NOTE: concat(Table[], axis=1)
  const testFailures = tests
    .map(d =>
      d.failures.map(f => {
        const view = new FailureSummaryViewImpl(d.path, f)
        return view.render(owner, repo, sha)
      })
    )
    .flat()
  const testFailuresLimited = testFailures.slice(0, failedTestLimit)
  if (testFailures.length > failedTestLimit) {
    testFailuresLimited.push({
      file: `:warning: and ${testFailures.length - failedTestLimit} more...`,
      test: '-',
      message: '-'
    })
  }
  const failedTestTable = new Table(
    { file: 'File', test: 'Case', message: 'Message' },
    { file: ':---', test: ':---', message: ':------' },
    testFailuresLimited
  ).render()

  // NOTE: concat(Table[], axis=1)
  const lintFailures = lints
    .map(d =>
      d.failures.map(f => {
        const view = new FailureSummaryViewImpl(d.path, f)
        return view.render(owner, repo, sha)
      })
    )
    .flat()

  const lintFailuresLimited = testFailures.slice(0, failedTestLimit)
  if (testFailures.length > failedTestLimit) {
    testFailuresLimited.push({
      file: `:warning: and ${lintFailures.length - failedLintLimit} more...`,
      test: '-',
      message: '-'
    })
  }

  const failedLintTable = new Table(
    { file: 'File', test: 'Case', message: 'Message' },
    { file: ':---', test: ':---', message: ':------' },
    lintFailuresLimited
  ).render()

  // annotations
  const testAnnotations = tests
    .map(d =>
      d.failures.map(f => {
        const view = new AnnotationViewImpl(d.path, f)
        return view.render().body
      })
    )
    .flat()
  const lintAnnotations = lints
    .map(d =>
      d.failures.map(f => {
        const view = new AnnotationViewImpl(d.path, f)
        return view.render().body
      })
    )
    .flat()
  const annotations = [...testAnnotations, ...lintAnnotations]

  return {
    result,
    moduleTable,
    failedTestTable,
    failedLintTable,
    annotations
  }
}

class Table<T extends AnyRecord> {
  constructor(
    private readonly header: T,
    private readonly separator: T,
    private readonly records: T[]
  ) {}

  get rows(): number {
    return this.records.length
  }

  get columns(): number {
    return Object.keys(this.header).length
  }

  render(): string {
    if (this.rows === 0) {
      return ''
    }

    return [
      `| ${Object.values(this.header).join(' | ')} |`,
      `| ${Object.values(this.separator).join(' | ')} |`,
      ...this.records.map(r => `| ${Object.values(r).join(' | ')} |`)
    ].join('\n')
  }
}
