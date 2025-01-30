import { FailureReportImpl } from '../../src/report/failure'
import { ReporterType } from '../../src/type'

describe('Failure', () => {
  const context = {
    owner: 'owner',
    repo: 'repo',
    sha: 'sha'
  }
  const testCases = [
    {
      name: 'should render a failure',
      input: {
        context,
        moduleDir: 'path/to/go',
        subDir: 'app',
        file: 'foo.go',
        line: 12,
        test: 'errcheck',
        message: 'Error',
        type: ReporterType.GolangCILint
      },
      expected: {
        index:
          '[path/to/go/app/foo.go:12](https://github.com/owner/repo/blob/sha/path/to/go/app/foo.go#L12)',
        record: {
          type: ReporterType.GolangCILint,
          test: 'errcheck',
          message: 'Error'
        },
        annotation: {
          filePath: 'path/to/go/app/foo.go',
          line: 12,
          message: 'Error'
        }
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const failure = new FailureReportImpl(
      input.context,
      input.type,
      input.moduleDir,
      input.subDir,
      input.file,
      input.line,
      input.test,
      input.message
    )
    expect(failure.index).toEqual(expected.index)
    expect(failure.record).toEqual(expected.record)
    expect(failure.annotation).toEqual(expected.annotation)
  })
})
