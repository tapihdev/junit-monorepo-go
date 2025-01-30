import { Result } from '../../src/type'
import { GolangCILintSummaryReportImpl } from '../../src/report/golangcilint'

describe('GolangCILintSummaryImpl', () => {
  const context = {
    owner: 'owner',
    repo: 'repo',
    sha: 'sha'
  }
  const testCases = [
    {
      name: 'should render a passed summary',
      input: {
        context,
        moduleDir: 'path/to/go',
        result: Result.Passed
      },
      expected: {
        index:
          '[path/to/go](https://github.com/owner/repo/blob/sha/path/to/go)',
        record: {
          result: '✅Passed'
        }
      }
    },
    {
      name: 'should render a failed summary',
      input: {
        context,
        moduleDir: 'path/to/go',
        result: Result.Failed
      },
      expected: {
        index:
          '[path/to/go](https://github.com/owner/repo/blob/sha/path/to/go)',
        record: {
          result: '❌Failed'
        }
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const summary = new GolangCILintSummaryReportImpl(
      input.context,
      input.moduleDir,
      input.result
    )
    expect(summary.index).toEqual(expected.index)
    expect(summary.record).toEqual(expected.record)
  })
})
