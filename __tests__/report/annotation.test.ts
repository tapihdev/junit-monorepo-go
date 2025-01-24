import { AnnotationReportImpl } from '../../src/report/annotation'

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
    const view = new AnnotationReportImpl(input.path, input.line, input.message)
    const index = view.toIndex()
    const record = view.toRecord()
    expect(index).toEqual(expected.index)
    expect(record).toEqual(expected.record)
  })
})
