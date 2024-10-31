import * as fs from 'fs'

import { ReporterFactory } from '../../src/junit/factory'
import { Result, Case } from '../../src/junit/reporter'

describe('golangcilint', () => {
  it('should report lint results', async () => {
    const testCases = [
      {
        name: 'should parse the junit report with no failure',
        input: `
        <testsuites></testsuites>
        `,
        expected: {
          result: Result.Passed,
          tests: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          time: undefined,
          version: undefined,
          failures: []
        }
      },
      {
        name: 'should parse the junit report with testsuites',
        input: `<testsuites>
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
</testsuites>`,
        expected: {
          result: Result.Failed,
          tests: 5,
          passed: 0,
          failed: 5,
          skipped: 0,
          time: undefined,
          version: undefined,
          failures: [
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
          ] as Case[]
        }
      }
    ]

    for (const { name, input, expected } of testCases) {
      const readFileMock = jest
        .spyOn(fs.promises, 'readFile')
        .mockResolvedValue(input)
      const report = await ReporterFactory.fromXml('lint', 'path/to/junit.xml')
      expect(report.result).toBe(expected.result)
      expect(report.tests).toBe(expected.tests)
      expect(report.passed).toBe(expected.passed)
      expect(report.failed).toBe(expected.failed)
      expect(report.skipped).toBe(expected.skipped)
      expect(report.time).toBe(expected.time)
      expect(report.version).toBe(expected.version)
      expect(report.failures).toEqual(expected.failures)
      expect(readFileMock).toHaveBeenNthCalledWith(1, 'path/to/junit.xml', {
        encoding: 'utf8'
      })
    }
  })
})
