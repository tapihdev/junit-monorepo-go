import * as fs from 'fs'

import { ReporterFactory } from '../../src/junit/factory'
import { Result, Case } from '../../src/junit/reporter'

describe('gotestsum', () => {
  it('should parse the junit report with no testsuite', async () => {
    const readFileMock = jest.spyOn(fs.promises, 'readFile').mockResolvedValue(`
      <testsuites tests="0" failures="0" errors="0" time="0.000000">
        <testsuite tests="0" failures="0" time="0.000000" name="." timestamp="2024-10-21T18:16:20+09:00">
           <properties>
             <property name="go.version" value="go1.23.2 linux/amd64"></property>
           </properties>
        </testsuite>
      </testsuites>
      `)

    const report = await ReporterFactory.fromXml('test', 'path/to/junit.xml')
    expect(report.result).toBe(Result.Passed)
    expect(report.tests).toBe(0)
    expect(report.passed).toBe(0)
    expect(report.failed).toBe(0)
    expect(report.skipped).toBe(0)
    expect(report.time).toBe(0)
    expect(report.version).toBe('1.23.2')
    expect(report.failures).toEqual([] as Case[])
    expect(readFileMock).toHaveBeenNthCalledWith(1, 'path/to/junit.xml', {
      encoding: 'utf8'
    })
  })

  it('should parse the junit report with testsuites', async () => {
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

    const report = await ReporterFactory.fromXml('test', 'path/to/junit.xml')
    expect(report.result).toBe(Result.Failed)
    expect(report.tests).toBe(4)
    expect(report.passed).toBe(2)
    expect(report.failed).toBe(2)
    expect(report.skipped).toBe(0)
    expect(report.time).toBe(0.001)
    expect(report.version).toBe('1.22.1')
    expect(report.failures).toEqual([
      {
        subDir: 'foo/bar',
        file: 'baz_test.go',
        line: 1,
        test: 'Test2',
        message: '=== RUN   Test2\n    baz_test.go:1: error;'
      }
    ] as Case[])
    expect(readFileMock).toHaveBeenNthCalledWith(1, 'path/to/junit.xml', {
      encoding: 'utf8'
    })
  })
})
