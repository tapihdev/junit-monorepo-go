import { GolangCILintTable } from '../../src/table/golangcilint'
import { GolangCILintSummaryReport } from '../../src/report/type'
import { Result } from '../../src/type'
import { Align } from '../../src/table/base/type'

describe('GolangCILintTable', () => {
  const golangCILintSummaryMock = jest.fn<GolangCILintSummaryReport, []>(
    () => ({
      index: 'path/to/app/foo.go',
      record: {
        result: Result.Passed
      }
    })
  )
  const header = {
    index: 'Module',
    values: {
      result: 'Result'
    }
  }
  const separator = {
    index: Align.Left,
    values: {
      result: Align.Left
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
        reports: [golangCILintSummaryMock()]
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
        reports: [golangCILintSummaryMock(), golangCILintSummaryMock()]
      },
      expected: {
        header,
        separator,
        records: 2
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const view = new GolangCILintTable(input.reports)
    const result = view.toTable()
    expect(result.header).toEqual(expected.header)
    expect(result.separator).toEqual(expected.separator)
    expect(result.records.length).toEqual(expected.records)
  })
})
