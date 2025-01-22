import { AnnotationViewImpl } from '../../src/data/annotation'

describe('Annotation', () => {
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
        }
      },
      expected: `::error file=path/to/app/foo.go,line=12::Error`
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const view = new AnnotationViewImpl(input.path, input.failure)
    const result = view.render()
    expect(result).toEqual({ body: expected })
  })
})
