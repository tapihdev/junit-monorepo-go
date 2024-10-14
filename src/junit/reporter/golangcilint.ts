import * as path from 'path'

import { parseJunitReport, JunitReport as JunitReportXML } from '../xml'
import { JUnitReport, TestResult, TestCase } from '../type'

export class GolangCILintReport implements JUnitReport {
  private constructor(
    private readonly _path: string,
    private readonly _junit: JunitReportXML
  ) {}

  static async fromXml(path: string): Promise<GolangCILintReport> {
    return new GolangCILintReport(path, await parseJunitReport(path))
  }

  get directory(): string {
    const parsed = this._path.split('/').slice(0, -1).join('/')
    return parsed === '' ? '.' : parsed
  }

  get result(): TestResult {
    // Passed if there are no test suites, because golangci-lint reports only failures
    return this._junit.testsuites.testsuite === undefined
      ? TestResult.Passed
      : TestResult.Failed
  }

  get tests(): number {
    return (
      this._junit.testsuites.testsuite?.reduce(
        (acc, suite) => acc + parseInt(suite.$.tests),
        0
      ) ?? 0
    )
  }

  // This should always be 0 because golangci-lint reports only failures
  get passed(): number {
    return this.tests - this.failed
  }

  get failed(): number {
    return (
      this._junit.testsuites.testsuite?.reduce(
        (acc, suite) => acc + parseInt(suite.$.failures),
        0
      ) ?? 0
    )
  }

  get skipped(): number {
    return (
      this._junit.testsuites.testsuite?.reduce(
        (acc, suite) => acc + parseInt(suite.$.skipped ?? '0'),
        0
      ) ?? 0
    )
  }

  get time(): undefined {
    return undefined
  }

  get version(): string | undefined {
    return undefined
  }

  get failures(): TestCase[] {
    return (
      this._junit.testsuites.testsuite
        ?.map(
          suite =>
            suite.testcase?.filter(
              testcase => testcase.failure !== undefined
            ) ?? []
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
          return new TestCase(
            this.directory,
            subDir,
            file,
            parseInt(line),
            testcase.$.name,
            message
          )
        }) ?? []
    )
  }
}