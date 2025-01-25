import { TableComposerImpl } from '../../src/composer/table'
import {
  FailureReport,
  GolangCILintSummaryReport,
  GotestsumSummaryReport
} from '../../src/report/type'
import { ReporterType, Result } from '../../src/type'

describe('TableComposerImpl#toGotestsumTable', () => {
  const gotestsumSummaryMock = jest.fn<GotestsumSummaryReport, []>(() => ({
    index: 'path/to/app/foo.go',
    record: {
      version: '1.23.2',
      result: Result.Passed,
      passed: '1',
      failed: '0',
      time: '1.1s'
    }
  }))

  const testCases = [
    {
      name: 'should render a table with no reports',
      input: {
        reports: []
      },
      expected: {
        header: {
          index: 'Module',
          values: {
            version: 'Version',
            result: 'Test',
            passed: 'Passed',
            failed: 'Failed',
            time: 'Time'
          }
        },
        separator: {
          index: ':-----',
          values: {
            version: '------:',
            result: ':---',
            passed: '-----:',
            failed: '-----:',
            time: '---:'
          }
        },
        records: []
      }
    },
    {
      name: 'should render a table with one report',
      input: {
        reports: [gotestsumSummaryMock()]
      },
      expected: {
        header: {
          index: 'Module',
          values: {
            version: 'Version',
            testResult: 'Test',
            testPassed: 'Passed',
            testFailed: 'Failed',
            testElapsed: 'Time',
            lintResult: 'Lint'
          }
        },
        separator: {
          index: ':-----',
          values: {
            version: '------:',
            testResult: ':---',
            testPassed: '-----:',
            testFailed: '-----:',
            testElapsed: '---:',
            lintResult: ':---'
          }
        },
        records: 1
      }
    },
    {
      name: 'should render a table with two reports',
      input: {
        reports: [gotestsumSummaryMock(), gotestsumSummaryMock()]
      },
      expected: {
        header: {
          index: 'Module',
          values: {
            version: 'Version',
            testResult: 'Test',
            testPassed: 'Passed',
            testFailed: 'Failed',
            testElapsed: 'Time',
            lintResult: 'Lint'
          }
        },
        separator: {
          index: ':-----',
          values: {
            version: '------:',
            testResult: ':---',
            testPassed: '-----:',
            testFailed: '-----:',
            testElapsed: '---:',
            lintResult: ':---'
          }
        },
        records: 2
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const view = new TableComposerImpl()
    const result = view.toGotestsumTable(input.reports)
    expect(result.header).toEqual(expected.header)
    expect(result.separator).toEqual(expected.separator)
    expect(result.records.length).toEqual(expected.records)
  })
})

describe('TableComposerImpl#toGolangCILintTable', () => {
  const golangCILintSummaryMock = jest.fn<GolangCILintSummaryReport, []>(
    () => ({
      index: 'path/to/app/foo.go',
      record: {
        type: ReporterType.GolangCILint,
        test: 'test name',
        message: 'Error',
        result: Result.Passed
      }
    })
  )

  const testCases = [
    {
      name: 'should render a table with no reports',
      input: {
        reports: []
      },
      expected: {
        header: {
          index: 'Module',
          values: {
            type: 'Type',
            test: 'Test',
            message: 'Message'
          }
        },
        separator: {
          index: ':-----',
          values: {
            type: ':---',
            test: ':---',
            message: ':---'
          }
        },
        records: []
      }
    },
    {
      name: 'should render a table with one report',
      input: {
        reports: [golangCILintSummaryMock()]
      },
      expected: {
        header: {
          index: 'Module',
          values: {
            type: 'Type',
            test: 'Test',
            message: 'Message'
          }
        },
        separator: {
          index: ':-----',
          values: {
            type: ':---',
            test: ':---',
            message: ':---'
          }
        },
        records: 1
      }
    },
    {
      name: 'should render a table with two reports',
      input: {
        reports: [golangCILintSummaryMock(), golangCILintSummaryMock()]
      },
      expected: {}
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const view = new TableComposerImpl()
    const result = view.toGolangCILintTable(input.reports)
    expect(result.header).toEqual(expected.header)
    expect(result.separator).toEqual(expected.separator)
    expect(result.records.length).toEqual(expected.records)
  })
})

describe('TableComposerImpl#toFailuresTable', () => {
  const failureReportMock = jest.fn<FailureReport, []>(() => ({
    index: 'path/to/app/foo.goResult, :12',
    record: {
      type: ReporterType.GolangCILint,
      test: 'test name',
      message: 'Error'
    },
    annotation: {
      index: 'path/to/app/foo.go:12',
      record: {
        body: '::error file=path/to/app/foo.go,line=12::Error'
      }
    }
  }))

  const testCases = [
    {
      name: 'should render failures less than limit',
      input: {
        limit: 10,
        failures: [failureReportMock()]
      },
      expected: {
        header: {
          index: 'Module',
          values: {
            type: 'Type',
            test: 'Test',
            message: 'Message'
          }
        },
        separator: {
          index: ':-----',
          values: {
            type: ':---',
            test: ':---',
            message: ':---'
          }
        },
        records: 1
      }
    },
    {
      name: 'should render failures more than limit',
      input: {
        limit: 1,
        failures: [
          failureReportMock(),
          failureReportMock(),
          failureReportMock()
        ]
      },
      expected: {
        header: {
          index: 'Module',
          values: {
            type: 'Type',
            test: 'Test',
            message: 'Message'
          }
        },
        separator: {
          index: ':-----',
          values: {
            type: ':---',
            test: ':---',
            message: ':---'
          }
        },
        records: 2
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const view = new TableComposerImpl()
    const result = view.toFailuresTable(input.failures, input.limit)
    expect(result.header).toEqual(expected.header)
    expect(result.separator).toEqual(expected.separator)
    expect(result.records.length).toEqual(expected.records)
  })
})
