import { Module } from '../src/module'
import { GotestsumReport } from '../src/junit/reporter/gotestsum'
import { JUnitReport, TestResult, TestCase } from '../src/junit/type'
import {
  ModuleTableRecord,
  FailedTestTableRecord,
  FailedLintTableRecord
} from '../src/type'

describe('module', () => {
  it('constructs a module', async () => {
    const fromXMLMock = jest
      .spyOn(GotestsumReport, 'fromXml')
      .mockResolvedValue(new GotestsumReport('path/to', { testsuites: {} }))
    const module = await Module.fromXml('path/to', 'junit.xml')
    expect(module.directory).toBe('path/to')
    expect(fromXMLMock).toHaveBeenCalledWith('path/to/junit.xml')
  })

  it('makes a module table record with test', async () => {
    const module = new Module('path/to', {
      result: TestResult.Passed,
      tests: 4,
      passed: 3,
      failed: 1,
      skipped: 0,
      time: 1.1,
      version: '1.22.1',
      failures: []
    } as JUnitReport)

    expect(module.result).toBe(TestResult.Passed)
    expect(module.makeModuleTableRecord('owner', 'repo', 'sha')).toEqual({
      name: '[path/to](https://github.com/owner/repo/blob/sha/path/to)',
      version: '1.22.1',
      testResult: '✅Passed',
      testPassed: '3',
      testFailed: '1',
      testElapsed: '1.1s',
      lintResult: '-'
    } as ModuleTableRecord)
  })

  it('makes a module table record with test and lint', async () => {
    const module = new Module(
      'path/to',
      {
        result: TestResult.Passed,
        tests: 4,
        passed: 3,
        failed: 1,
        skipped: 0,
        time: 1.1,
        version: '1.22.1',
        failures: []
      } as JUnitReport,
      {
        result: TestResult.Failed,
        tests: 4,
        passed: 3,
        failed: 1,
        skipped: 0,
        failures: [
          new TestCase(
            'foo/bar',
            'baz_test.go',
            1,
            'Test1',
            'error1\noccurred'
          ),
          new TestCase('foo/bar', 'baz_test.go', 2, 'Test2', 'error2\noccurred')
        ]
      } as JUnitReport
    )

    expect(module.result).toBe(TestResult.Failed)
    expect(module.makeModuleTableRecord('owner', 'repo', 'sha')).toEqual({
      name: '[path/to](https://github.com/owner/repo/blob/sha/path/to)',
      version: '1.22.1',
      testResult: '✅Passed',
      testPassed: '3',
      testFailed: '1',
      testElapsed: '1.1s',
      lintResult: '❌Failed'
    } as ModuleTableRecord)
  })

  it('makes a failed test table record', async () => {
    const module = new Module('path/to', {
      result: TestResult.Failed,
      tests: 4,
      passed: 3,
      failed: 1,
      skipped: 0,
      time: 1.1,
      version: '1.22.1',
      failures: [
        new TestCase('foo/bar', 'baz_test.go', 1, 'Test1', 'error1\noccurred'),
        new TestCase('foo/bar', 'baz_test.go', 2, 'Test2', 'error2\noccurred')
      ]
    } as JUnitReport)

    expect(module.result).toBe(TestResult.Failed)
    expect(module.makeFailedTestTableRecords('owner', 'repo', 'sha')).toEqual([
      {
        file: '[path/to/foo/bar/baz_test.go:1](https://github.com/owner/repo/blob/sha/path/to/foo/bar/baz_test.go#L1)',
        test: 'Test1',
        message: 'error1 occurred'
      },
      {
        file: '[path/to/foo/bar/baz_test.go:2](https://github.com/owner/repo/blob/sha/path/to/foo/bar/baz_test.go#L2)',
        test: 'Test2',
        message: 'error2 occurred'
      }
    ] as FailedTestTableRecord[])
  })

  it('makes a failed lint table record', async () => {
    const module = new Module(
      'path/to',
      {
        result: TestResult.Failed,
        tests: 4,
        passed: 3,
        failed: 1,
        skipped: 0,
        time: 1.1,
        version: '1.22.1',
        failures: []
      } as JUnitReport,
      {
        result: TestResult.Failed,
        tests: 4,
        passed: 3,
        failed: 1,
        skipped: 0,
        failures: [
          new TestCase(
            'foo/bar',
            'baz_test.go',
            1,
            'Test1',
            'error1\noccurred'
          ),
          new TestCase('foo/bar', 'baz_test.go', 2, 'Test2', 'error2\noccurred')
        ]
      } as JUnitReport
    )

    expect(module.result).toBe(TestResult.Failed)
    expect(module.makeFailedLintTableRecords('owner', 'repo', 'sha')).toEqual([
      {
        file: '[path/to/foo/bar/baz_test.go:1](https://github.com/owner/repo/blob/sha/path/to/foo/bar/baz_test.go#L1)',
        test: 'Test1',
        message: 'error1 occurred'
      },
      {
        file: '[path/to/foo/bar/baz_test.go:2](https://github.com/owner/repo/blob/sha/path/to/foo/bar/baz_test.go#L2)',
        test: 'Test2',
        message: 'error2 occurred'
      }
    ] as FailedLintTableRecord[])
  })

  it('makes annotation messages', async () => {
    const module = new Module('path/to', {
      result: TestResult.Failed,
      tests: 4,
      passed: 3,
      failed: 1,
      skipped: 0,
      time: 1.1,
      version: '1.22.1',
      failures: [
        new TestCase('foo/bar', 'baz_test.go', 1, 'Test1', 'error1\noccurred'),
        new TestCase('foo/bar', 'baz_test.go', 2, 'Test2', 'error2\noccurred')
      ]
    } as JUnitReport)

    expect(module.makeAnnotationMessages()).toEqual([
      '::error file=path/to/foo/bar/baz_test.go,line=1::error1\noccurred',
      '::error file=path/to/foo/bar/baz_test.go,line=2::error2\noccurred'
    ])
  })
})
