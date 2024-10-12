import * as fs from 'fs'

import { GolangCILintReport } from '../../src/junit/golangcilint'
import { TestResult, TestCase } from '../../src/junit/type'

describe('golangcilint', () => {
  it('parses the junit report', async () => {
    const readFileMock = jest.spyOn(fs.promises, 'readFile').mockResolvedValue(`
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
      `)

    const report = await GolangCILintReport.fromXml('path/to/junit.xml')
    expect(report.directory).toBe('path/to')
    expect(report.result).toBe(TestResult.Failed)
    expect(report.tests).toBe(4)
    expect(report.passed).toBe(2)
    expect(report.failed).toBe(2)
    expect(report.skipped).toBe(0)
    expect(report.time).toBe(0.001)
    expect(report.version).toBe('1.22.1')
    expect(report.failures).toEqual([
      {
        moduleDir: 'path/to',
        subDir: 'foo/bar',
        file: 'baz_test.go',
        line: 1,
        test: 'Test2',
        message: '=== RUN   Test2\n    baz_test.go:1: error;'
      }
    ] as TestCase[])
    expect(readFileMock).toHaveBeenNthCalledWith(1, 'path/to/junit.xml', {
      encoding: 'utf8'
    })
  })

  it('constructs a unknown report', async () => {
    const report = GolangCILintReport.unknown('path/to/junit.xml')
    expect(report.directory).toBe('path/to')
    expect(report.result).toBe(TestResult.Unknown)
    expect(report.tests).toBe(0)
    expect(report.passed).toBe(0)
    expect(report.failed).toBe(0)
    expect(report.skipped).toBe(0)
    expect(report.time).toBe(0)
    expect(report.version).toBe(undefined)
    expect(report.failures).toEqual([])
  })
})