import { FailureReportImpl } from '../../src/report/failure'
import { ReporterType } from '../../src/type'

describe('Failure', () => {
  const testCases = [
    {
      name: 'should render a failure',
      input: {
        moduleDir: 'path/to/go',
        subDir: 'app',
        file: 'foo.go',
        line: 12,
        test: 'errcheck',
        message: 'Error',
        type: ReporterType.GolangCILint
      },
      expected: {
        index: 'path/to/go/app/foo.go:12',
        record: {
          type: ReporterType.GolangCILint,
          test: 'errcheck',
          message: 'Error'
        }
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const failure = new FailureReportImpl(input.type, input.moduleDir, input.subDir, input.file, input.line, input.test, input.message)
    const index = failure.toIndex()
    const record = failure.toRecord()
    expect(index).toEqual(expected.index)
    expect(record).toEqual(expected.record)
  })
})
