import path from 'path'
import * as fs from 'fs'
import { parseStringPromise } from 'xml2js'

import { JunitReport as JunitReportXML } from './xml'

export enum TestResult {
  Passed = 'passed',
  Failed = 'failed',
  Skipped = 'skipped',
  Unknown = 'unknown'
}

export interface Reportable {
  readonly directory: string
  readonly result: TestResult
  readonly tests: number
  readonly passed: number
  readonly failed: number
  readonly skipped: number
  readonly time: number
  readonly version: string
  readonly failures: TestCase[]
}

export class JunitReport implements Reportable {
  private static failureRegex = /\s*([\w\d]+_test.go):(\d+):/
  private static goVersoinRegex = /go([\d.]+) ([\w\d/])+/

  private constructor(
    private readonly _path: string,
    private readonly _junit: JunitReportXML,
    private readonly _found = true
  ) {}

  static unknown(path: string): JunitReport {
    return new JunitReport(
      path,
      {
        testsuites: {
          $: {
            tests: '0',
            errors: '0',
            failures: '0',
            skipped: '0',
            time: '0'
          }
        }
      },
      false
    )
  }

  static async fromXml(path: string): Promise<JunitReport> {
    const content = await fs.promises.readFile(path, { encoding: 'utf8' })
    const junit = (await parseStringPromise(content)) as JunitReportXML
    return new JunitReport(path, junit, true)
  }

  get directory(): string {
    const parsed = this._path.split('/').slice(0, -1).join('/')
    return parsed === '' ? '.' : parsed
  }

  get result(): TestResult {
    if (!this._found) {
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
    return parseInt(this._junit.testsuites.$.tests)
  }

  get passed(): number {
    return this.tests - this.failed
  }

  get failed(): number {
    return parseInt(this._junit.testsuites.$.failures)
  }

  get skipped(): number {
    return this._junit.testsuites.$.skipped !== undefined
      ? parseInt(this._junit.testsuites.$.skipped)
      : 0
  }

  get time(): number {
    return parseFloat(this._junit.testsuites.$.time)
  }

  get version(): string {
    const filtered =
      this._junit.testsuites.testsuite
        ?.map(testsuite => testsuite.properties ?? [])
        .flat()
        .map(({ property }) => property)
        .flat()
        .map(({ $ }) => $)
        .flat()
        .filter(({ name }) => name === 'go.version') ?? []

    const na = '-'
    if (filtered.length === 0) {
      return na
    }

    const set = new Set(filtered.map(({ value }) => value))
    if (set.size !== 1) {
      throw new Error(`multiple go.version properties found: ${set.size}`)
    }
    const property = filtered[0]
    const match = property.value.match(JunitReport.goVersoinRegex)
    if (match !== null && match.length !== 3) {
      // This should never happen
      throw new Error(
        `go.version does match the regex but length is not 3: ${property.value}`
      )
    }
    return match !== null ? match[1] : na
  }

  get failures(): TestCase[] {
    const testsuite = this._junit.testsuites.testsuite
    if (testsuite === undefined) {
      return []
    }

    return testsuite
      .map(suite =>
        suite.testcase === undefined
          ? []
          : suite.testcase.filter(testcase => testcase.failure !== undefined)
      )
      .flat()
      .map(testcase => {
        const message =
          testcase.failure
            ?.map(failure => (failure._ === undefined ? '' : failure._))
            .join('\n') ?? ''
        const match = message.match(JunitReport.failureRegex)
        if (match !== null && match.length !== 3) {
          // This should never happen
          throw new Error(
            `message does match the regex but length is not 3: ${message}`
          )
        }
        return new TestCase(
          this.directory,
          testcase.$.classname,
          match === null ? '' : match[1],
          match === null ? 0 : parseInt(match[2]),
          testcase.$.name,
          message
        )
      })
      .filter(testcase => testcase.file !== '' && testcase.line !== 0)
  }
}

export class TestCase {
  constructor(
    readonly moduleDir: string,
    readonly subDir: string,
    readonly file: string,
    readonly line: number,
    readonly test: string,
    readonly message: string
  ) {}

  get fullPath(): string {
    return path.join(this.moduleDir, this.subDir, this.file)
  }
}
