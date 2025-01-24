import { Result, ModuleTableRecord } from './type'

import {
  GotestsumSummaryViewImpl,
  GolangCILintSummaryViewImpl
} from './data/summary'
import { FailureSummaryViewImpl } from './data/failure'
import { AnnotationViewImpl } from './data/annotation'
import { GolangCILintReport, GotestsumReport } from './junit/type'
import { Table } from './table'

export type GitHubContext = {
  owner: string
  repo: string
  sha: string
}

export class TableComposer {
  private static undefinedString = '-'

  constructor(
    private readonly tests: GotestsumReport[],
    private readonly lints: GolangCILintReport[]
  ) {}

  result(): Result {
    return [this.tests, this.lints]
      .flat()
      .some(m => m.summary.result === Result.Failed)
      ? Result.Failed
      : Result.Passed
  }

  summary(context: GitHubContext): string {
    const { owner, repo, sha } = context
    const testSummaryRecords = this.tests.map(d => {
      const summaryView = new GotestsumSummaryViewImpl(d.path, d.summary)
      return summaryView.render(owner, repo, sha)
    })
    const lintSummaryRecords = this.lints.map(d => {
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
        lintResult: TableComposer.undefinedString
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
          version: TableComposer.undefinedString,
          testResult: TableComposer.undefinedString,
          testPassed: TableComposer.undefinedString,
          testFailed: TableComposer.undefinedString,
          testElapsed: TableComposer.undefinedString,
          lintResult: r.result
        })
      }
    })

    return new Table(
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
  }

  failures(context: GitHubContext, type: 'test' | 'lint', limit = 10): string {
    const { owner, repo, sha } = context
    const reports = type === 'test' ? this.tests : this.lints
    const failures = reports
      .map(d =>
        d.failures.map(f => {
          const view = new FailureSummaryViewImpl(d.path, f)
          return view.render(owner, repo, sha)
        })
      )
      .flat()
    const testFailuresLimited = failures.slice(0, limit)
    if (failures.length > limit) {
      testFailuresLimited.push({
        file: `:warning: and ${failures.length - limit} more...`,
        test: '-',
        message: '-'
      })
    }

    return new Table(
      { file: 'File', test: 'Case', message: 'Message' },
      { file: ':---', test: ':---', message: ':------' },
      testFailuresLimited
    ).render()
  }

  annotations(): string[] {
    const testAnnotations = this.tests
      .map(d =>
        d.failures.map(f => {
          const view = new AnnotationViewImpl(d.path, f)
          return view.render().body
        })
      )
      .flat()
    const lintAnnotations = this.lints
      .map(d =>
        d.failures.map(f => {
          const view = new AnnotationViewImpl(d.path, f)
          return view.render().body
        })
      )
      .flat()
    return [...testAnnotations, ...lintAnnotations]
  }
}
