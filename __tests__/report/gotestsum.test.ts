import { Result } from '../../src/common/type'
import { GotestsumSummaryReportImpl } from '../../src/report/gotestsum'

describe('GotestsumSummary', () => {
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
        result: Result.Passed,
        passed: 1,
        failed: 0,
        time: 1.1,
        version: '1.23.2'
      },
      expected: {
        index:
          '[path/to/go](https://github.com/owner/repo/blob/sha/path/to/go)',
        record: {
          version: '1.23.2',
          result: '✅Passed',
          passed: '1',
          failed: '0',
          time: '1.1s'
        }
      }
    },
    {
      name: 'should render a failed summary',
      input: {
        context,
        moduleDir: 'path/to/go',
        result: Result.Failed,
        passed: 0,
        failed: 1,
        time: 1.2,
        version: '1.23.2'
      },
      expected: {
        index:
          '[path/to/go](https://github.com/owner/repo/blob/sha/path/to/go)',
        record: {
          version: '1.23.2',
          result: '❌Failed',
          passed: '0',
          failed: '1',
          time: '1.2s'
        }
      }
    },
    {
      name: 'should render a summary with undefined',
      input: {
        context,
        moduleDir: 'path/to/go',
        result: Result.Failed,
        passed: 0,
        failed: 0,
        time: undefined,
        version: undefined
      },
      expected: {
        index:
          '[path/to/go](https://github.com/owner/repo/blob/sha/path/to/go)',
        record: {
          version: undefined,
          result: '❌Failed',
          passed: '0',
          failed: '0',
          time: undefined
        }
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const summary = new GotestsumSummaryReportImpl(
      context,
      input.moduleDir,
      input.result,
      input.passed,
      input.failed,
      input.version,
      input.time
    )
    expect(summary.index).toEqual(expected.index)
    expect(summary.record).toEqual(expected.record)
  })
})
