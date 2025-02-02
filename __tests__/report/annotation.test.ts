import { AnnotationReport } from '../../src/report/annotation'

describe('Annotation', () => {
  const testCases = [
    {
      name: 'should render a failure',
      input: {
        path: 'path/to/app/foo.go',
        line: 12,
        message: 'Error'
      },
      expected: {
        index: 'path/to/app/foo.go:12',
        record: {
          body: '::error file=path/to/app/foo.go,line=12::Error'
        }
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const view = new AnnotationReport(input.path, input.line, input.message)
    expect(view.index).toEqual(expected.index)
    expect(view.record).toEqual(expected.record)
  })
})
