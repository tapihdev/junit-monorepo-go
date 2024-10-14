import { Module } from '../src/module'
import { JUnitReport as JUnitReportXML } from '../src/junit/xml'
import { GotestsumReport } from '../src/junit/reporter/gotestsum'
import { JUnitReport, TestResult, TestCase } from '../src/junit/type'

describe('module', () => {
  it('constructs a module', async () => {
    const fromXMLMock = jest.spyOn(GotestsumReport, 'fromXml').mockResolvedValue(
      new GotestsumReport(
        'path/to',
        { testsuites: {} },
      )
    )
    const module = await Module.fromXml('path/to', 'junit.xml')
    expect(module.directory).toBe('path/to')
    expect(fromXMLMock).toHaveBeenCalledWith('path/to/junit.xml')
  })

  it('makes a module table record', async () => {
    const module = new Module('path/to', {
      directory: 'path/to',
      result: TestResult.Passed,
      tests: 4,
      passed: 3,
      failed: 1,
      skipped: 0,
      time: 1.10,
      version: '1.22.1',
      failures: [],
    } as JUnitReport)

    expect(module.makeModuleTableRecord('owner', 'repo', 'sha')).toEqual(
      '| [path/to](https://github.com/owner/repo/blob/sha/path/to) | 1.22.1 | ✅Passed | 3 | 1 | 0 | 1.1s |'
    )
  })

  it('makes a failed test table record', async () => {
    const module = new Module('path/to', {
      directory: 'path/to',
      result: TestResult.Failed,
      tests: 4,
      passed: 3,
      failed: 1,
      skipped: 0,
      time: 1.10,
      version: '1.22.1',
      failures: [
        new TestCase('path/to', 'foo/bar', 'baz_test.go', 1, 'Test1', 'error1\noccurred'),
        new TestCase('path/to', 'foo/bar', 'baz_test.go', 2, 'Test2', 'error2\noccurred'),
      ],
    } as JUnitReport)

    expect(module.makeFailedTestTableRecords('owner', 'repo', 'sha')).toEqual(`
| [path/to/foo/bar/baz_test.go:1](https://github.com/owner/repo/blob/sha/path/to/foo/bar/baz_test.go#L1) | Test1 | error1 occurred |
| [path/to/foo/bar/baz_test.go:2](https://github.com/owner/repo/blob/sha/path/to/foo/bar/baz_test.go#L2) | Test2 | error2 occurred |
`.slice(1, -1))
  })

  it('makes a failed lint table record', async () => {
    const module = new Module('path/to', {
      directory: 'path/to',
      result: TestResult.Failed,
      tests: 4,
      passed: 3,
      failed: 1,
      skipped: 0,
      time: 1.10,
      version: '1.22.1',
      failures: [],
    } as JUnitReport)

    expect(module.makeFailedLintTableRecords()).toEqual('')
  })

  it('makes annotation messages', async () => {
    const module = new Module('path/to', {
      directory: 'path/to',
      result: TestResult.Failed,
      tests: 4,
      passed: 3,
      failed: 1,
      skipped: 0,
      time: 1.10,
      version: '1.22.1',
      failures: [
        new TestCase('path/to', 'foo/bar', 'baz_test.go', 1, 'Test1', 'error1\noccurred'),
        new TestCase('path/to', 'foo/bar', 'baz_test.go', 2, 'Test2', 'error2\noccurred'),
      ],
    } as JUnitReport)

    expect(module.makeAnnotationMessages()).toEqual([
      '::error file=path/to/foo/bar/baz_test.go,line=1::error1\noccurred',
      '::error file=path/to/foo/bar/baz_test.go,line=2::error2\noccurred',
    ])
  })
})
