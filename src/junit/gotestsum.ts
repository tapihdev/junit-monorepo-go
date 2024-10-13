import { parseJunitReport, JunitReport as JunitReportXML } from './xml'
import { JUnitReport, TestResult, TestCase } from './type'

export class GotestsumReport implements JUnitReport {
  private static failureRegex = /\s*([\w\d]+_test.go):(\d+):/
  private static goVersoinRegex = /go([\d.]+) ([\w\d/])+/

  private constructor(
    private readonly _path: string,
    private readonly _junit: JunitReportXML
  ) {}

  static async fromXml(path: string): Promise<GotestsumReport> {
    return new GotestsumReport(path, await parseJunitReport(path))
  }

  get directory(): string {
    const parsed = this._path.split('/').slice(0, -1).join('/')
    return parsed === '' ? '.' : parsed
  }

  get result(): TestResult {
    if (this._junit.testsuites.$ === undefined) {
      return TestResult.Unknown
    }

    if (this._junit.testsuites.$.failures !== '0') {
      return TestResult.Failed
    }

    if (
      this._junit.testsuites.$.skipped !== undefined &&
      this._junit.testsuites.$.skipped !== '0'
    ) {
      return TestResult.Skipped
    }

    return TestResult.Passed
  }

  get tests(): number {
    return parseInt(this._junit.testsuites.$?.tests ?? '0')
  }

  get passed(): number {
    return this.tests - this.failed
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
          const message =
            testcase.failure?.map(failure => failure._ ?? '').join('\n') ?? ''

          const match = message.match(GotestsumReport.failureRegex)
          if (match !== null && match.length !== 3) {
            // This should never happen
            throw new Error(
              `message does match the regex but length is not 3: ${message}`
            )
          }

          // gotestsum reports failures in the following format:
          // 1. === RUN   Test&#xA;    baz_test.go:1: error;
          // 2. === RUN   Test&#xA;--- FAIL: Test (0.00s)&#xA;
          // This function takes only the first one and extracts the file and line number.
          return new TestCase(
            this.directory,
            testcase.$.classname,
            match === null ? '' : match[1],
            match === null ? 0 : parseInt(match[2]),
            testcase.$.name,
            message
          )
        })
        .filter(testcase => testcase.file !== '' && testcase.line !== 0) ?? []
    )
  }
}
