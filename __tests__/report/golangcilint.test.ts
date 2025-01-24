import { Result } from '../../src/type'
import { GolangCILintReportImpl } from '../../src/report/golangcilint'

describe('GolangCILintSummaryImpl', () => {
  const testCases = [
    {
      name: 'should render a passed summary',
      input: {
        moduleDir: 'path/to/go',
        result: Result.Passed,
      },
      expected: {
        index: 'path/to/go',
        record: {
          result: '✅Passed',
        }
      }
    },
    {
      name: 'should render a failed summary',
      input: {
        moduleDir: 'path/to/go',
        result: Result.Failed,
      },
      expected: {
        index: 'path/to/go',
        record: {
          result: '❌Failed',
        }
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const summary = new GolangCILintReportImpl(input.moduleDir, input.result)
    const index = summary.toIndex()
    const record = summary.toRecord()
    expect(index).toEqual(expected.index)
    expect(record).toEqual(expected.record)
  })
})
