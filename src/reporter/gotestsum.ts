import { JUnitReport, GotestsumReporter } from './type'
import { ReporterType, Result, GitHubContext } from '../common/type'
import { GotestsumSummaryReportImpl } from '../report/gotestsum'
import { FailureReportImpl } from '../report/failure'

export class GotestsumReporterImpl implements GotestsumReporter {
  // gotestsum reports failures in the following format:
  // 1. === RUN   Test&#xA;    baz_test.go:1: error;
  // 2. === RUN   Test&#xA;--- FAIL: Test (0.00s)&#xA;
  // This line filters out the second format.
  private static failureRegex = /.+\s*([\w\d]+_test.go):(\d+):.+/
  private static goVersoinRegex = /go([\d.]+) ([\w\d/])+/

  constructor(
    readonly context: GitHubContext,
    readonly path: string,
    private readonly _junit: JUnitReport
  ) {}

  get result(): Result {
    if (this._junit.testsuites.$ === undefined) {
      return Result.Unknown
    }

    if (this._junit.testsuites.$.failures !== '0') {
      return Result.Failed
    }

    if (
      this._junit.testsuites.$.skipped !== undefined &&
      this._junit.testsuites.$.skipped !== '0'
    ) {
      return Result.Skipped
    }

    return Result.Passed
  }

  get summary(): GotestsumSummaryReportImpl {
    return new GotestsumSummaryReportImpl(
      this.context,
      this.path,
      this.result,
      this.passed,
      this.failed,
      this.version,
      this.time
    )
  }

  get failures(): FailureReportImpl[] {
    if (this._junit.testsuites.testsuite === undefined) {
      return []
    }

    const casesWithFailures = this._junit.testsuites.testsuite
      .map(suite => suite.testcase ?? [])
      .flat()
      .filter(testcase => testcase.failure !== undefined)

    return casesWithFailures
      .map(testcase => {
        const macthedFailures =
          testcase.failure
            ?.map(
              failure =>
                failure._?.match(GotestsumReporterImpl.failureRegex) ?? null
            )
            .filter(match => match !== null) ?? []

        return macthedFailures.map(match => {
          if (match !== null && match.length !== 3) {
            // This should never happen
            throw new Error(
              `message does match the regex but length is not 3: ${match.groups}`
            )
          }
          const subDir = testcase.$.classname
          const file = match[1]
          const line = parseInt(match[2])
          const message = match[0]
          return new FailureReportImpl(
            this.context,
            ReporterType.Gotestsum,
            this.path,
            subDir,
            file,
            line,
            testcase.$.name,
            message
          )
        })
      })
      .flat()
  }

  private get tests(): number {
    return parseInt(this._junit.testsuites.$?.tests ?? '0')
  }

  private get passed(): number {
    return this.tests === 0 ? 0 : this.tests - this.failed
  }

  private get failed(): number {
    return parseInt(this._junit.testsuites.$?.failures ?? '0')
  }

  private get skipped(): number {
    return parseInt(this._junit.testsuites.$?.skipped ?? '0')
  }

  private get time(): number | undefined {
    const time = this._junit.testsuites.$?.time
    return time === undefined ? undefined : parseFloat(time)
  }

  private get version(): string | undefined {
    if (
      this._junit.testsuites.testsuite === undefined ||
      this._junit.testsuites.testsuite.length === 0
    ) {
      return undefined
    }

    const filtered =
      this._junit.testsuites.testsuite
        ?.map(testsuite => testsuite.properties ?? [])
        .flat()
        .map(({ property }) => property)
        .flat()
        .map(({ $ }) => $)
        .flat()
        .filter(({ name }) => name === 'go.version') ?? []

    if (filtered.length === 0) {
      throw new Error('go.version property not found')
    }

    const set = new Set(filtered.map(({ value }) => value))
    if (set.size !== 1) {
      throw new Error(`multiple go.version properties found: ${set.size}`)
    }

    const property = filtered[0]
    const match = property.value.match(GotestsumReporterImpl.goVersoinRegex)
    if (match === null) {
      throw new Error(`go.version does not match the regex: ${property.value}`)
    }
    if (match !== null && match.length !== 3) {
      throw new Error(
        `go.version does match the regex but length is not 3: ${property.value}`
      )
    }
    return match[1]
  }
}
