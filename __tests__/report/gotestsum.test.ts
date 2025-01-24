import { Result } from '../../src/type'
import { GotestsumReportImpl } from '../../src/report/gotestsum'

describe('GotestsumSummary', () => {
  const testCases = [
    {
      name: 'should render a passed summary',
      input: {
        moduleDir: 'path/to/go',
        result: Result.Passed,
        passed: 1,
        failed: 0,
        time: 1.1,
        version: '1.23.2'
      },
      expected: {
        index: 'path/to/go',
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
        moduleDir: 'path/to/go',
        result: Result.Failed,
        passed: 0,
        failed: 1,
        time: 1.2,
        version: '1.23.2'
      },
      expected: {
        index: 'path/to/go',
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
        moduleDir: 'path/to/go',
        result: Result.Failed,
        passed: 0,
        failed: 0,
        time: undefined,
        version: undefined
      },
      expected: {
        index: 'path/to/go',
        record: {
          version: '-',
          result: '❌Failed',
          passed: '0',
          failed: '0',
          time: '-'
        }
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const summary = new GotestsumReportImpl(input.moduleDir, input.result, input.passed, input.failed, input.version, input.time)
    const index = summary.toIndex()
    const record = summary.toRecord()
    expect(index).toEqual(expected.index)
    expect(record).toEqual(expected.record)
  })
})
