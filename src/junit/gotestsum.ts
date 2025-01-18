import { JUnitReport } from './xml'
import { Reporter, Result, Case } from './reporter'

export class GotestsumReport implements Reporter {
  // gotestsum reports failures in the following format:
  // 1. === RUN   Test&#xA;    baz_test.go:1: error;
  // 2. === RUN   Test&#xA;--- FAIL: Test (0.00s)&#xA;
  // This line filters out the second format.
  private static failureRegex = /.+\s*([\w\d]+_test.go):(\d+):.+/
  private static goVersoinRegex = /go([\d.]+) ([\w\d/])+/

  constructor(
    private readonly _path: string,
    private readonly _junit: JUnitReport
  ) {}

  get path(): string {
    return this._path
  }

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

  get tests(): number {
    return parseInt(this._junit.testsuites.$?.tests ?? '0')
  }

  get passed(): number {
    return this.tests === 0 ? 0 : this.tests - this.failed
  }

  get failed(): number {
    return parseInt(this._junit.testsuites.$?.failures ?? '0')
  }

  get skipped(): number {
    return parseInt(this._junit.testsuites.$?.skipped ?? '0')
  }

  get time(): number | undefined {
    const time = this._junit.testsuites.$?.time
    return time === undefined ? undefined : parseFloat(time)
  }

  get version(): string | undefined {
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
    const match = property.value.match(GotestsumReport.goVersoinRegex)
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

  get failures(): Case[] {
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
              failure => failure._?.match(GotestsumReport.failureRegex) ?? null
            )
            .filter(match => match !== null) ?? []

        return macthedFailures.map(match => {
          if (match !== null && match.length !== 3) {
            // This should never happen
            throw new Error(
              `message does match the regex but length is not 3: ${match.groups}`
            )
          }
          return {
            subDir: testcase.$.classname,
            file: match[1],
            line: parseInt(match[2]),
            test: testcase.$.name,
            message: match[0]
          } as Case
        })
      })
      .flat()
  }
}
