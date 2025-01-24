import * as path from 'path'

import { JUnitReport, GolangCILintReporter } from './type'
import { ReporterType, Result, GitHubContext } from '../type'
import { GolangCILintSummaryReportImpl } from 'src/report/golangcilint'
import { FailureReportImpl } from 'src/report/failure'

export class GolangCILintReporterImpl implements GolangCILintReporter {
  constructor(
    readonly context: GitHubContext,
    readonly path: string,
    private readonly _junit: JUnitReport
  ) {}

  get summary(): GolangCILintSummaryReportImpl {
    return new GolangCILintSummaryReportImpl(
      this.context,
      this.path,
      this.result
    )
  }

  get failures(): FailureReportImpl[] {
    if (this._junit.testsuites.testsuite === undefined) {
      return []
    }
    return this._junit.testsuites.testsuite
      .map(
        suite =>
          suite.testcase?.filter(testcase => testcase.failure !== undefined) ??
          []
      )
      .flat()
      .map(testcase => {
        if (testcase.failure === undefined || testcase.failure.length === 0) {
          // This should never happen because golangci-lint testcases must have a failure
          throw new Error('golangci-lint test case has no failure')
        }
        if (testcase.failure.length > 1) {
          // This should never happen because golangci-lint testcases must have only one failure
          throw new Error('golangci-lint test case has multiple failures')
        }

        // Input: go/app/bar_test.go:56:78: Error: Foo: Bar
        // Output: Error: Foo: Bar
        const message = testcase.failure[0].$.message
          .split(': ')
          .slice(1)
          .join(': ')
          .trim()

        // Input:
        //   classname: path/to/file.go:line:column
        // Output:
        //   file: file.go
        //   subDir: path/to
        //   line: line
        const [fullPath, line] = testcase.$.classname.split(':')
        const file = path.basename(fullPath)
        const subDir = path.dirname(fullPath)
        return new FailureReportImpl(
          this.context,
          ReporterType.GolangCILint,
          this.path,
          subDir,
          file,
          parseInt(line),
          testcase.$.name,
          message
        )
      })
  }

  private get result(): Result {
    // Passed if there are no test suites, because golangci-lint reports only failures
    return this._junit.testsuites.testsuite === undefined
      ? Result.Passed
      : Result.Failed
  }

  private get tests(): number {
    return (
      this._junit.testsuites.testsuite?.reduce(
        (acc, suite) => acc + parseInt(suite.$.tests),
        0
      ) ?? 0
    )
  }

  // This should always be 0 because golangci-lint reports only failures
  private get passed(): number {
    return this.tests - this.failed
  }

  private get failed(): number {
    return (
      this._junit.testsuites.testsuite?.reduce(
        (acc, suite) => acc + parseInt(suite.$.failures),
        0
      ) ?? 0
    )
  }

  private get skipped(): number {
    return (
      this._junit.testsuites.testsuite?.reduce(
        (acc, suite) => acc + parseInt(suite.$.skipped ?? '0'),
        0
      ) ?? 0
    )
  }

  private get time(): undefined {
    return undefined
  }

  private get version(): undefined {
    return undefined
  }
}
