import { toAnnotations } from "../../src/composer/annotation"
import { FailureReport } from "../../src/report/type"

describe('ReportAggregator#toAnnotations', () => {
  const failureReportMock = jest.fn<FailureReport, []>(() => ({
    index: 'path/to/app/foo.go:12',
    record: {
      type: 'test',
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
      name: 'should get annotation array with no failures',
      input: {
        path: 'path/to',
        failures: []
      },
      expected: []
    },
    {
      name: 'should get annotation array with one failure',
      input: {
        path: 'path/to',
        failures: [failureReportMock()]
      },
      expected: ['::error file=path/to/app/foo.go,line=12::Error']
    },
    {
      name: 'should get annotation array with two failures',
      input: {
        path: 'path/to',
        failures: [failureReportMock(), failureReportMock()]
      },
      expected: [
        '::error file=path/to/app/foo.go,line=12::Error',
        '::error file=path/to/app/foo.go,line=12::Error'
      ]
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const result = toAnnotations(input.failures)
    expect(result).toEqual(expected)
  })
})

