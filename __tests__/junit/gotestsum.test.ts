import * as fs from 'fs'

import { ReporterFactory } from '../../src/junit/factory'
import { Result, Case } from '../../src/junit/reporter'

describe('gotestsum', () => {
  it('should report test results', async () => {
    // table driven tests
    const testCases = [
      {
        name: 'should parse the junit report with no testsuite',
        input: `
        <testsuites tests="0" failures="0" errors="0" time="0.000000">
          <testsuite tests="0" failures="0" time="0.000000" name="." timestamp="2024-10-21T18:16:20+09:00">
             <properties>
               <property name="go.version" value="go1.23.2 linux/amd64"></property>
             </properties>
          </testsuite>
        </testsuites>
        `,
        expected: {
          result: Result.Passed,
          tests: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          time: 0,
          version: '1.23.2',
          failures: []
        }
      },
      {
        name: 'should parse the junit report with testsuite',
        input: `
      <?xml version="1.0" encoding="UTF-8"?>
      <testsuites tests="4" failures="2" errors="0" time="0.001000">
        <testsuite tests="2" failures="1" time="0.001000" name="foo" timestamp="2024-09-17T21:07:31+09:00">
          <properties>
            <property name="go.version" value="go1.22.1 linux/amd64"></property>
          </properties>
          <testcase classname="foo/bar" name="Test1" time="0.000000"></testcase>
          <testcase classname="foo/bar" name="Test2" time="0.000000">
            <failure message="Failed" type="">=== RUN   Test2&#xA;    baz_test.go:1: error;</failure>
          </testcase>
        </testsuite>
        <testsuite tests="2" failures="1" time="0.001000" name="foo" timestamp="2024-09-17T21:07:31+09:00">
          <properties>
            <property name="go.version" value="go1.22.1 linux/amd64"></property>
          </properties>
          <testcase classname="foo/bar" name="Test3" time="0.000000"></testcase>
          <testcase classname="foo/bar" name="Test4" time="0.000000">
            <failure message="Failed" type="">=== RUN   Test4&#xA;--- FAIL: Test4 (0.00s)&#xA;</failure>
          </testcase>
        </testsuite>
      </testsuites>
      `,
        expected: {
          result: Result.Failed,
          tests: 4,
          passed: 2,
          failed: 2,
          skipped: 0,
          time: 0.001,
          version: '1.22.1',
          failures: [
            {
              subDir: 'foo/bar',
              file: 'baz_test.go',
              line: 1,
              test: 'Test2',
              message: '=== RUN   Test2\n    baz_test.go:1: error;'
            }
          ]
        }
      }
    ]

    for (const { name, input, expected } of testCases) {
      const readFileMock = jest
        .spyOn(fs.promises, 'readFile')
        .mockResolvedValue(input)
      const report = await ReporterFactory.fromXml('test', 'path/to/junit.xml')
      expect(report.result).toBe(expected.result)
      expect(report.tests).toBe(expected.tests)
      expect(report.passed).toBe(expected.passed)
      expect(report.failed).toBe(expected.failed)
      expect(report.skipped).toBe(expected.skipped)
      expect(report.time).toBe(expected.time)
      expect(report.version).toBe(expected.version)
      expect(report.failures).toEqual(expected.failures as Case[])
      expect(readFileMock).toHaveBeenCalledWith('path/to/junit.xml', {
        encoding: 'utf8'
      })
    }
  })
})
