import { GoModule } from '../src/module'
import { GotestsumReport } from '../src/junit/gotestsum'
import { Reporter, Result, Case } from '../src/junit/reporter'
import {
  ModuleTableRecord,
  FailedTestTableRecord,
  FailedLintTableRecord
} from '../src/type'

describe('module', () => {
  it('should construct a module', async () => {
    const fromXMLMock = jest
      .spyOn(GotestsumReport, 'fromXml')
      .mockResolvedValue(new GotestsumReport({ testsuites: {} }))
    const module = await GoModule.fromXml('path/to', 'junit.xml')
    expect(module.directory).toBe('path/to')
    expect(fromXMLMock).toHaveBeenCalledWith('path/to/junit.xml')
    expect(module.hasTestReport).toBe(true)
    expect(module.hasLintReport).toBe(false)
  })

  it('should throw an error if both test and lint paths are not specified', async () => {
    await expect(GoModule.fromXml('path/to')).rejects.toThrow(
      'Either testPath or lintPath must be specified'
    )
  })

  it('should make a module table record with test', async () => {
    const module = new GoModule('path/to', {
      result: Result.Passed,
      tests: 4,
      passed: 3,
      failed: 1,
      skipped: 0,
      time: 1.1,
      version: '1.22.1',
      failures: []
    } as Reporter)

    expect(module.result).toBe(Result.Passed)
    expect(module.hasTestReport).toBe(true)
    expect(module.hasLintReport).toBe(false)
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

  it('should make a module table record with lint', async () => {
    const module = new GoModule('path/to', undefined, {
      result: Result.Passed,
      tests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      time: 0,
      version: undefined,
      failures: []
    } as Reporter)

    expect(module.result).toBe(Result.Passed)
    expect(module.hasTestReport).toBe(false)
    expect(module.hasLintReport).toBe(true)
    expect(module.makeModuleTableRecord('owner', 'repo', 'sha')).toEqual({
      name: '[path/to](https://github.com/owner/repo/blob/sha/path/to)',
      version: '-',
      testResult: '-',
      testPassed: '-',
      testFailed: '-',
      testElapsed: '-',
      lintResult: '✅Passed'
    } as ModuleTableRecord)
  })

  it('should make a module table record with test and lint', async () => {
    const module = new GoModule(
      'path/to',
      {
        result: Result.Passed,
        tests: 4,
        passed: 3,
        failed: 1,
        skipped: 0,
        time: 1.1,
        version: '1.22.1',
        failures: []
      } as Reporter,
      {
        result: Result.Failed,
        tests: 4,
        passed: 3,
        failed: 1,
        skipped: 0,
        failures: [
          {
            subDir: 'foo/bar',
            file: 'baz_test.go',
            line: 1,
            test: 'Test1',
            message: 'error1\noccurred'
          },
          {
            subDir: 'foo/bar',
            file: 'baz_test.go',
            line: 2,
            test: 'Test2',
            message: 'error2\noccurred'
          }
        ] as Case[]
      } as Reporter
    )

    expect(module.result).toBe(Result.Failed)
    expect(module.hasTestReport).toBe(true)
    expect(module.hasLintReport).toBe(true)
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

  it('should make a failed test table record', async () => {
    const module = new GoModule('path/to', {
      result: Result.Failed,
      tests: 4,
      passed: 3,
      failed: 1,
      skipped: 0,
      time: 1.1,
      version: '1.22.1',
      failures: [
        {
          subDir: 'foo/bar',
          file: 'baz_test.go',
          line: 1,
          test: 'Test1',
          message: 'error1\noccurred'
        },
        {
          subDir: 'foo/bar',
          file: 'baz_test.go',
          line: 2,
          test: 'Test2',
          message: 'error2\noccurred'
        }
      ] as Case[]
    } as Reporter)

    expect(module.result).toBe(Result.Failed)
    expect(module.hasTestReport).toBe(true)
    expect(module.hasLintReport).toBe(false)
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

  it('should make a failed lint table record', async () => {
    const module = new GoModule(
      'path/to',
      {
        result: Result.Failed,
        tests: 4,
        passed: 3,
        failed: 1,
        skipped: 0,
        time: 1.1,
        version: '1.22.1',
        failures: []
      } as Reporter,
      {
        result: Result.Failed,
        tests: 4,
        passed: 3,
        failed: 1,
        skipped: 0,
        failures: [
          {
            subDir: 'foo/bar',
            file: 'baz_test.go',
            line: 1,
            test: 'Test1',
            message: 'error1\noccurred'
          },
          {
            subDir: 'foo/bar',
            file: 'baz_test.go',
            line: 2,
            test: 'Test2',
            message: 'error2\noccurred'
          }
        ] as Case[]
      } as Reporter
    )

    expect(module.result).toBe(Result.Failed)
    expect(module.hasTestReport).toBe(true)
    expect(module.hasLintReport).toBe(true)
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

  it('should make annotation messages', async () => {
    const module = new GoModule(
      'path/to',
      {
        result: Result.Failed,
        tests: 4,
        passed: 3,
        failed: 1,
        skipped: 0,
        time: 1.1,
        version: '1.22.1',
        failures: [
          {
            subDir: 'foo/bar',
            file: 'baz_test.go',
            line: 1,
            test: 'Test1',
            message: 'error1\noccurred'
          }
        ] as Case[]
      } as Reporter,
      {
        result: Result.Failed,
        tests: 4,
        passed: 3,
        failed: 1,
        skipped: 0,
        time: 1.1,
        version: '1.22.1',
        failures: [
          {
            subDir: 'foo/bar',
            file: 'baz_test.go',
            line: 2,
            test: 'Test2',
            message: 'error2\noccurred'
          }
        ] as Case[]
      } as Reporter
    )

    expect(module.makeAnnotationMessages()).toEqual([
      '::error file=path/to/foo/bar/baz_test.go,line=1::error1\noccurred',
      '::error file=path/to/foo/bar/baz_test.go,line=2::error2\noccurred'
    ])
  })
})
