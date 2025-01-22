import { FailureSummaryViewImpl } from '../../src/data/failure'

describe('Failure', () => {
  const testCases = [
    {
      name: 'should render a failure',
      input: {
        path: 'path/to',
        failure: {
          subDir: 'app',
          file: 'foo.go',
          line: 12,
          test: 'errcheck',
          message: 'Error'
        },
        context: {
          owner: 'owner',
          repo: 'repo',
          sha: 'sha'
        }
      },
      expected: {
        file: '[path/to/app/foo.go:12](https://github.com/owner/repo/blob/sha/path/to/app/foo.go#L12)',
        test: 'errcheck',
        message: 'Error'
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const view = new FailureSummaryViewImpl(input.path, input.failure)
    const result = view.render(
      input.context.owner,
      input.context.repo,
      input.context.sha
    )
    expect(result).toEqual(expected)
  })
})
