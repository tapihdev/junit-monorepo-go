import {
  GotestsumSummaryViewImpl,
  GolangCILintSummaryViewImpl
} from '../../src/data/summary'
import { Result } from '../../src/type'

describe('GotestsumSummaryViewImpl', () => {
  const testCases = [
    {
      name: 'should render a passed summary',
      input: {
        path: 'path/to',
        summary: {
          result: Result.Passed,
          passed: 1,
          failed: 0,
          time: 1.1,
          version: '1.23.2'
        },
        context: {
          owner: 'owner',
          repo: 'repo',
          sha: 'sha'
        }
      },
      expected: {
        path: '[path/to](https://github.com/owner/repo/blob/sha/path/to)',
        version: '1.23.2',
        result: '✅Passed',
        passed: '1',
        failed: '0',
        time: '1.1s'
      }
    },
    {
      name: 'should render a failed summary',
      input: {
        path: 'path/to',
        summary: {
          result: Result.Failed,
          passed: 0,
          failed: 1,
          time: 1.2,
          version: '1.23.2'
        },
        context: {
          owner: 'owner',
          repo: 'repo',
          sha: 'sha'
        }
      },
      expected: {
        path: '[path/to](https://github.com/owner/repo/blob/sha/path/to)',
        version: '1.23.2',
        result: '❌Failed',
        passed: '0',
        failed: '1',
        time: '1.2s'
      }
    },
    {
      name: 'should render a summary with undefined',
      input: {
        path: 'path/to',
        summary: {
          result: Result.Failed,
          passed: 0,
          failed: 0,
          time: undefined,
          version: undefined
        },
        context: {
          owner: 'owner',
          repo: 'repo',
          sha: 'sha'
        }
      },
      expected: {
        path: '[path/to](https://github.com/owner/repo/blob/sha/path/to)',
        version: '-',
        result: '❌Failed',
        passed: '0',
        failed: '0',
        time: '-'
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const view = new GotestsumSummaryViewImpl(input.path, input.summary)
    const result = view.render(
      input.context.owner,
      input.context.repo,
      input.context.sha
    )
    expect(result).toEqual(expected)
  })
})

describe('GolangCILintSummaryImpl', () => {
  const testCases = [
    {
      name: 'should render a passed summary',
      input: {
        path: 'path/to',
        summary: {
          result: Result.Passed
        },
        context: {
          owner: 'owner',
          repo: 'repo',
          sha: 'sha'
        }
      },
      expected: {
        path: '[path/to](https://github.com/owner/repo/blob/sha/path/to)',
        result: '✅Passed'
      }
    },
    {
      name: 'should render a failed summary',
      input: {
        path: 'path/to',
        summary: {
          result: Result.Failed
        },
        context: {
          owner: 'owner',
          repo: 'repo',
          sha: 'sha'
        }
      },
      expected: {
        path: '[path/to](https://github.com/owner/repo/blob/sha/path/to)',
        result: '❌Failed'
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const view = new GolangCILintSummaryViewImpl(input.path, input.summary)
    const result = view.render(
      input.context.owner,
      input.context.repo,
      input.context.sha
    )
    expect(result).toEqual(expected)
  })
})
