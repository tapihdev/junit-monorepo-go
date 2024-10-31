import * as fs from 'fs'

import { ReporterFactory } from '../../src/junit/factory'
import { Result, Case } from '../../src/junit/reporter'

describe('golangcilint', () => {
  it('should parse the junit report with no failure', async () => {
    const readFileMock = jest.spyOn(fs.promises, 'readFile').mockResolvedValue(`
    <testsuites></testsuites>
    `)
    const report = await ReporterFactory.fromXml('lint', 'path/to/junit.xml')
    expect(report.result).toBe(Result.Passed)
    expect(report.tests).toBe(0)
    expect(report.passed).toBe(0)
    expect(report.failed).toBe(0)
    expect(report.skipped).toBe(0)
    expect(report.time).toBeUndefined()
    expect(report.version).toBeUndefined()
    expect(report.failures).toEqual([] as Case[])
    expect(readFileMock).toHaveBeenNthCalledWith(1, 'path/to/junit.xml', {
      encoding: 'utf8'
    })
  })

  it('should parse the junit report with failures', async () => {
    const readFileMock = jest.spyOn(fs.promises, 'readFile').mockResolvedValue(`
    <testsuites>
      <testsuite name="go/app/foo_test.go" tests="3" errors="0" failures="3">
        <testcase name="errcheck" classname="go/app/foo_test.go:12:34">
          <failure message="go/app/foo_test.go:39:21: Error" type=""><![CDATA[: Error
Category: errcheck
File: go/app/foo_test.go
Line: 12
Details: Foo]]></failure>
        </testcase>
      </testsuite>
      <testsuite name="go/app/bar_test.go" tests="2" errors="0" failures="2">
        <testcase name="errcheck" classname="go/app/bar_test.go:56:78">
          <failure message="go/app/bar_test.go:56:78: Error" type=""><![CDATA[: Error
Category: errcheck
File: go/app/bar_test.go
Line: 56
Details: Bar]]></failure>
        </testcase>
      </testsuite>
    </testsuites>
    `)

    const report = await ReporterFactory.fromXml('lint', 'path/to/junit.xml')
    expect(report.result).toBe(Result.Failed)
    expect(report.tests).toBe(5)
    expect(report.passed).toBe(0)
    expect(report.failed).toBe(5)
    expect(report.skipped).toBe(0)
    expect(report.time).toBeUndefined()
    expect(report.version).toBeUndefined()
    expect(report.failures).toEqual([
      {
        subDir: 'go/app',
        file: 'foo_test.go',
        line: 12,
        test: 'errcheck',
        message: 'Error'
      },
      {
        subDir: 'go/app',
        file: 'bar_test.go',
        line: 56,
        test: 'errcheck',
        message: 'Error'
      }
    ] as Case[])
    expect(readFileMock).toHaveBeenNthCalledWith(1, 'path/to/junit.xml', {
      encoding: 'utf8'
    })
  })
})
