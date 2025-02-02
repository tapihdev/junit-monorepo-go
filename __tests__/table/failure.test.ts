import { FailureTable } from '../../src/table/failure'
import { ReportableFailure } from '../../src/report/type'
import { ReporterType } from '../../src/common/type'
import { Align } from '../../src/table/base/type'

describe('FailureTable', () => {
  const failureReportMock = jest.fn<ReportableFailure, []>(() => ({
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
  const header = {
    index: 'File',
    values: {
      type: 'Type',
      test: 'Case',
      message: 'Message'
    }
  }
  const separator = {
    index: Align.Left,
    values: {
      type: Align.Left,
      test: Align.Left,
      message: Align.Left
    }
  }

  const testCases = [
    {
      name: 'should render failures less than limit',
      input: {
        limit: 10,
        failures: [failureReportMock()]
      },
      expected: {
        header,
        separator,
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
        header,
        separator,
        records: 2
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const view = new FailureTable(input.failures)
    const result = view.toTable(input.limit)
    expect(result.header).toEqual(expected.header)
    expect(result.separator).toEqual(expected.separator)
    expect(result.records.length).toEqual(expected.records)
  })
})
