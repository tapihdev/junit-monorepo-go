import { GotestsumTable } from '../../src/table/gotestsum'
import { GotestsumSummaryReport } from '../../src/report/type'
import { Result } from '../../src/type'
import { Align } from '../../src/table/base/type'

describe('GotestsumTable', () => {
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
  const header = {
    index: 'Module',
    values: {
      version: 'Version',
      result: 'Result',
      passed: 'Passed',
      failed: 'Failed',
      time: 'Time'
    }
  }
  const separator = {
    index: Align.Left,
    values: {
      version: Align.Right,
      result: Align.Left,
      passed: Align.Right,
      failed: Align.Right,
      time: Align.Right
    }
  }

  const testCases = [
    {
      name: 'should render a table with no reports',
      input: {
        reports: []
      },
      expected: {
        header,
        separator,
        records: 0
      }
    },
    {
      name: 'should render a table with one report',
      input: {
        reports: [gotestsumSummaryMock()]
      },
      expected: {
        header,
        separator,
        records: 1
      }
    },
    {
      name: 'should render a table with two reports',
      input: {
        reports: [gotestsumSummaryMock(), gotestsumSummaryMock()]
      },
      expected: {
        header,
        separator,
        records: 2
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const view = new GotestsumTable(input.reports)
    const result = view.toTable()
    expect(result.header).toEqual(expected.header)
    expect(result.separator).toEqual(expected.separator)
    expect(result.records.length).toEqual(expected.records)
  })
})
